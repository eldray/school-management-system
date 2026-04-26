import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="flex min-h-screen bg-[#f0ede8]">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header title={title} />
        <main className="p-6 min-h-[calc(100vh-5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}