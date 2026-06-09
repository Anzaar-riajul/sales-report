import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generateReportPDF(report, elementId, filename) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('PDF element not found');

  // Render at phone width for crisp text
  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    logging: false,
    backgroundColor: '#FFFFFF',
    windowWidth: 400,
  });

  const imgData = canvas.toDataURL('image/png');
  const pxWidth = canvas.width;
  const pxHeight = canvas.height;

  // Phone-proportioned PDF: 75mm wide (matches ~375px phone)
  const pdfWidth = 75;
  const pdfHeight = (pxHeight * pdfWidth) / pxWidth;

  // Create custom-size PDF matching phone proportions
  const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

  const dateStr = report?.dateString || new Date().toISOString().split('T')[0];
  pdf.save(filename || `Anzaar-Report-${dateStr}.pdf`);
}
