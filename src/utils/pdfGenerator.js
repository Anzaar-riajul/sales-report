import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generateReportPDF(report, elementId, filename) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('PDF element not found');

  const canvas = await html2canvas(element, {
    scale: 4,
    useCORS: true,
    logging: false,
    backgroundColor: '#FFFFFF',
    windowWidth: 500,
    width: element.scrollWidth,
    height: element.scrollHeight,
    onclone: (doc) => {
      const el = doc.getElementById(elementId);
      if (el) {
        el.style.position = 'static';
        el.style.left = '0';
      }
    },
  });

  const imgData = canvas.toDataURL('image/png');
  const pxWidth = canvas.width;
  const pxHeight = canvas.height;

  const pdfWidth = 100;
  const pdfHeight = (pxHeight * pdfWidth) / pxWidth;

  const pdf = new jsPDF('p', 'mm', [pdfWidth, Math.max(pdfHeight, 30)]);
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

  const dateStr = report?.dateString || new Date().toISOString().split('T')[0];
  pdf.save(filename || `Anzaar-Report-${dateStr}.pdf`);
}
