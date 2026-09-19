import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui';

export default function VehicleNotificationModal({
    isOpen,
    onClose,
    overdueVehicles = [],
    dueVehicles = overdueVehicles,
    overdueFilters = [],
    dueFilters = overdueFilters,
    goodFilters = [],
    allFilters = []
}) {
    const vehicles = dueVehicles && dueVehicles.length > 0 ? dueVehicles : (overdueVehicles || []);
    const filters = dueFilters && dueFilters.length > 0 ? dueFilters : (overdueFilters || []);

    if (!isOpen || (vehicles.length === 0 && filters.length === 0)) return null;

    const hasVehicles = vehicles.length > 0;
    const hasFilters = filters.length > 0;

    // Determine filters that are not yet due / still good
    let notDueFilters = [];
    if (goodFilters && goodFilters.length > 0) {
        notDueFilters = goodFilters;
    } else if (allFilters && allFilters.length > 0) {
        notDueFilters = allFilters.filter(f => !filters.some(df => (df.id && df.id === f.id) || df.name === f.name));
    }
    const hasGoodFilters = notDueFilters.length > 0;

    let alertSubtitle = "Maintenance required immediately!";
    if (hasVehicles && hasFilters) {
        alertSubtitle = "Filter replacement & vehicle oil change required immediately!";
    } else if (hasVehicles) {
        alertSubtitle = "Vehicle oil change required immediately!";
    } else if (hasFilters) {
        alertSubtitle = "Filter replacement required immediately!";
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 sm:p-8 space-y-6">

                    {/* Header */}
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Maintenance Alert</h3>
                            <p className="text-sm text-red-600 font-medium mt-1">{alertSubtitle}</p>
                        </div>
                    </div>

                    {/* Body Context */}
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {hasVehicles && hasFilters
                                ? "The following vehicle maintenance and water filters have reached their due interval and require immediate attention:"
                                : hasVehicles
                                ? "The following vehicles have exceeded their maintenance interval and require immediate attention:"
                                : "The following filters have reached their maintenance interval and require immediate replacement:"}
                        </p>

                        {/* Vehicles Section */}
                        {hasVehicles && (
                            <div className="space-y-2">
                                {(hasFilters || hasGoodFilters) && (
                                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Vehicles (Oil Change)
                                    </h4>
                                )}
                                <ul className="bg-red-50 border border-red-100 rounded-lg p-3 sm:p-4 space-y-2">
                                    {vehicles.map((vehicle, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-red-800 font-bold text-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                                            <span>{vehicle.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Filters Section */}
                        {hasFilters && (
                            <div className="space-y-2">
                                {(hasVehicles || hasGoodFilters) && (
                                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        {hasGoodFilters ? "Water Filters (Due for Replacement)" : "Water Filters"}
                                    </h4>
                                )}
                                <ul className="bg-red-50 border border-red-100 rounded-lg p-3 sm:p-4 space-y-2">
                                    {filters.map((filter, idx) => (
                                        <li key={idx} className="flex items-center justify-between gap-2 text-red-800 font-bold text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                                                <span>{filter.name}</span>
                                            </div>
                                            {filter.reason && (
                                                <span className="text-xs font-normal text-red-600">
                                                    ({filter.reason})
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Good Filters / Not Yet Due Section */}
                        {hasGoodFilters ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span>{hasFilters ? "Other Filters Status" : "Water Filters Status"}</span>
                                    </h4>
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                        Still Good
                                    </span>
                                </div>
                                <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 sm:p-4 space-y-2">
                                    <p className="text-xs text-emerald-800 font-medium">
                                        {hasFilters
                                            ? "The following filter(s) are not yet due and are still in good condition:"
                                            : "All water filters are not yet due and are currently in good condition:"}
                                    </p>
                                    <ul className="space-y-1.5 pt-0.5">
                                        {notDueFilters.map((filter, idx) => (
                                            <li key={idx} className="flex items-center justify-between text-xs text-emerald-950 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                                    <span>{filter.name}</span>
                                                </div>
                                                <span className="text-[11px] text-emerald-700 font-normal">
                                                    {filter.daysLeft !== undefined && filter.containersLeft !== undefined
                                                        ? `${filter.daysLeft}d left • ${filter.containersLeft} cont. left`
                                                        : filter.daysLeft !== undefined
                                                        ? `${filter.daysLeft} days left`
                                                        : 'Good condition'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            !hasFilters && hasVehicles && (
                                <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Water filters are not yet due and are still in good condition.</span>
                                </div>
                            )
                        )}

                        <p className="text-xs text-gray-500 italic">
                            {hasVehicles && hasFilters
                                ? "Please complete the required maintenance and update the tracking records to dismiss this alert."
                                : hasVehicles
                                ? "Please schedule an oil change and update the tracking records to dismiss this alert."
                                : "Please schedule filter replacement and update the tracking records to dismiss this alert."}
                        </p>
                    </div>

                    {/* Footer Action */}
                    <div className="pt-2">
                        <Button
                            onClick={onClose}
                            className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm"
                        >
                            OK
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}