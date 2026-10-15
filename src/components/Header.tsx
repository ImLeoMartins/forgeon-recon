import React from 'react';
import { ForgeonLogo } from './ForgeonLogo';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewScrape: () => void;
  isJobRunning?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewScrape,
  isJobRunning,
}) => {
  return (
    <div className="sticky top-3 z-40 px-4 mb-4">
      <nav className="max-w-5xl mx-auto flex items-center justify-between gap-6 py-2 px-3 md:pl-5 md:pr-2 bg-[#101118]/80 backdrop-blur-xl border border-[#292B38] rounded-full shadow-2xl transition-all">
        {/* Brand Zone */}
        <button
          onClick={() => onSelectTab('leads')}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#85A9FA] rounded-full text-left cursor-pointer"
        >
          <ForgeonLogo variant="horizontal" size={24} />
        </button>

        {/* Nav Links Zone (Single-line, Space Grotesk font) */}
        <div className="hidden md:flex items-center gap-6 font-sans text-[14px]">
          <button
            onClick={() => onSelectTab('leads')}
            className={`whitespace-nowrap transition-colors py-1 relative ${
              currentTab === 'leads' ? 'text-[#F4F4F7] font-semibold' : 'text-[#A3A6B5] hover:text-[#F4F4F7]'
            }`}
          >
            Diretório de Leads
            {currentTab === 'leads' && (
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-[#4128FB] via-[#454DFC] to-[#85A9FA] rounded-full" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('live')}
            className={`whitespace-nowrap transition-colors py-1 relative flex items-center gap-1.5 ${
              currentTab === 'live' ? 'text-[#F4F4F7] font-semibold' : 'text-[#A3A6B5] hover:text-[#F4F4F7]'
            }`}
          >
            Monitor ao Vivo
            {isJobRunning && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#454DFC] animate-ping" />
            )}
            {currentTab === 'live' && (
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-[#4128FB] via-[#454DFC] to-[#85A9FA] rounded-full" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('hierarchy')}
            className={`whitespace-nowrap transition-colors py-1 relative ${
              currentTab === 'hierarchy' ? 'text-[#F4F4F7] font-semibold' : 'text-[#A3A6B5] hover:text-[#F4F4F7]'
            }`}
          >
            Estrutura de Pastas
            {currentTab === 'hierarchy' && (
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-[#4128FB] via-[#454DFC] to-[#85A9FA] rounded-full" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('design-system')}
            className={`whitespace-nowrap transition-colors py-1 relative ${
              currentTab === 'design-system' ? 'text-[#85A9FA] font-semibold' : 'text-[#A3A6B5] hover:text-[#F4F4F7]'
            }`}
          >
            Design System V2
            {currentTab === 'design-system' && (
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-[#9070F7] to-[#85A9FA] rounded-full" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('code')}
            className={`whitespace-nowrap transition-colors py-1 relative ${
              currentTab === 'code' ? 'text-[#F4F4F7] font-semibold' : 'text-[#A3A6B5] hover:text-[#F4F4F7]'
            }`}
          >
            Script Python
            {currentTab === 'code' && (
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-[#4128FB] via-[#454DFC] to-[#85A9FA] rounded-full" />
            )}
          </button>
        </div>

        {/* Primary Action Zone (Forgeon V2 Pill Action Button) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenNewScrape}
            className="btn-forgeon-primary h-10 px-5 text-xs tracking-wide uppercase shrink-0 cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nova Varredura
          </button>
        </div>
      </nav>
    </div>
  );
};
