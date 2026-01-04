import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
    title: 'MediTurnos - Gestión de Clínicas Médicas',
    description: 'Sistema integral para la gestión de turnos, pacientes e historias clínicas para clínicas médicas',
    keywords: ['turnos médicos', 'gestión clínicas', 'historia clínica', 'agenda médica'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                {children}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#1e293b',
                            color: '#f8fafc',
                            borderRadius: '12px',
                            padding: '16px',
                        },
                        success: {
                            iconTheme: {
                                primary: '#22c55e',
                                secondary: '#ffffff',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#ffffff',
                            },
                        },
                    }}
                />
            </body>
        </html>
    );
}
