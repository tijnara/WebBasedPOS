import React from 'react';
import { Activity } from 'lucide-react';

export default function ActivityLogsHeader() {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 text-text">
                    <Activity className="w-6 h-6 text-primary" /> System Activity Logs
                </h1>
                <p className="text-sm text-text-muted mt-1">Audit trail of all actions performed by staff and administrators.</p>
            </div>
        </div>
    );
}