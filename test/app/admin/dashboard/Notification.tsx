import React from 'react';

type NotificationProps = {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
};

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`px-4 py-3 rounded-md shadow-md flex items-center justify-between ${
          type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        <span className="mr-4">{message}</span>
        <button 
          onClick={onClose}
          className="text-gray-600 hover:text-gray-800 focus:outline-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Notification;