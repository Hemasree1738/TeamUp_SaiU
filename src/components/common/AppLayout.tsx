import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MissingConfigBanner } from './MissingConfigBanner';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';

export const AppLayout: React.FC = () => {
  const { user, isConfigured } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (!user || !isConfigured) return;

    notificationService.getUnreadCount(user.id).then(setUnreadNotifs).catch(console.error);

    const subscription = notificationService.subscribeToNotifications(user.id, () => {
      setUnreadNotifs((prev) => prev + 1);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, isConfigured]);

  return (
    <div className="min-h-screen bg-campus-dark text-slate-100 flex flex-col">
      {!isConfigured && <MissingConfigBanner />}

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:shrink-0">
          <Sidebar unreadNotifs={unreadNotifs} />
        </div>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative z-50 flex-1 max-w-xs w-full">
              <Sidebar
                unreadNotifs={unreadNotifs}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Navbar
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            isMobileMenuOpen={isMobileMenuOpen}
            unreadNotifs={unreadNotifs}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
