import React from 'react';
import { TopNavbar } from './TopNavbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-mascate-bg">
      {/* Top Navigation Bar */}
      <TopNavbar />
      
      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
