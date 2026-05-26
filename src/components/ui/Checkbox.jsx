// src/components/ui/Checkbox.jsx
import React from 'react';

const Checkbox = React.forwardRef(({ className = '', ...props }, ref) => {
    return (
        <input
            type="checkbox"
            ref={ref}
            className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${className}`}
            {...props}
        />
    );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;