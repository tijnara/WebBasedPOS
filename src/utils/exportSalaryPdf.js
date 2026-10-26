// src/utils/exportSalaryPdf.js

export const exportSalaryHistoryPDF = async ({
                                                 period,
                                                 filterEmployee = 'all',
                                                 records = [],
                                                 periodTotal = 0
                                             }) => {
    if (typeof window === 'undefined') return;

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    // Top Brand Accent Bar (Seaside Lime Green)
    doc.setFillColor(141, 182, 0);
    doc.rect(0, 0, 210, 6, 'F');

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('SEASIDE PURIFIED WATER REFILLING STATION', 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Salary History (Gross Payouts Report)', 14, 24);

    // Metadata Left Column
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Payroll Period: ${period.start} to ${period.end}`, 14, 32);
    doc.text(`Staff Filter: ${filterEmployee === 'all' ? 'All Employees' : filterEmployee}`, 14, 37);

    // Metadata Right Column
    const generatedAt = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    doc.text(`Generated: ${generatedAt} (PHT)`, 125, 32);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52); // emerald-800
    const formattedGrandTotal = `PHP ${Number(periodTotal || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
    doc.text(`Total Gross Payout: ${formattedGrandTotal}`, 125, 37);

    // Horizontal Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 41, 196, 41);

    // Prepare Table Rows
    const tableRows = records.length > 0
        ? records.map((r) => {
            const dateStr = r.date
                ? new Date(r.date).toLocaleString('en-US', {
                    timeZone: 'Asia/Manila',
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                })
                : 'N/A';

            const numAmt = Number(r.amount || 0);
            const formattedAmt = `${numAmt < 0 ? '-' : ''}PHP ${Math.abs(numAmt).toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;

            return [
                dateStr,
                r.employee_name || 'N/A',
                r.description || 'Salary Payout',
                formattedAmt
            ];
        })
        : [['No records found for this period', '', '', 'PHP 0.00']];

    // Generate AutoTable
    autoTable(doc, {
        startY: 45,
        head: [['Date & Time', 'Employee', 'Description / Breakdown', 'Gross Amount']],
        body: tableRows,
        foot: [
            ['', '', 'Total Payouts', formattedGrandTotal]
        ],
        theme: 'striped',
        headStyles: {
            fillColor: [30, 41, 59], // slate-800
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8.5,
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [51, 65, 85],
        },
        footStyles: {
            fillColor: [241, 245, 249],
            textColor: [15, 23, 42],
            fontStyle: 'bold',
            fontSize: 8.5,
        },
        columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 38 },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
        },
        didDrawPage: (data) => {
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184);

            doc.text(
                'Confidential • Seaside WRS POS & Management System',
                14,
                doc.internal.pageSize.height - 8
            );
            doc.text(
                `Page ${data.pageNumber} of ${pageCount}`,
                doc.internal.pageSize.width - 28,
                doc.internal.pageSize.height - 8
            );
        }
    });

    const safeEmployee = (filterEmployee || 'All').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`Salary_History_${period.start}_to_${period.end}_${safeEmployee}.pdf`);
};