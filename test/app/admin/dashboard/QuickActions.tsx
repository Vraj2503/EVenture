import React from 'react';

type QuickActionsProps = {
  onAddScooter?: () => void;
};

const QuickActions: React.FC<QuickActionsProps> = ({ onAddScooter }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button 
          onClick={onAddScooter}
          className="p-4 border border-gray-300 rounded-md hover:bg-gray-50 text-left"
        >
          <h3 className="font-medium">Add Scooter</h3>
          <p className="text-sm text-gray-600">Add a new scooter to your fleet</p>
        </button>
        
        <button className="p-4 border border-gray-300 rounded-md hover:bg-gray-50 text-left">
          <h3 className="font-medium">View Bookings</h3>
          <p className="text-sm text-gray-600">Manage pending and active bookings</p>
        </button>
        
        <button className="p-4 border border-gray-300 rounded-md hover:bg-gray-50 text-left">
          <h3 className="font-medium">Update Profile</h3>
          <p className="text-sm text-gray-600">Edit your store information</p>
        </button>
        
        <button className="p-4 border border-gray-300 rounded-md hover:bg-gray-50 text-left">
          <h3 className="font-medium">View Reports</h3>
          <p className="text-sm text-gray-600">Sales and rental analytics</p>
        </button>
      </div>
    </div>
  );
};

export default QuickActions;