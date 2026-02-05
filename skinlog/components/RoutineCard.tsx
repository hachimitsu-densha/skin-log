
import React from 'react';
import { DeviceMode, RoutineStep } from '../types';
import { Zap, Sparkles, Activity, ShieldCheck, Share2 } from 'lucide-react';

interface RoutineCardProps {
  step: RoutineStep;
}

const RoutineCard: React.FC<RoutineCardProps> = ({ step }) => {
  const getDeviceStyle = (mode: DeviceMode) => {
    switch (mode) {
      case DeviceMode.AIR_SHOT: 
        return { 
          icon: <Zap className="w-4 h-4 text-blue-500" />, 
          bg: 'bg-blue-50', 
          border: 'border-blue-100',
          text: 'text-blue-700',
          label: 'AIR SHOT'
        };
      case DeviceMode.BOOSTER: 
        return { 
          icon: <Sparkles className="w-4 h-4 text-orange-500" />, 
          bg: 'bg-orange-50', 
          border: 'border-orange-100',
          text: 'text-orange-700',
          label: 'BOOSTER'
        };
      case DeviceMode.MC_DERMA: 
        return { 
          icon: <Activity className="w-4 h-4 text-purple-500" />, 
          bg: 'bg-purple-50', 
          border: 'border-purple-100',
          text: 'text-purple-700',
          label: 'MC / DERMA'
        };
      default: return null;
    }
  };

  const deviceStyle = getDeviceStyle(step.deviceMode);

  return (
    <div className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-stone-200 mb-4 relative group hover:border-[#A98467]/30 transition-all">
      <div className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-bold text-stone-400 border border-stone-100 rounded-full">
        STEP {step.step}
      </div>

      <div className="flex justify-between items-start mt-1">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#A98467] mb-0.5 block">
            {step.product.category}
          </span>
          <h3 className="text-base font-bold text-stone-800 leading-tight">
            {step.product.brand}
          </h3>
          <p className="text-stone-500 text-xs italic">
            {step.product.name}
          </p>
        </div>
      </div>

      {deviceStyle && (
        <div className={`mt-3 ${deviceStyle.bg} ${deviceStyle.border} border rounded-xl p-3 flex flex-col gap-2`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {deviceStyle.icon}
              <span className={`text-[10px] font-extrabold tracking-wider ${deviceStyle.text}`}>
                {deviceStyle.label}
              </span>
            </div>
            <span className="text-[9px] font-bold bg-white/60 px-2 py-0.5 rounded-full text-stone-600 border border-stone-200/50">
              LEVEL {step.level}
            </span>
          </div>
          <p className={`text-[11px] font-medium ${deviceStyle.text} opacity-90 leading-snug`}>
             {step.why}
          </p>
        </div>
      )}
      
      {!deviceStyle && (
        <p className="text-xs text-stone-500 mt-2 pl-1 border-l-2 border-stone-100">
          {step.why}
        </p>
      )}

      {step.guruInsight && (
        <div className="flex items-start gap-2 mt-3 pt-2 border-t border-stone-50">
          <ShieldCheck className="w-3 h-3 text-[#588157] mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-[#588157] leading-tight">
            <span className="font-bold">Guru Tip:</span> {step.guruInsight}
          </p>
        </div>
      )}
    </div>
  );
};

export default RoutineCard;
