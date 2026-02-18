// src/components/ui.js
import React from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// ... (Button, Input, Card components remain unchanged) ...
export const Button = React.forwardRef(({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button';
    const base = 'btn';
    const variants = {
        default: '',
        primary: 'btn--primary',
        outline: 'btn--outline',
        ghost: 'btn--ghost',
        destructive: 'btn--destructive',
        secondary: 'btn--secondary',
        success: 'btn--success',
        warning: 'btn--warning',
        danger: 'btn--danger',
    };
    const sizes = {
        default: '',
        sm: 'btn--sm',
        lg: 'btn--lg',
        icon: 'btn--icon',
    };
    const classes = cn(base, variants[variant] || variants.default, sizes[size] || '', className);
    return React.createElement(Comp, { ref, className: classes, ...props });
});
Button.displayName = 'Button';

export const Input = React.forwardRef(({ className, ...props }, ref) => (
    <input ref={ref} className={cn('input', className)} autoComplete="off" {...props} />
));
Input.displayName = 'Input';

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

// --- UPDATED DIALOG COMPONENT TO USE PORTAL ---
export const Dialog = ({ open, children, className, style, onOpenChange, closeOnBackdropClick = false }) => {
    const [portalNode, setPortalNode] = React.useState(null);

    React.useEffect(() => {
        setPortalNode(document.getElementById('modal-root'));
    }, []);

    if (!open || !portalNode) return null;

    return createPortal(
        <div
            className={cn(
                'dialog-backdrop fixed inset-0 z-50 p-4 flex justify-center overflow-y-auto',
                className
            )}
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                ...style
            }}
            onClick={(e) => {
                if (closeOnBackdropClick && e.target === e.currentTarget && onOpenChange) {
                    onOpenChange(false);
                }
            }}
        >
            {children}
        </div>,
        portalNode
    );
};

export const DialogContent = ({ children, className, style, closeOnBackdropClick, ...props }) => (
    <div
        className={cn(
            'bg-white rounded-2xl sm:rounded-lg shadow-2xl relative w-full max-w-sm sm:max-w-md mx-auto flex flex-col overflow-hidden',
            className
        )}
        style={{
            maxHeight: 'calc(100dvh - 32px)',
            backgroundColor: '#ffffff',
            isolation: 'isolate',
            ...style
        }}
        onClick={(e) => e.stopPropagation()}
        {...props}
    >
        {children}
    </div>
);

export const DialogHeader = ({ children, className }) => (
    <div className={cn("dialog-header p-4 border-b flex justify-between items-start gap-4", className)}>
        {children}
    </div>
);

export const DialogTitle = ({ children, className }) => (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
        {children}
    </h2>
);

export const DialogFooter = ({ children, className, style }) => (
    <div className={cn("dialog-footer mt-auto p-4 border-t flex justify-end space-x-2", className)} style={style}>
        {children}
    </div>
);

export const DialogCloseButton = ({ onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-sm p-1 -m-1"
        aria-label="Close"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
        </svg>
    </button>
);

// ... (Table, ScrollArea, LoadingSpinner, Label, Select remain unchanged) ...
export const Table = ({ children, className }) => <div className={cn('table-wrap', className)}><table className="table w-full">{children}</table></div>;
export const TableHeader = ({ children }) => <thead className="table__head">{children}</thead>;
export const TableBody = ({ children }) => <tbody>{children}</tbody>;
export const TableRow = ({ children }) => (
    <tr className="table__row border-b border-gray-200">
        {React.Children.toArray(children).filter(child => typeof child !== 'string' || child.trim() !== '')}
    </tr>
);
export const TableHead = ({ children }) => <th className="table__th px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</th>;
export const TableCell = ({ children, className }) => <td className={cn('table__td px-2 py-3 whitespace-nowrap', className)}>{children}</td>;
export const ScrollArea = ({ children, className }) => <div className={cn('scroll-area overflow-auto', className)}>{children}</div>;
export const LoadingSpinner = ({ className }) => (
    <svg className={cn('loading-spinner animate-spin h-5 w-5 text-white', className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
export const Label = ({ children, htmlFor, className }) => <label htmlFor={htmlFor} className={cn("block text-sm font-medium text-gray-700 mb-1", className)}>{children}</label>;
export const Select = React.forwardRef(({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn('input', className)} {...props}>
        {children}
    </select>
));
Select.displayName = 'Select';

export default {};