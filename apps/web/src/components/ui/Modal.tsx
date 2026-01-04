'use client';

import { Fragment, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showClose?: boolean;
}

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
};

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showClose = true,
}: ModalProps) {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel
                                className={clsx(
                                    'w-full transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-xl transition-all',
                                    sizeClasses[size]
                                )}
                            >
                                {/* Header */}
                                {(title || showClose) && (
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                                        {title && (
                                            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {title}
                                            </Dialog.Title>
                                        )}
                                        {showClose && (
                                            <button
                                                onClick={onClose}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <XMarkIcon className="w-5 h-5 text-gray-500" />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Content */}
                                <div className="p-6">{children}</div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

// Confirm Dialog
interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    isLoading = false,
}: ConfirmDialogProps) {
    const variantStyles = {
        danger: 'btn-danger',
        warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
        info: 'btn-primary',
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
            <div className="text-center">
                <div
                    className={clsx(
                        'mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4',
                        variant === 'danger' && 'bg-red-100 dark:bg-red-900/30',
                        variant === 'warning' && 'bg-yellow-100 dark:bg-yellow-900/30',
                        variant === 'info' && 'bg-blue-100 dark:bg-blue-900/30'
                    )}
                >
                    {variant === 'danger' && (
                        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    )}
                    {variant === 'warning' && (
                        <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    )}
                    {variant === 'info' && (
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{message}</p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="btn-secondary px-6"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={clsx('px-6 py-3 rounded-xl font-semibold transition-all', variantStyles[variant])}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Procesando...
                            </div>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
