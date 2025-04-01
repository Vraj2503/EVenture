import React from 'react';
import { AdminData } from './page';

type DashboardHeaderProps = {
  adminData: AdminData | null;
  onLogout: () => void;
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ adminData, onLogout }) => {
  return (
    <header className="bg-black text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <img src="/download.svg" alt="EVenture Logo" className="h-10 w-10" />
          <span className="ml-2 text-2xl font-light">EVenture Admin</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {adminData && (
            <span className="hidden md:inline">{adminData.name} | {adminData.store_location}</span>
          )}
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;