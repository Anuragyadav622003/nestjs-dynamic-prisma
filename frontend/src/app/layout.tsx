// frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import ReactQueryProvider from '@/providers/ReactQueryProvider';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'CRUD Platform',
  description: 'Auto-generated CRUD + RBAC Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className="h-full bg-gray-50 text-gray-900 antialiased">
        <ReactQueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}