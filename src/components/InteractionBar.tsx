import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Send, Sparkles, AudioWaveform, Radio } from 'lucide-react';
import { playSoundEffect } from '../utils/audio';

interface InteractionBarProps {
  onSendMessage: (text: string) => void;
  isListening: boolean;
  liveTranscript?: string;
  onToggleListening: () => void;
  disabled?: boolean;
}

export const InteractionBar: React.FC<InteractionBarProps> = ({
  onSendMessage,
  isListening,
  liveTranscript = '',
  onToggleListening,
  disabled = false,
}) => {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const quickPrompts = [
    { text: 'ხვალ 10:00-ზე შეხვედრა ჩამინიშნე', label: '📅 შეხვედრა 10:00-ზე' },
    { text: 'ერთ საათში ვარჯიში შემახსენე', label: '🎯 ვარჯიშის შეხსენება' },
    { text: 'ჩაიწერე ახალი იდეა: პროექტის გეგმა', label: '💡 ახალი იდეა' },
    { text: 'ხვალ სამზე... არა, ოთხზე შეხვედრა ჩამინიშნე', label: '🔄 თვითშესწორების ტესტი' },
    { text: 'რა მაქვს დღეს გასაკეთებელი?', label: '📋 დღის განრიგი' },
    { text: 'გამარჯობა ტატო, რით შეგიძლია დამეხმარო?', label: '☕ სალამი' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || disabled) return;
    playSoundEffect('click');
    onSendMessage(inputVal.trim());
    setInputVal('');
  };

  const handlePromptClick = (text: string) => {
    if (disabled) return;
    playSoundEffect('click');
    onSendMessage(text);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-2.5 px-4 pb-4 select-none">
      {/* Live Speech Recognition Transcript Banner */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            className="w-full overflow-hidden"
          >
            <div className="w-full py-2 px-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 shadow-lg shadow-emerald-950/50 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300 shrink-0">
                  გისმენთ (ქართულად):
                </span>
                <span className="text-slate-100 font-medium truncate">
                  {liveTranscript ? `„${liveTranscript}“` : 'თქვით ბრძანება... (მაგ. „ხვალ 10:00-ზე შეხვედრა ჩამინიშნე“)'}
                </span>
              </div>

              {/* Sound wave equalizer bar */}
              <div className="flex items-center gap-0.5 shrink-0">
                {[12, 22, 16, 26, 18, 10].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [6, h, 6] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }}
                    className="w-0.5 bg-emerald-400 rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Prompt Chips */}
      <div className="w-full flex items-center gap-1.5 overflow-x-auto py-1 px-1 custom-scrollbar scrollbar-none text-xs">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 mr-1 shrink-0">
          <Sparkles className="w-3 h-3 text-amber-400" />
          სწრაფი ბრძანებები:
        </span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handlePromptClick(p.text)}
            disabled={disabled}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 hover:border-cyan-500/40 text-xs transition-all active:scale-95 disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main Controls: Large "Click to Talk" Button + Text Input */}
      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Obvious "Click to Talk" / "დააჭირე და ისაუბრე" Button */}
        <div className="relative">
          {isListening && (
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="absolute -inset-1 rounded-2xl bg-emerald-500/40 blur-sm pointer-events-none"
            />
          )}

          <button
            type="button"
            onClick={onToggleListening}
            disabled={disabled}
            className={`relative z-10 w-full sm:w-auto px-4 py-3 rounded-2xl flex items-center justify-center gap-2.5 font-semibold text-xs sm:text-sm transition-all shadow-lg active:scale-95 ${
              isListening
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-500/40 ring-4 ring-emerald-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-cyan-400'
            }`}
            title={isListening ? "ხმოვანი ჩაწერის დასრულება" : "დააჭირე და ისაუბრე ქართულად"}
          >
            {isListening ? (
              <>
                <Radio className="w-4 h-4 text-slate-950 animate-pulse" />
                <span>დასრულება (Click to Stop)</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-cyan-400" />
                <span>დააჭირე და ისაუბრე (Click to Talk)</span>
              </>
            )}
          </button>
        </div>

        {/* Text Input Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 relative flex items-center rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20 shadow-xl transition-all"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={disabled}
            placeholder={
              isListening
                ? "გისმენთ ქართულად... (თქვით ბრძანება)"
                : "ან მისწერე ტატოს... (მაგ. „ხვალ 10:00-ზე შეხვედრა ჩამინიშნე“)"
            }
            className="w-full px-4 py-3 bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputVal.trim() || disabled}
            className={`mr-2 px-3 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1 transition-all ${
              inputVal.trim() && !disabled
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-md active:scale-95'
                : 'text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>გაგზავნა</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

