// src/components/salary/SalaryHistoryCard.jsx
import React, { useState } from 'react';
import currency from 'currency.js';
import {
    Card, CardHeader, CardContent, Button, Input, Label, Select,
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '../ui';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { ChevronLeft, ChevronRight, Calendar, FileDown, Loader2 } from 'lucide-react';

const TIME_ZONE = 'Asia/Manila';

// Helper to split a salary record into separate Base Salary and Excess Bonus line items
const splitSalaryRecord = (record) => {
    const totalAmount = Number(record.amount || 0);
    const description = (record.description || 'Salary Payout').trim();
    const recordDate = record.expense_date || record.date;

    // Matches patterns like: "Excess Bonus (32 gal x1 = 32)" or "Excess Bonus (32 gal x 1 = 32.00)"
    const match = description.match(/Excess Bonus\s*\((.*?)=\s*([0-9.,]+)\)/i);

    if (match) {
        const bonusFormula = match[1].trim(); // e.g. "32 gal x1"
        const bonusAmount = parseFloat(match[2].replace(/,/g, '')) || 0;
        const baseAmount = Math.max(0, totalAmount - bonusAmount);

        // Remove the excess bonus text to leave only the base description
        let cleanBaseDesc = description
            .replace(/(\+?\s*Excess Bonus\s*\(.*?\))/i, '')
            .trim();
        if (!cleanBaseDesc || cleanBaseDesc === '+') cleanBaseDesc = 'Salary Payout';

        const bonusDesc = bonusFormula ? `Excess Bonus (${bonusFormula})` : 'Excess Bonus';

        return [
            {
                id: `${record.id}-base`,
                date: recordDate,
                description: cleanBaseDesc,
                amount: baseAmount,
                isBonus: false
            },
            {
                id: `${record.id}-bonus`,
                date: recordDate,
                description: bonusDesc,
                amount: bonusAmount,
                isBonus: true
            }
        ];
    }

    // Fallback if someone wrote "Excess Bonus: 32" without parentheses
    const altMatch = description.match(/Excess Bonus(?:\s*-\s*|\s*:\s*|\s+)([0-9.,]+)/i);
    if (altMatch && description.toLowerCase().includes('salary')) {
        const bonusAmount = parseFloat(altMatch[1].replace(/,/g, '')) || 0;
        const baseAmount = Math.max(0, totalAmount - bonusAmount);
        return [
            {
                id: `${record.id}-base`,
                date: recordDate,
                description: 'Salary Payout',
                amount: baseAmount,
                isBonus: false
            },
            {
                id: `${record.id}-bonus`,
                date: recordDate,
                description: 'Excess Bonus',
                amount: bonusAmount,
                isBonus: true
            }
        ];
    }

    // Standard record with no bonus
    return [
        {
            id: String(record.id),
            date: recordDate,
            description: description,
            amount: totalAmount,
            isBonus: description.toLowerCase().includes('bonus')
        }
    ];
};

export default function SalaryHistoryCard({
                                              period,
                                              filterEmployee,
                                              setFilterEmployee,
                                              employees,
                                              periodTotal,
                                              customStartDate,
                                              setCustomStartDate,
                                              customEndDate,
                                              setCustomEndDate,
                                              handleApplyCustomDate,
                                              isSalaryLoading,
                                              groupedRecords,
                                              handleSetPeriod,
                                              getPrevPeriod,
                                              getNextPeriod,
                                              isCustomRangeActive
                                          }) {
    const [isExporting, setIsExporting] = useState(false);

    const handleDownloadPDF = async () => {
        setIsExporting(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            // Top Seaside Lime Green Accent Bar
            doc.setFillColor(141, 182, 0);
            doc.rect(0, 0, 210, 6, 'F');

            // Header Titles
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(15);
            doc.setTextColor(15, 23, 42); // slate-900
            doc.text('SEASIDE PURIFIED WATER REFILLING STATION', 14, 17);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text('Salary History (Gross Payouts & Bonus Breakdown)', 14, 23);

            // Report Metadata (Left & Right)
            doc.setFontSize(8);
            doc.setTextColor(51, 65, 85);
            doc.text(`Payroll Period: ${period.start} to ${period.end}`, 14, 30);
            doc.text(`Staff Filter: ${filterEmployee === 'all' ? 'All Employees' : filterEmployee}`, 14, 35);

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

            const grandGross = Number(periodTotal || 0);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(22, 101, 52); // emerald-800
            doc.text(`Total Gross Payout: PHP ${grandGross.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 128, 35);

            // Horizontal Divider
            doc.setDrawColor(226, 232, 240);
            doc.line(14, 39, 196, 39);

            let currentY = 44;
            let grandTotalBonus = 0;
            const entries = Object.entries(groupedRecords || {});

            if (entries.length === 0) {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(10);
                doc.setTextColor(148, 163, 184);
                doc.text('No salary records found for this period.', 14, currentY + 10);
            } else {
                entries.forEach(([empName, records]) => {
                    // Check remaining vertical height before drawing next employee table
                    if (currentY > doc.internal.pageSize.height - 45) {
                        doc.addPage();
                        currentY = 20;
                    }

                    let empGrossTotal = 0;
                    let empBonusTotal = 0;

                    // Split every record into sequential Base and Bonus rows
                    const splitItems = records.flatMap(splitSalaryRecord);

                    const tableRows = splitItems.map(item => {
                        const dateStr = item.date
                            ? formatInTimeZone(toDate(item.date), TIME_ZONE, 'EEE, MMM d, yyyy h:mm a')
                            : 'N/A';

                        const numAmt = Number(item.amount || 0);
                        empGrossTotal += numAmt;
                        if (item.isBonus) empBonusTotal += numAmt;

                        const formattedAmt = `${numAmt < 0 ? '-' : ''}PHP ${Math.abs(numAmt).toLocaleString('en-PH', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}`;

                        return [dateStr, item.description, formattedAmt];
                    });

                    grandTotalBonus += empBonusTotal;

                    // Employee Header Pill Banner
                    doc.setFillColor(248, 250, 252); // slate-50
                    doc.setDrawColor(226, 232, 240); // slate-200
                    doc.roundedRect(14, currentY, 182, 7.5, 2, 2, 'FD');

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9);
                    doc.setTextColor(15, 23, 42); // slate-900
                    doc.text(`Employee: ${empName}`, 18, currentY + 5);

                    doc.setFontSize(8);
                    doc.setTextColor(100, 116, 139);
                    doc.text(
                        `Subtotal: PHP ${empGrossTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        192,
                        currentY + 5,
                        { align: 'right' }
                    );

                    currentY += 9;

                    // Employee-Specific Table with Sequential Rows
                    autoTable(doc, {
                        startY: currentY,
                        head: [['Date & Time', 'Description', 'Gross Amount']],
                        body: tableRows,
                        foot: [
                            [
                                '',
                                `Total Payout for ${empName}`,
                                `PHP ${empGrossTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            ]
                        ],
                        theme: 'grid',
                        margin: { left: 14, right: 14 },
                        headStyles: {
                            fillColor: [30, 41, 59], // slate-800
                            textColor: [255, 255, 255],
                            fontStyle: 'bold',
                            fontSize: 8,
                        },
                        bodyStyles: {
                            fontSize: 8,
                            textColor: [51, 65, 85],
                        },
                        footStyles: {
                            fillColor: [241, 245, 249],
                            textColor: [15, 23, 42],
                            fontStyle: 'bold',
                            fontSize: 8,
                        },
                        columnStyles: {
                            0: { cellWidth: 50 },
                            1: { cellWidth: 'auto' },
                            2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
                        },
                    });

                    currentY = doc.lastAutoTable.finalY + 8;
                });

                // Period Executive Recap Box at bottom
                if (currentY > doc.internal.pageSize.height - 35) {
                    doc.addPage();
                    currentY = 20;
                }

                autoTable(doc, {
                    startY: currentY,
                    head: [['PERIOD EXECUTIVE RECAP', 'AMOUNT']],
                    body: [
                        ['Total Base Salary', `PHP ${(grandGross - grandTotalBonus).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
                        ['Total Excess Gallon Bonuses', `PHP ${grandTotalBonus.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
                        ['Grand Total Gross Disbursed', `PHP ${grandGross.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]
                    ],
                    theme: 'plain',
                    margin: { left: 80, right: 14 },
                    headStyles: {
                        fillColor: [141, 182, 0],
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                        fontSize: 8,
                    },
                    bodyStyles: {
                        fontSize: 8,
                        textColor: [30, 41, 59],
                    },
                    columnStyles: {
                        0: { fontStyle: 'bold' },
                        1: { halign: 'right', fontStyle: 'bold' }
                    }
                });
            }

            // Footer Page Numbering across all pages
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(148, 163, 184);

                doc.text(
                    'Confidential • Seaside WRS POS & Salary Management System',
                    14,
                    doc.internal.pageSize.height - 8
                );
                doc.text(
                    `Page ${i} of ${pageCount}`,
                    doc.internal.pageSize.width - 24,
                    doc.internal.pageSize.height - 8
                );
            }

            const safeEmployee = (filterEmployee || 'All').replace(/[^a-zA-Z0-9_-]/g, '_');
            doc.save(`Salary_History_${period.start}_to_${period.end}_${safeEmployee}.pdf`);
        } catch (err) {
            console.error('PDF export failed:', err);
            alert('Failed to generate PDF. Make sure "jspdf" and "jspdf-autotable" are installed.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Card className="rounded-2xl border border-slate-200/90 shadow-2xs bg-white overflow-hidden">
            <CardHeader className="border-b border-gray-100 p-4 sm:p-5 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                        <h3 className="font-bold text-base sm:text-lg text-slate-900">
                            Salary History (Gross Payouts)
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                            Period: {formatInTimeZone(toDate(period.start), TIME_ZONE, 'EEE, MMM d, yyyy')} — {formatInTimeZone(toDate(period.end), TIME_ZONE, 'EEE, MMM d, yyyy')}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="w-full sm:w-48">
                            <Select
                                value={filterEmployee}
                                onChange={e => setFilterEmployee(e.target.value)}
                                className="w-full h-9 text-xs"
                            >
                                <option value="all">All Employees</option>
                                {employees?.map(emp => (
                                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                                ))}
                            </Select>
                        </div>

                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Period Total</p>
                            <p className="text-xl font-bold text-red-600">
                                {currency(periodTotal, { symbol: '₱' }).format()}
                            </p>
                        </div>

                        {/* PDF Download Button */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleDownloadPDF}
                            disabled={isExporting || isSalaryLoading || Object.keys(groupedRecords || {}).length === 0}
                            className="h-9 px-3 rounded-xl border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 shrink-0"
                            title="Download Salary History as PDF"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                                    <span>Exporting...</span>
                                </>
                            ) : (
                                <>
                                    <FileDown className="w-4 h-4 text-emerald-600" />
                                    <span>Download PDF</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Custom Date Filter */}
                <div className="flex flex-col md:flex-row items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <Calendar className="w-5 h-5 text-gray-500 shrink-0" />
                    <Label className="font-semibold text-xs sm:text-sm shrink-0">Custom Date Range:</Label>
                    <Input
                        type="date"
                        value={customStartDate}
                        onChange={e => setCustomStartDate(e.target.value)}
                        className="h-9 w-full sm:max-w-xs text-xs bg-white"
                    />
                    <span className="hidden sm:inline text-gray-500">-</span>
                    <Input
                        type="date"
                        value={customEndDate}
                        onChange={e => setCustomEndDate(e.target.value)}
                        className="h-9 w-full sm:max-w-xs text-xs bg-white"
                    />
                    <Button onClick={handleApplyCustomDate} className="h-9 btn-primary w-full sm:w-auto text-xs font-bold">
                        Apply
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {isSalaryLoading ? (
                    <p className="text-center py-8 text-sm text-gray-500">Loading salary records...</p>
                ) : Object.keys(groupedRecords || {}).length === 0 ? (
                    <p className="text-center py-8 text-sm text-gray-500">No records found for this period.</p>
                ) : (
                    Object.entries(groupedRecords).map(([employeeName, records]) => {
                        const employeeTotal = records.reduce((sum, record) => sum + Number(record.amount || 0), 0);
                        const splitItems = records.flatMap(splitSalaryRecord);

                        return (
                            <div key={employeeName} className="border-b last:border-b-0">
                                <div className="bg-gray-50/70 p-3.5 flex justify-between items-center border-b border-gray-100">
                                    <h4 className="font-bold text-sm text-slate-800">{employeeName}</h4>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Employee Total</p>
                                        <p className="font-bold text-red-600 text-sm">{currency(employeeTotal, { symbol: '₱' }).format()}</p>
                                    </div>
                                </div>

                                {/* Desktop Table */}
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-56">Date</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead className="text-right w-40">Gross Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {splitItems.map(item => (
                                                <TableRow key={item.id} className={item.isBonus ? 'bg-amber-50/30' : ''}>
                                                    <TableCell className="text-xs text-gray-600">
                                                        {item.date ? formatInTimeZone(toDate(item.date), TIME_ZONE, 'EEE, MMM d, yyyy h:mm a') : 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-medium">
                                                        {item.isBonus ? (
                                                            <span className="text-amber-800 font-bold flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                                {item.description}
                                                            </span>
                                                        ) : (
                                                            item.description
                                                        )}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-bold text-xs ${item.isBonus ? 'text-amber-700' : Number(item.amount) < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                                        {currency(item.amount, { symbol: '₱' }).format()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile List */}
                                <div className="block md:hidden p-4 space-y-3">
                                    {splitItems.map(item => (
                                        <div
                                            key={item.id}
                                            className={`p-3 rounded-xl shadow-2xs border ${
                                                item.isBonus ? 'bg-amber-50/50 border-amber-200/80' : 'bg-white border-gray-100'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className={`text-xs flex-1 pr-2 font-medium ${item.isBonus ? 'text-amber-900 font-bold' : 'text-slate-800'}`}>
                                                    {item.description}
                                                </span>
                                                <span className={`font-bold text-sm ${item.isBonus ? 'text-amber-700' : Number(item.amount) < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                                    {currency(item.amount, { symbol: '₱' }).format()}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 mt-1 text-right">
                                                {item.date ? formatInTimeZone(toDate(item.date), TIME_ZONE, 'EEE, MMM d, h:mm a') : 'N/A'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>

            {/* Period Navigation */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
                <Button
                    onClick={() => handleSetPeriod(getPrevPeriod(period.start))}
                    disabled={isCustomRangeActive}
                    variant="outline"
                    className="flex items-center gap-1 text-xs font-bold disabled:opacity-50"
                >
                    <ChevronLeft className="w-4 h-4" /> Prev 15-Day
                </Button>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {isCustomRangeActive
                        ? 'Custom Range'
                        : `${formatInTimeZone(toDate(period.start), TIME_ZONE, 'MMM d')} - ${formatInTimeZone(toDate(period.end), TIME_ZONE, 'MMM d')}`}
                </span>
                <Button
                    onClick={() => handleSetPeriod(getNextPeriod(period.start))}
                    disabled={isCustomRangeActive}
                    variant="outline"
                    className="flex items-center gap-1 text-xs font-bold disabled:opacity-50"
                >
                    Next 15-Day <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </Card>
    );
}