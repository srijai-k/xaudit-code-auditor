import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AuditReport } from '../types';

export async function exportReportToPDF(report: AuditReport): Promise<void> {
    const reportElement = document.getElementById('report-container');
    if (!reportElement) {
        alert('Error: Report container not found. Please try again.');
        return;
    }

    try {
        // Wait a bit for any layout shifts or animations to settle
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(reportElement, {
            scale: 1.5, // Lower scale slightly for better performance/reliability
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 1400, // Fixed width for consistent layout capture
            scrollX: 0,
            scrollY: -window.scrollY // Fix for offset issues
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        // Add subsequent pages if content is long
        let pageCount = 1;
        while (heightLeft >= 0 && pageCount < 10) { // Limit to 10 pages to avoid infinite loops
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
            pageCount++;
        }

        const reportId = (report as any).id || 'latest';
        pdf.save(`auditx-report-${reportId}.pdf`);
    } catch (error) {
        console.error('PDF Export failed:', error);
        alert(`PDF Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
