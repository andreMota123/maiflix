
import React from 'react';

interface FunctionCardProps {
  icon: string;
  name: string;
  isActive: boolean;
  onClick: () => void;
}

const FunctionCard: React.FC<FunctionCardProps> = ({ icon, name, isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`function-card flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
        isActive
          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
          : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
      }`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm font-medium text-center">{name}</div>
    </div>
  );
};

export default FunctionCard;
