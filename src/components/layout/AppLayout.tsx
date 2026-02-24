import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import NotificationCenter from './NotificationCenter';
import { MobileNavProvider, MobileNavButton, MobileNavDrawer } from './MobileNav';

import AnnouncementPopup from '@/components/AnnouncementPopup';
import { LanguageSwitcher } from '../LanguageSwitcher';

const AppLayout = () => {
  return (
    <MobileNavProvider>
      {/* Global Announcement Popup */}
      <AnnouncementPopup />

      {/* Mobile Drawer - at root level to avoid z-index issues */}
      <MobileNavDrawer />

      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation Bar */}
          <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 lg:px-6 gap-4 relative z-10">
            {/* Left: Mobile menu button (only shows on mobile) */}
            <div className="lg:hidden">
              <MobileNavButton />
            </div>

            {/* Spacer - pushes notifications to right */}
            <div className="flex-1" />

            {/* Right: Language & Notifications */}
            <LanguageSwitcher />
            <NotificationCenter />
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </MobileNavProvider>
  );
};

export default AppLayout;
