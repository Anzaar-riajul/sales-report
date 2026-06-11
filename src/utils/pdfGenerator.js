import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const MAX_JPG_SIZE = 10 * 1024 * 1024;

async function captureElement(elementId, opts = {}) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found');

  const { width = 500, scale = 2, bgColor = '#FFFFFF' } = opts;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: bgColor,
    windowWidth: width,
    width: element.scrollWidth,
    height: element.scrollHeight,
    onclone: (doc) => {
      const el = doc.getElementById(elementId);
      if (el) {
        el.style.position = 'static';
        el.style.left = '0';
        el.style.width = `${width}px`;
      }
    },
  });

  return { canvas, pxWidth: canvas.width, pxHeight: canvas.height };
}

export async function generateReportPDF(report, elementId, filename) {
  const { canvas, pxWidth, pxHeight } = await captureElement(elementId, {
    width: 420,
    scale: 2,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.85);
  const pdfWidth = 100;
  const pdfHeight = (pxHeight * pdfWidth) / pxWidth;

  const pdf = new jsPDF('p', 'mm', [pdfWidth, Math.max(pdfHeight, 30)]);
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

  const dateStr = report?.dateString || new Date().toISOString().split('T')[0];
  pdf.save(filename || `Anzaar-Report-${dateStr}.pdf`);
}

function canvasToJPG(canvas, quality) {
  return canvas.toDataURL('image/jpeg', quality);
}

function dataURLtoBytes(dataURL) {
  const base64 = dataURL.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function downloadBlob(bytes, filename, mime) {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function compressToUnder10MB(canvas, filename) {
  let quality = 0.92;
  let dataURL = canvasToJPG(canvas, quality);
  let bytes = dataURLtoBytes(dataURL);

  while (bytes.length > MAX_JPG_SIZE && quality > 0.1) {
    quality -= 0.08;
    dataURL = canvasToJPG(canvas, quality);
    bytes = dataURLtoBytes(dataURL);
  }

  downloadBlob(bytes, filename, 'image/jpeg');
  return { size: bytes.length, quality };
}

export async function generateReportJPG(report, elementId, filename, opts = {}) {
  const { mobile = false } = opts;

  const width = mobile ? 420 : 1080;
  const scale = mobile ? 2 : 3;

  const { canvas } = await captureElement(elementId, { width, scale });

  const dateStr = report?.dateString || new Date().toISOString().split('T')[0];
  const suffix = mobile ? '-Mobile' : '';
  const fname = filename || `Anzaar-Report${suffix}-${dateStr}.jpg`;

  const result = await compressToUnder10MB(canvas, fname);
  return result;
}

export async function generateBoth(report, elementId, baseFilename) {
  const pdfResult = await generateReportPDF(report, elementId, `${baseFilename}.pdf`);
  await generateReportJPG(report, elementId, `${baseFilename}.jpg`, { mobile: false });
  return pdfResult;
}
