
import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import {
  ClipboardListIcon,
  FileTextIcon,
  CalendarDaysIcon,
  LogOutIcon,
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    {
      title: 'Verification Requests',
      path: '/dashboard',
      icon: <ClipboardListIcon className="h-5 w-5" />,
    },
    {
      title: 'Documents to Sign',
      path: '/documents',
      icon: <FileTextIcon className="h-5 w-5" />,
    },
    {
      title: 'Upcoming Meetings',
      path: '/meetings',
      icon: <CalendarDaysIcon className="h-5 w-5" />,
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed h-full w-64 bg-sidebar text-sidebar-foreground p-4 border-r border-sidebar-border flex flex-col">
        <div className="mb-8 p-2">
          <h2 className="text-xl font-bold">Notary Dashboard</h2>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "flex items-center w-full px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                    window.location.pathname === item.path
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : ""
                  )}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="mt-auto p-2">
          <Button
            onClick={logout}
            variant="ghost"
            className="flex items-center w-full justify-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOutIcon className="h-5 w-5 mr-3" />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm py-4 px-6">
          <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
