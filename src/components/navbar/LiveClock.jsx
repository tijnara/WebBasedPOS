// src/components/navbar/LiveClock.jsx
import React, { useState, useEffect } from 'react';

export default function LiveClock() {
    const [time, setTime] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const options = {
        timeZone: 'Asia/Manila',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(time);

    const timeParts = {};
    parts.forEach(({ type, value }) => {
        timeParts[type] = value;
    });

    return (
        <div className="live-clock" title="Philippine Time">
            <div className="clock-time">
                <span>{timeParts.hour}:{timeParts.minute}:{timeParts.second}</span>
                <span className="clock-ampm">{timeParts.dayPeriod}</span>
            </div>
            <span className="clock-date">{timeParts.weekday}, {timeParts.month} {timeParts.day}</span>
        </div>
    );
}