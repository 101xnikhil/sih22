import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

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
        return 'Control Center — Live Monitoring';
      case '/sensor':
        return 'Sensor Node Details (LG-N01)';
      case '/alerts':
        return 'Alert & Incident Center';
      case '/analytics':
        return 'Analytics, Trends & SHAP Explanations';
      case '/map':
        return 'Geographic Risk Map';
      case '/settings':
        return 'System Configuration & Simulation';
      default:
        return 'LANDGUARD AI Control Room';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 transition-all duration-300">
        <Header 
          title={getPageTitle(location.pathname)} 
          alertCount={alertCount} 
          isConnected={isConnected}
          onMenuToggle={toggleSidebar} 
        />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
        <footer className="border-t border-slate-800/80 bg-slate-950/90 px-4 py-2.5 text-center text-xs font-mono text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>LANDGUARD AI · SIH 2026 Prototype</span>
            <span className="text-amber-400/90 font-medium">
              Prototype — requires field calibration and geotechnical validation before operational deployment.
            </span>
            <span>Edge LoRa & XGBoost Ensemble</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
