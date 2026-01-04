'use client';

import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

// Input component
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, className, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    className={clsx(
                        'input',
                        error && 'input-error',
                        className
                    )}
                    {...props}
                />
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                {hint && !error && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
            </div>
        );
    }
);
Input.displayName = 'Input';

// Select component
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    hint?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, hint, options, placeholder, className, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <select
                    ref={ref}
                    className={clsx(
                        'input',
                        error && 'input-error',
                        className
                    )}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                {hint && !error && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
            </div>
        );
    }
);
Select.displayName = 'Select';

// Textarea component
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, hint, className, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={clsx(
                        'input min-h-[100px] resize-y',
                        error && 'input-error',
                        className
                    )}
                    {...props}
                />
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                {hint && !error && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
            </div>
        );
    }
);
Textarea.displayName = 'Textarea';

// Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const buttonVariants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors',
};

const buttonSizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            children,
            className,
            disabled,
            ...props
        },
        ref
    ) => {
        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={clsx(
                    'inline-flex items-center justify-center gap-2 font-medium',
                    buttonVariants[variant],
                    buttonSizes[size],
                    (disabled || isLoading) && 'opacity-60 cursor-not-allowed',
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                    leftIcon
                )}
                {children}
                {rightIcon && !isLoading && rightIcon}
            </button>
        );
    }
);
Button.displayName = 'Button';

// Checkbox component
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: string;
    description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, description, className, ...props }, ref) => {
        return (
            <div className="flex items-start gap-3">
                <input
                    ref={ref}
                    type="checkbox"
                    className={clsx(
                        'w-5 h-5 mt-0.5 rounded border-gray-300 dark:border-slate-600 text-primary-500 focus:ring-primary-400',
                        className
                    )}
                    {...props}
                />
                <div>
                    <label htmlFor={props.id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                    </label>
                    {description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                    )}
                </div>
            </div>
        );
    }
);
Checkbox.displayName = 'Checkbox';

// Loading Spinner
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div
            className={clsx(
                'border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin',
                sizeClasses[size],
                className
            )}
        />
    );
}

// Empty State
interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="text-center py-12 px-4">
            {icon && (
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-4 text-gray-400">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
            {description && <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">{description}</p>}
            {action}
        </div>
    );
}

// Badge/Pill
interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    size?: 'sm' | 'md';
}

const badgeVariants = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    neutral: 'badge-neutral',
};

export function Badge({ children, variant = 'neutral', size = 'md' }: BadgeProps) {
    return (
        <span
            className={clsx(
                'badge',
                badgeVariants[variant],
                size === 'sm' && 'text-xs px-2 py-0.5'
            )}
        >
            {children}
        </span>
    );
}

// Card
interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    onClick?: () => void;
}

const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export function Card({ children, className, padding = 'md', onClick }: CardProps) {
    return (
        <div
            className={clsx('card', paddingClasses[padding], onClick && 'cursor-pointer', className)}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

// Avatar
interface AvatarProps {
    src?: string;
    name: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const avatarSizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
};

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div
            className={clsx(
                'rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-semibold',
                avatarSizes[size],
                className
            )}
        >
            {src ? (
                <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
}
