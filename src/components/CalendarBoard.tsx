import React, { useState } from 'react';
import { CalendarEvent } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Plus, Trash2, Clock, CheckCircle2, Tag } from 'lucide-react';

interface CalendarBoardProps {
  events: CalendarEvent[];
  isHighlighted: boolean;
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onDeleteEvent: (id: string) => void;
}

export const CalendarBoard: React.FC<CalendarBoardProps> = ({
  events,
  isHighlighted,
  onAddEvent,
  onDeleteEvent,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('14:00');
  const [newDate, setNewDate] = useState('დღეს');
  const [newCategory, setNewCategory] = useState<'work' | 'personal' | 'health' | 'study'>('work');

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddEvent({
      title: newTitle.trim(),
      time: newTime,
      date: newDate,
      category: newCategory,
    });
    setNewTitle('');
    setIsAdding(false);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'work':
        return { label: 'სამუშაო', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'personal':
        return { label: 'პირადი', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'health':
        return { label: 'ჯანმრთელობა', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'study':
        return { label: 'სწავლა', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      default:
        return { label: 'სხვა', bg: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    }
  };

  return (
    <motion.div
      id="calendar-board"
      animate={isHighlighted ? {
        scale: [1, 1.03, 1],
        boxShadow: "0 0 35px rgba(56, 189, 248, 0.5)",
        borderColor: "rgba(56, 189, 248, 0.8)",
      } : {}}
      transition={{ duration: 0.6 }}
      className={`relative w-full rounded-2xl bg-slate-900/80 backdrop-blur-xl border transition-all duration-300 shadow-xl overflow-hidden flex flex-col ${
        isHighlighted ? 'border-cyan-400 ring-2 ring-cyan-400/40' : 'border-slate-700/60'
      }`}
    >
      {/* Top Header / Wall Board Frame */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-800/90 to-slate-900/90 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              კალენდრის დაფა
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                {events.length} ღონისძიება
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">დღის განრიგი და შეხვედრები</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white transition-colors"
          title="ახალი ღონისძიების დამატება"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Manual Quick Add Form Dropdown */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleManualAdd}
            className="p-3 bg-slate-800/90 border-b border-slate-700 space-y-2.5 text-xs"
          >
            <input
              type="text"
              placeholder="შეხვედრის სათაური..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              autoFocus
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="დღეს/ხვალ"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100"
              />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100"
              />
              <select
                value={newCategory}
                onChange={(e: any) => setNewCategory(e.target.value)}
                className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100"
              >
                <option value="work">სამუშაო</option>
                <option value="personal">პირადი</option>
                <option value="health">ჯანმრთელობა</option>
                <option value="study">სწავლა</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1 rounded text-slate-400 hover:text-slate-200"
              >
                გაუქმება
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
              >
                დამატება
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Events List */}
      <div className="p-3 space-y-2 max-h-56 overflow-y-auto custom-scrollbar flex-1">
        {events.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center gap-1.5">
            <Calendar className="w-8 h-8 opacity-40" />
            <span>კალენდარი ცარიელია</span>
            <span className="text-[11px] text-slate-400">უთხარი ტატოს: „ხვალ 10:00-ზე შეხვედრა ჩამინიშნე“</span>
          </div>
        ) : (
          events.map((evt) => {
            const badge = getCategoryBadge(evt.category);
            return (
              <motion.div
                key={evt.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 flex flex-col items-center justify-center w-11 h-11 rounded-lg bg-slate-900 border border-slate-700/80 text-center">
                    <Clock className="w-3 h-3 text-cyan-400 mb-0.5" />
                    <span className="text-[11px] font-bold text-slate-200">{evt.time}</span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-100 truncate">{evt.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400">{evt.date}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteEvent(evt.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-400 transition-all rounded"
                  title="წაშლა"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
