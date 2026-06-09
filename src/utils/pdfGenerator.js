import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generateReportPDF(report, elementId, filename) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('PDF element not found');

  // Phone-view width (400px) for readable mobile-style layout
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#FFFFFF',
    windowWidth: 400,
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  const pdf = new jsPDF('p', 'mm', 'a4');
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const dateStr = report?.dateString || new Date().toISOString().split('T')[0];
  pdf.save(filename || `Anzaar-Report-${dateStr}.pdf`);
}
