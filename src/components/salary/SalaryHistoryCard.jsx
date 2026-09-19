import React from 'react';
import currency from 'currency.js';
import {
    Card, CardHeader, CardContent, Button, Input, Label, Select,
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '../ui';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const TIME_ZONE = 'Asia/Manila';

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
    return (
        <Card>
            <CardHeader className="border-b border-gray-100 pb-4 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="flex-1">
                        <h3 className="font-bold">Salary History (Gross Payouts)</h3>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                            Period: {formatInTimeZone(toDate(period.start), TIME_ZONE, 'EEE, MMM d, yyyy')} — {formatInTimeZone(toDate(period.end), TIME_ZONE, 'EEE, MMM d, yyyy')}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 md:mt-0 w-full md:w-auto">
                        <div className="w-full sm:w-48">
                            <Select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className="w-full">
                                <option value="all">All Employees</option>
                                {employees?.map(emp => (
                                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Period Total</p>
                            <p className="text-xl font-bold text-red-600">{currency(periodTotal, { symbol: '₱' }).format()}</p>
                        </div>
                    </div>
                </div>

                {/* Custom Date Filter */}
                <div className="flex flex-col md:flex-row items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <Label className="font-semibold text-sm">Custom Date Range:</Label>
                    <Input
                        type="date"
                        value={customStartDate}
                        onChange={e => setCustomStartDate(e.target.value)}
                        className="h-9 w-full sm:max-w-xs"
                    />
                    <span className="hidden sm:inline text-gray-500">-</span>
                    <Input
                        type="date"
                        value={customEndDate}
                        onChange={e => setCustomEndDate(e.target.value)}
                        className="h-9 w-full sm:max-w-xs"
                    />
                    <Button onClick={handleApplyCustomDate} className="h-9 btn-primary w-full sm:w-auto">Apply</Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {isSalaryLoading ? (
                    <p className="text-center py-8">Loading...</p>
                ) : Object.keys(groupedRecords).length === 0 ? (
                    <p className="text-center py-8">No records for this period.</p>
                ) : (
                    Object.entries(groupedRecords).map(([employeeName, records]) => {
                        const employeeTotal = records.reduce((sum, record) => sum + Number(record.amount), 0);
                        return (
                            <div key={employeeName} className="border-b last:border-b-0">
                                <div className="bg-gray-50/50 p-3 flex justify-between items-center">
                                    <h4 className="font-bold text-md">{employeeName}</h4>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Employee Total</p>
                                        <p className="font-bold text-red-600">{currency(employeeTotal, { symbol: '₱' }).format()}</p>
                                    </div>
                                </div>
                                {/* Desktop Table */}
                                <div className="hidden md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead className="text-right">Gross Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {records.map(record => (
                                                <TableRow key={record.id}>
                                                    <TableCell>{formatInTimeZone(toDate(record.expense_date), TIME_ZONE, 'EEE, MMM d, yyyy h:mm a')}</TableCell>
                                                    <TableCell>{record.description}</TableCell>
                                                    <TableCell className={`text-right font-bold ${Number(record.amount) < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                                        {currency(record.amount, { symbol: '₱' }).format()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                {/* Mobile List */}
                                <div className="block md:hidden p-4 space-y-3">
                                    {records.map(record => (
                                        <div key={record.id} className="bg-white p-3 rounded-lg shadow-sm border">
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm flex-1 pr-2">{record.description}</span>
                                                <span className={`font-bold text-md ${Number(record.amount) < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                                    {currency(record.amount, { symbol: '₱' }).format()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 text-right">{formatInTimeZone(toDate(record.expense_date), TIME_ZONE, 'EEE, MMM d, h:mm a')}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>

            {/* Period Navigation */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-b-lg border-t">
                <Button
                    onClick={() => handleSetPeriod(getPrevPeriod(period.start))}
                    disabled={isCustomRangeActive}
                    variant="outline"
                    className="flex items-center gap-1 disabled:opacity-50"
                >
                    <ChevronLeft className="w-4 h-4" /> Prev 15-Day
                </Button>
                <span className="text-xs font-bold text-gray-400 uppercase">
                    {isCustomRangeActive ? "Custom Range" : `${formatInTimeZone(toDate(period.start), TIME_ZONE, 'MMM d')} - ${formatInTimeZone(toDate(period.end), TIME_ZONE, 'MMM d')}`}
                </span>
                <Button
                    onClick={() => handleSetPeriod(getNextPeriod(period.start))}
                    disabled={isCustomRangeActive}
                    variant="outline"
                    className="flex items-center gap-1 disabled:opacity-50"
                >
                    Next 15-Day <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </Card>
    );
}