
import { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isSidebarOpen={isSidebarOpen} />

      <div className={cn(
        "transition-all duration-300",
        "lg:ml-64" // Always push content on large screens
      )}>
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>

      {/* Mobile overlay when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
