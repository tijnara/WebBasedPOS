import React from 'react';
import clsx from 'clsx';

export function cn(...inputs) {
    return clsx(...inputs);
}

// Enhanced Button component
export const Button = React.forwardRef(({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button';
    const base = 'btn';
    const variants = {
        default: '',
        primary: 'btn--primary',
        outline: 'btn--outline', // Added for consistency if needed
        ghost: 'btn--ghost',
        destructive: 'btn--destructive', // Changed from btn--secondary
        secondary: 'btn--secondary',
        success: 'btn--success', // Added
        warning: 'btn--warning', // Added
        danger: 'btn--danger',   // Added (can be alias for destructive)
    };
    const sizes = {
        default: '',
        sm: 'btn--sm', // Added small size class
        lg: 'btn--lg',
        icon: 'btn--icon',
    };
    const classes = cn(base, variants[variant] || variants.default, sizes[size] || '', className);
    return React.createElement(Comp, { ref, className: classes, ...props });
});
Button.displayName = 'Button';

// --- Input Component ---
export const Input = React.forwardRef(({ className, ...props }, ref) => (
    <input ref={ref} className={cn('input', className)} {...props} />
));
Input.displayName = 'Input';

// --- Card Components ---
export const Card = ({ children, className }) => (
    <div className={cn('card', className)}>{children}</div>
);
export const CardHeader = ({ children, className }) => (
    <div className={cn('card__header', className)}>{children}</div>
);
export const CardContent = ({ children, className }) => (
    <div className={cn('card__content', className)}>{children}</div>
);
export const CardFooter = ({ children, className }) => (
    <div className={cn('card__footer', className)}>{children}</div>
);

// --- Dialog Components ---
export const Dialog = ({ open, children, className }) => (
    open ? (
        <div className={cn('dialog-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50', className)}>
            {/* Removed inner div to allow direct styling of content */}
            {children}
        </div>
    ) : null
);
export const DialogContent = ({ children, className }) => (
    // Added relative positioning context for absolute close button
    <div className={cn('dialog-content bg-white rounded-lg shadow-lg p-6 relative', className)}>
        {children}
    </div>
);
export const DialogHeader = ({ children }) => (
    <div className="dialog-header mb-4 font-semibold text-lg">{children}</div>
);
export const DialogTitle = ({ children }) => <h2 className="text-lg font-semibold">{children}</h2>;
export const DialogFooter = ({ children }) => (
    <div className="dialog-footer mt-4 flex justify-end space-x-2">{children}</div>
);
// Make sure DialogCloseButton is exported if used directly
export const DialogCloseButton = ({ onClick }) => (
    <button onClick={onClick} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl leading-none p-1">&times;</button>
);


// --- Table Components ---
export const Table = ({ children, className }) => <div className={cn('table-wrap', className)}><table className="table w-full">{children}</table></div>; // Added w-full
export const TableHeader = ({ children }) => <thead className="table__head">{children}</thead>;
export const TableBody = ({ children }) => <tbody>{children}</tbody>;
export const TableRow = ({ children }) => (
    <tr className="table__row border-b border-gray-200"> {/* Added subtle border */}
        {React.Children.toArray(children).filter(child =>
            typeof child !== 'string' || child.trim() !== ''
        )}
    </tr>
);
export const TableHead = ({ children }) => <th className="table__th px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</th>; // Adjusted padding/styles
export const TableCell = ({ children, className }) => <td className={cn('table__td px-2 py-3 whitespace-nowrap', className)}>{children}</td>; // Adjusted padding


// --- ScrollArea Component ---
export const ScrollArea = ({ children, className }) => <div className={cn('scroll-area overflow-auto', className)}>{children}</div>; // Added overflow-auto

// --- LoadingSpinner Component ---
export const LoadingSpinner = ({ className }) => (
    <svg className={cn('loading-spinner animate-spin h-5 w-5 text-white', className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


// --- Label Component ---
export const Label = ({ children, htmlFor }) => <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">{children}</label>; // Adjusted styles

export default {}; // Keep default export if needed elsewhere