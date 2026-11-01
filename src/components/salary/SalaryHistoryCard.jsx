// src/components/salary/SalaryHistoryCard.jsx
import React, { useState } from 'react';
import currency from 'currency.js';
import {
    Card, CardHeader, CardContent, Button, Input, Label, Select,
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '../ui';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { ChevronLeft, ChevronRight, Calendar, FileDown, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

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
    // Employee accordion state for mobile view
    const [expandedEmployees, setExpandedEmployees] = useState(() => new Set());

    const toggleEmployee = (empName) => {
        setExpandedEmployees(prev => {
            const next = new Set(prev);
            next.has(empName) ? next.delete(empName) : next.add(empName);
            return next;
        });
    };

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
        <Card className="rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-gray-100 dark:border-slate-800 p-4 sm:p-5 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                            Salary History (Gross Payouts)
                        </h3>
                        <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider font-semibold truncate">
                            Period: {formatInTimeZone(toDate(period.start), TIME_ZONE, 'EEE, MMM d')} — {formatInTimeZone(toDate(period.end), TIME_ZONE, 'EEE, MMM d, yyyy')}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                        <div className="w-full sm:w-44">
                            <Select
                                value={filterEmployee}
                                onChange={e => setFilterEmployee(e.target.value)}
                                className="w-full h-9 text-xs rounded-xl"
                            >
                                <option value="all">All Employees</option>
                                {employees?.map(emp => (
                                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                                ))}
                            </Select>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                            <div className="text-left sm:text-right">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Period Total</p>
                                <p className="text-base sm:text-lg font-black text-red-600">
                                    {currency(periodTotal, { symbol: '₱' }).format()}
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDownloadPDF}
                                disabled={isExporting || isSalaryLoading || Object.keys(groupedRecords || {}).length === 0}
                                className="h-9 px-3 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 shrink-0"
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
                                        <span>PDF</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Compact Custom Date Range: 2-column row on mobile */}
                <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <Calendar className="w-4 h-4 text-[#8DB600] shrink-0" />
                        <span>Custom Date Range</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                        <div className="sm:col-span-5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Start Date</span>
                            <Input
                                type="date"
                                value={customStartDate}
                                onChange={e => setCustomStartDate(e.target.value)}
                                className="h-9 w-full text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg"
                            />
                        </div>
                        <div className="sm:col-span-5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">End Date</span>
                            <Input
                                type="date"
                                value={customEndDate}
                                onChange={e => setCustomEndDate(e.target.value)}
                                className="h-9 w-full text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <Button
                                onClick={handleApplyCustomDate}
                                className="h-9 w-full bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold rounded-lg shadow-2xs active:scale-95"
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {isSalaryLoading ? (
                    <p className="text-center py-8 text-xs text-gray-500">Loading salary records...</p>
                ) : Object.keys(groupedRecords || {}).length === 0 ? (
                    <p className="text-center py-8 text-xs text-gray-500">No records found for this period.</p>
                ) : (
                    Object.entries(groupedRecords).map(([employeeName, records]) => {
                        const employeeTotal = records.reduce((sum, record) => sum + Number(record.amount || 0), 0);
                        const splitItems = records.flatMap(splitSalaryRecord);
                        const isExpanded = filterEmployee !== 'all' || expandedEmployees.has(employeeName);

                        return (
                            <div key={employeeName} className="border-b last:border-b-0 border-gray-100 dark:border-slate-800">
                                {/* Employee Header Card / Accordion Trigger */}
                                <div
                                    onClick={() => toggleEmployee(employeeName)}
                                    className="bg-gray-50/80 dark:bg-slate-800/60 p-3 sm:p-3.5 flex justify-between items-center border-b border-gray-100 dark:border-slate-800 cursor-pointer select-none transition-colors hover:bg-gray-100/70 dark:hover:bg-slate-800"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center shrink-0">
                                            {employeeName.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">{employeeName}</h4>
                                            <span className="text-[10px] text-slate-400 font-medium md:hidden block">
                                                {splitItems.length} payout item{splitItems.length === 1 ? '' : 's'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right">
                                            <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Subtotal</p>
                                            <p className="font-bold text-red-600 dark:text-red-400 text-xs sm:text-sm">
                                                {currency(employeeTotal, { symbol: '₱' }).format()}
                                            </p>
                                        </div>
                                        <div className="md:hidden p-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500">
                                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Table View: always rendered on large screens */}
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-56 text-[11px]">Date</TableHead>
                                                <TableHead className="text-[11px]">Description</TableHead>
                                                <TableHead className="text-right w-40 text-[11px]">Gross Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {splitItems.map(item => (
                                                <TableRow key={item.id} className={item.isBonus ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}>
                                                    <TableCell className="text-xs text-gray-600 dark:text-slate-300">
                                                        {item.date ? formatInTimeZone(toDate(item.date), TIME_ZONE, 'EEE, MMM d, yyyy h:mm a') : 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-medium">
                                                        {item.isBonus ? (
                                                            <span className="text-amber-800 dark:text-amber-400 font-bold flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                                {item.description}
                                                            </span>
                                                        ) : (
                                                            item.description
                                                        )}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-bold text-xs ${item.isBonus ? 'text-amber-700 dark:text-amber-400' : Number(item.amount) < 0 ? 'text-red-600' : 'text-gray-800 dark:text-slate-200'}`}>
                                                        {currency(item.amount, { symbol: '₱' }).format()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile List View: Accordion-Controlled */}
                                <div className={`block md:hidden ${isExpanded ? 'p-3 space-y-2' : 'hidden'}`}>
                                    {splitItems.map(item => (
                                        <div
                                            key={item.id}
                                            className={`p-2.5 rounded-xl border transition-all ${
                                                item.isBonus
                                                    ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/70'
                                                    : 'bg-white dark:bg-slate-850 border-gray-100 dark:border-slate-800 shadow-2xs'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <span className={`text-xs flex-1 min-w-0 font-medium ${item.isBonus ? 'text-amber-900 dark:text-amber-300 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                                                    {item.description}
                                                </span>
                                                <span className={`font-bold text-xs sm:text-sm shrink-0 ${item.isBonus ? 'text-amber-700 dark:text-amber-400' : Number(item.amount) < 0 ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}>
                                                    {currency(item.amount, { symbol: '₱' }).format()}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1 text-right font-mono">
                                                {item.date ? formatInTimeZone(toDate(item.date), TIME_ZONE, 'EEE, MMM d • h:mm a') : 'N/A'}
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
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-slate-800/60 rounded-b-xl border-t border-gray-100 dark:border-slate-800">
                <Button
                    onClick={() => handleSetPeriod(getPrevPeriod(period.start))}
                    disabled={isCustomRangeActive}
                    variant="outline"
                    className="flex items-center gap-1 text-xs font-bold disabled:opacity-50 h-8 sm:h-9 px-2.5 sm:px-3"
                >
                    <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Prev 15-Day</span><span className="sm:hidden">Prev</span>
                </Button>
                <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                    {isCustomRangeActive
                        ? 'Custom Range'
                        : `${formatInTimeZone(toDate(period.start), TIME_ZONE, 'MMM d')} - ${formatInTimeZone(toDate(period.end), TIME_ZONE, 'MMM d')}`}
                </span>
                <Button
                    onClick={() => handleSetPeriod(getNextPeriod(period.start))}
                    disabled={isCustomRangeActive}
                    variant="outline"
                    className="flex items-center gap-1 text-xs font-bold disabled:opacity-50 h-8 sm:h-9 px-2.5 sm:px-3"
                >
                    <span className="hidden sm:inline">Next 15-Day</span><span className="sm:hidden">Next</span> <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </Card>
    );
}