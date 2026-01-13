import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export const exportDashboardToPDF = async (elementId: string, filename: string = 'dashboard-report.pdf') => {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error('Element not found')
  }

  // Create canvas from element
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('landscape', 'mm', 'a4')
  
  const imgWidth = 297 // A4 width in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  
  // Add image to PDF
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
  
  // Add title
  pdf.setFontSize(20)
  pdf.text('Analytics Dashboard Report', 10, 10)
  
  // Add timestamp
  pdf.setFontSize(10)
  pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, 20)
  
  pdf.save(filename)
}

