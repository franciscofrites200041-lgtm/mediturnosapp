'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Sidebar, { Header } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/lib/store';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
        },
    },
});

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { isAuthenticated, isLoading, setLoading } = useAuthStore();

    useEffect(() => {
        // Check if user has tokens
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            router.push('/auth/login');
        } else {
            setLoading(false);
        }
    }, [router, setLoading]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                    <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#1e293b',
                        color: '#fff',
                        borderRadius: '12px',
                        padding: '16px',
                    },
                    success: {
                        iconTheme: {
                            primary: '#22c55e',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />

            <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
                <Sidebar />

                <div className="lg:pl-72">
                    <Header />

                    <main className="p-4 sm:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </QueryClientProvider>
    );
}
