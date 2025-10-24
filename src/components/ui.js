import React from 'react';
import clsx from 'clsx';

export function cn(...inputs) {
  return clsx(...inputs);
}

// Enhanced Button component with additional variants and states
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
  <input ref={ref} className={cn('input', className)} {...props} />
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

// Very small dialog placeholder
// Enhanced Dialog component with modern styling
export const Dialog = ({ open, children, className }) => (
  open ? (
    <div className={cn('dialog-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50', className)}>
      <div className="dialog-content bg-white rounded-lg shadow-lg p-4">{children}</div>
    </div>
  ) : null
);
export const DialogContent = ({ children, className }) => (
  <div className={cn('dialog-content bg-white rounded-lg shadow-lg p-6', className)}>{children}</div>
);
export const DialogHeader = ({ children }) => (
  <div className="dialog-header mb-4 font-semibold text-lg">{children}</div>
);
export const DialogTitle = ({ children }) => <h2 className="text-lg font-semibold">{children}</h2>;
export const DialogFooter = ({ children }) => (
  <div className="dialog-footer mt-4 flex justify-end space-x-2">{children}</div>
);
export const DialogCloseButton = ({ onClick }) => (
  <button onClick={onClick} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">&times;</button>
);

export const Table = ({ children, className }) => <div className={cn('table-wrap', className)}><table className="table">{children}</table></div>;
export const TableHeader = ({ children }) => <thead className="table__head">{children}</thead>;
export const TableBody = ({ children }) => <tbody>{children}</tbody>;
export const TableRow = ({ children }) => (
  <tr className="table__row">
    {React.Children.toArray(children).filter(child =>
      typeof child !== 'string' || child.trim() !== ''
    )}
  </tr>
);
export const TableHead = ({ children }) => <th className="table__th">{children}</th>;
export const TableCell = ({ children }) => <td className="table__td">{children}</td>;

export const ScrollArea = ({ children, className }) => <div className={cn('scroll-area', className)}>{children}</div>;

export const LoadingSpinner = ({ className }) => (
  <svg className={cn('loading-spinner', className)} viewBox="0 0 24 24" aria-hidden="true">
    <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="spinner-head" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

export const Label = ({ children, htmlFor }) => <label htmlFor={htmlFor} className="small" style={{ display: 'block', marginBottom: 6 }}>{children}</label>;

export default {};
