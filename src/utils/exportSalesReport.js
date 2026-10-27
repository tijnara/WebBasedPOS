// src/utils/exportSalesReport.js
import { format } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';

const TIME_ZONE = 'Asia/Manila';

// --- 1. CSV EXPORT ---
export const exportSalesToCSV = ({ sales = [], activeRangeLabel = 'Sales_Report' }) => {
    if (typeof window === 'undefined' || sales.length === 0) return;

    const headers = [
        'Transaction ID',
        'Date',
        'Time',
        'Customer',
        'Items & Qty',
        'Total Qty',
        'Gross Amount (PHP)',
        'Payment Method',
        'Status',
        'Staff'
    ];

    const rows = sales.map((sale) => {
        const rawDate = sale.saleTimestamp || sale.saletimestamp || sale.date;
        const dateStr = rawDate ? formatInTimeZone(toDate(rawDate), TIME_ZONE, 'yyyy-MM-dd') : 'N/A';
        const timeStr = rawDate ? formatInTimeZone(toDate(rawDate), TIME_ZONE, 'h:mm a') : 'N/A';

        const itemsPurchased = (sale.sale_items || sale.items || [])
            .map((item) => `${item.productName || item.product_name || item.name || 'Refill'} (x${item.quantity || 0})`)
            .join('; ');

        const totalQty = (sale.sale_items || sale.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        const amount = Number(sale.totalAmount || sale.totalamount || 0).toFixed(2);
        const customer = sale.customerName || 'Walk-in';
        const payment = sale.paymentMethod || sale.paymentmethod || 'Cash';
        const status = sale.status || 'Completed';
        const staff = sale.staffName || 'Staff';

        // Escape double quotes in CSV fields
        return [
            sale.id,
            `"${dateStr}"`,
            `"${timeStr}"`,
            `"${customer.replace(/"/g, '""')}"`,
            `"${itemsPurchased.replace(/"/g, '""')}"`,
            totalQty,
            amount,
            `"${payment}"`,
            `"${status}"`,
            `"${staff.replace(/"/g, '""')}"`
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const safeLabel = activeRangeLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Seaside_Sales_${safeLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// --- 2. EXECUTIVE PDF EXPORT ---
export const exportSalesToPDF = async ({
                                           sales = [],
                                           totalRevenue = 0,
                                           totalGallons = 0,
                                           activeRangeLabel = 'All Time',
                                           productSummary = {}
                                       }) => {
    if (typeof window === 'undefined') return;

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    // Top Seaside Accent Bar
    doc.setFillColor(141, 182, 0); // Seaside Lime Green
    doc.rect(0, 0, 210, 6, 'F');

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('SEASIDE PURIFIED WATER REFILLING STATION', 14, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Executive Sales & Operations Report', 14, 23);

    // Left Column Info
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Selected Range: ${activeRangeLabel}`, 14, 30);
    doc.text(`Total Transactions: ${sales.length}`, 14, 35);

    // Right Column Info
    const generatedAt = new Date().toLocaleString('en-US', {
        timeZone: TIME_ZONE,
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    doc.text(`Generated: ${generatedAt} (PHT)`, 128, 30);

    const formattedRevenue = `PHP ${Number(totalRevenue || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52); // emerald-800
    doc.text(`Gross Revenue: ${formattedRevenue}`, 128, 35);

    // Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 39, 196, 39);

    // Summary Metric Cards
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 43, 88, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL REVENUE', 18, 48);
    doc.setFontSize(11);
    doc.setTextColor(22, 101, 52);
    doc.text(formattedRevenue, 18, 54);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(108, 43, 88, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL VOLUME DISBURSED', 112, 48);
    doc.setFontSize(11);
    doc.setTextColor(13, 148, 136); // teal-600
    doc.text(`${Number(totalGallons || 0).toLocaleString()} Gallons`, 112, 54);

    let startY = 62;

    // Optional: Product Breakdown Grid if items were sold
    const productEntries = Object.values(productSummary || {});
    if (productEntries.length > 0) {
        const productRows = productEntries.map(p => [
            p.name || 'Product',
            `${p.quantity || 0} units`,
            p.revenue ? `PHP ${Number(p.revenue).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'
        ]);

        autoTable(doc, {
            startY: startY,
            head: [['Product Category', 'Units Sold', 'Revenue Subtotal']],
            body: productRows,
            theme: 'grid',
            margin: { left: 14, right: 14 },
            headStyles: {
                fillColor: [71, 85, 105], // slate-600
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 7.5,
            },
            bodyStyles: {
                fontSize: 7.5,
                textColor: [51, 65, 85],
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 40, halign: 'center' },
                2: { cellWidth: 45, halign: 'right' }
            }
        });

        startY = doc.lastAutoTable.finalY + 8;
    }

    // Ledger Header Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('ITEMIZED TRANSACTION LEDGER', 14, startY);
    startY += 3;

    // Transaction Table Rows
    const tableRows = sales.map(sale => {
        const rawDate = sale.saleTimestamp || sale.saletimestamp || sale.date;
        const dateTimeStr = rawDate
            ? formatInTimeZone(toDate(rawDate), TIME_ZONE, 'MMM d, h:mm a')
            : 'N/A';

        const itemsStr = (sale.sale_items || sale.items || [])
            .map(item => `${item.productName || item.product_name || item.name || 'Item'} x${item.quantity}`)
            .join(', ');

        const amt = Number(sale.totalAmount || sale.totalamount || 0);
        const formattedAmt = `PHP ${amt.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        return [
            dateTimeStr,
            sale.customerName || 'Walk-in',
            itemsStr || 'Refill',
            sale.paymentMethod || sale.paymentmethod || 'Cash',
            sale.staffName || 'Staff',
            formattedAmt
        ];
    });

    autoTable(doc, {
        startY: startY,
        head: [['Date & Time', 'Customer', 'Items Purchased', 'Tender', 'Cashier', 'Amount']],
        body: tableRows.length > 0 ? tableRows : [['No sales found in this period', '', '', '', '', 'PHP 0.00']],
        foot: [
            ['', '', '', '', 'Total Gross Revenue', formattedRevenue]
        ],
        theme: 'striped',
        margin: { left: 14, right: 14 },
        headStyles: {
            fillColor: [30, 41, 59], // slate-800
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 7.5,
        },
        bodyStyles: {
            fontSize: 7,
            textColor: [51, 65, 85],
        },
        footStyles: {
            fillColor: [241, 245, 249],
            textColor: [15, 23, 42],
            fontStyle: 'bold',
            fontSize: 7.5,
        },
        columnStyles: {
            0: { cellWidth: 28 },
            1: { cellWidth: 32 },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
            5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
        }
    });

    // Page Numbering Footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);

        doc.text('Confidential • Seaside WRS Sales & Management System', 14, doc.internal.pageSize.height - 8);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 24, doc.internal.pageSize.height - 8);
    }

    const safeLabel = activeRangeLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`Seaside_Report_${safeLabel}.pdf`);
};