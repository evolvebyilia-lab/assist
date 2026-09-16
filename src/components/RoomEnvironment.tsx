import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, Sun, Moon, Sunset, Wifi, Volume2, ShieldCheck, Sparkles } from 'lucide-react';
import { AvatarState } from '../types';

interface RoomEnvironmentProps {
  avatarState: AvatarState;
  roomTheme: 'day' | 'evening' | 'night';
  onThemeChange: (theme: 'day' | 'evening' | 'night') => void;
}

export const RoomEnvironment: React.FC<RoomEnvironmentProps> = ({
  avatarState,
  roomTheme,
  onThemeChange,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }));

      const days = ['კვირა', 'ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი'];
      const months = ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'];
      setDateStr(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusText = () => {
    switch (avatarState) {
      case 'LISTENING':
        return { text: 'გისმენს (Listening)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'THINKING':
        return { text: 'ფიქრობს (Thinking)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'ACTING':
        return { text: 'დავალება სრულდება (Executing)', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
      case 'SUCCESS':
        return { text: 'მზადაა (Completed)', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' };
      case 'ERROR':
        return { text: 'დააზუსტე (Clarify)', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      default:
        return { text: 'მზადყოფნაშია (Online & Ready)', color: 'text-slate-300 bg-slate-800/60 border-slate-700/50' };
    }
  };

  const status = getStatusText();

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Bar: Clock / Status Indicator & Lighting Toggle */}
      <div className="w-full max-w-6xl flex items-center justify-between px-4 py-2 text-xs">
        {/* Georgian Clock Widget */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-md">
            <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div>
              <span className="font-bold text-slate-100 text-sm tracking-wider">{timeStr || '12:00'}</span>
              <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">{dateStr}</span>
            </div>
          </div>

          {/* Room Live Status */}
          <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border backdrop-blur-md ${status.color}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-ping" />
            <span className="font-medium text-[11px]">{status.text}</span>
          </div>
        </div>

        {/* Lighting Mode & Room Ambiance Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800">
          <button
            onClick={() => onThemeChange('day')}
            className={`p-1.5 rounded-lg transition-colors ${
              roomTheme === 'day'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="დღის განათება"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onThemeChange('evening')}
            className={`p-1.5 rounded-lg transition-colors ${
              roomTheme === 'evening'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="საღამოს განათება"
          >
            <Sunset className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onThemeChange('night')}
            className={`p-1.5 rounded-lg transition-colors ${
              roomTheme === 'night'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="ღამის სიმყუდროვე"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
