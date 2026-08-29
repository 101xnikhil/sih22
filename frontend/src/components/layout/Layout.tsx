import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import VirtualChatbotModal from '../common/VirtualChatbotModal';

interface LayoutProps {
  alertCount?: number;
  isConnected?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ alertCount = 0, isConnected = true }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getPageTitle = (pathname: string): string => {
    switch (pathname) {
      case '/':
      case '/dashboard':
      case '/metrics':
        return 'Metrics';
      case '/sensor':
      case '/node':
      case '/nodes':
        return 'Station Telemetry (LG-N01)';
      case '/alerts':
        return 'Alerts & Incidents';
      case '/analytics':
        return 'Geotechnical Analytics';
      case '/map':
      case '/gis':
        return 'Geospatial Sector GIS';
      case '/settings':
        return 'Hardware & Integrations';
      case '/about':
        return 'About LANDGUARD AI';
      default:
        return 'Metrics';
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-[#0f172a] flex overflow-x-hidden">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 lg:ml-16 transition-all duration-300">
        <Header 
          title={getPageTitle(location.pathname)} 
          alertCount={alertCount} 
          isConnected={isConnected}
          onMenuToggle={toggleSidebar} 
        />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
        
        {/* Global Virtual Chatbot AI Assistant */}
        <VirtualChatbotModal />

        <footer className="border-t border-[#e5e9f2] bg-white px-6 py-3 text-xs font-sans text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1600px] mx-auto">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
              <span className="font-semibold text-slate-800">LANDGUARD AI</span>
              <span className="text-slate-400">· Early Warning Mission Control</span>
            </div>
            <div className="text-slate-500 text-[11px]">
              Edge LoRa Gateway &middot; Limit Equilibrium Bishop Physics &middot; XGBoost SHAP Engine
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>Blynk Cloud Synced</span>
              <span>&bull;</span>
              <span className="text-[#10b981] font-semibold">Online</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
