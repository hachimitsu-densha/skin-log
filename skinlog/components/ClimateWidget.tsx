
import React from 'react';
import { CloudRain, Thermometer } from 'lucide-react';

const ClimateWidget: React.FC<{ humidity: number }> = ({ humidity }) => {
  return (
    <div className="flex items-center space-x-4 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm border border-stone-100">
      <div className="flex items-center text-sage-600">
        <span className="font-bold text-lg mr-1 text-[#588157]">HK</span>
      </div>
      <div className="flex items-center space-x-2 text-stone-600 text-sm">
        <div className="flex items-center">
          <CloudRain className="w-4 h-4 mr-1 text-sky-400" />
          <span>{humidity}% Humidity</span>
        </div>
        <div className="flex items-center">
          <Thermometer className="w-4 h-4 mr-1 text-orange-400" />
          <span>28°C</span>
        </div>
      </div>
      {humidity > 70 && (
        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Pore Alert
        </span>
      )}
    </div>
  );
};

export default ClimateWidget;
