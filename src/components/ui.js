import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(...inputs));
}

export const Button = React.forwardRef(({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
  const Comp = asChild ? 'span' : 'button';
  const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border bg-white',
    ghost: 'bg-transparent',
    destructive: 'bg-red-600 text-white',
    secondary: 'bg-gray-200',
  };
  const sizes = {
    default: 'h-10 px-4',
    sm: 'h-8 px-3',
    icon: 'h-8 w-8',
  };
  return React.createElement(Comp, { ref, className: cn(base, variants[variant] || variants.default, sizes[size] || sizes.default, className), ...props });
});
Button.displayName = 'Button';

export const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('flex h-10 w-full rounded-md border px-3', className)} {...props} />
));
Input.displayName = 'Input';

export const Card = ({ children, className }) => (
  <div className={cn('rounded-lg border bg-white shadow-sm', className)}>{children}</div>
);

export const CardHeader = ({ children, className }) => (
  <div className={cn('p-4 border-b', className)}>{children}</div>
);
export const CardContent = ({ children, className }) => (
  <div className={cn('p-4', className)}>{children}</div>
);
export const CardFooter = ({ children, className }) => (
  <div className={cn('p-4 border-t', className)}>{children}</div>
);

// Very small dialog placeholder
export const Dialog = ({ open, children }) => (open ? <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">{children}</div> : null);
export const DialogContent = ({ children, className }) => (
  <div className={cn('bg-white rounded-lg p-6 w-full max-w-md', className)}>{children}</div>
);
export const DialogHeader = ({ children }) => <div className="mb-4">{children}</div>;
export const DialogTitle = ({ children }) => <h2 className="text-lg font-semibold">{children}</h2>;
export const DialogFooter = ({ children }) => <div className="mt-4 flex justify-end space-x-2">{children}</div>;

export const Table = ({ children, className }) => <div className={cn('w-full overflow-auto', className)}><table className="w-full">{children}</table></div>;
export const TableHeader = ({ children }) => <thead className="bg-gray-50">{children}</thead>;
export const TableBody = ({ children }) => <tbody>{children}</tbody>;
export const TableRow = ({ children }) => <tr className="border-b">{children}</tr>;
export const TableHead = ({ children }) => <th className="text-left p-3 text-sm font-medium text-gray-700">{children}</th>;
export const TableCell = ({ children }) => <td className="p-3 text-sm text-gray-600">{children}</td>;

export const ScrollArea = ({ children, className }) => <div className={cn('overflow-auto', className)}>{children}</div>;

export const LoadingSpinner = ({ className }) => (
  <svg className={cn('animate-spin h-5 w-5 text-gray-600', className)} viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

export const Label = ({ children, htmlFor }) => <label htmlFor={htmlFor} className="text-sm font-medium block mb-1">{children}</label>;

export default {};
