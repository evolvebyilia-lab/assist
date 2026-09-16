import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Sparkles, MessageSquareQuote } from 'lucide-react';
import { playSoundEffect } from '../utils/audio';

interface SpeechBubbleProps {
  message: string | null;
  isSpeaking: boolean;
  actionTag?: string | null;
  hasAudioAvailable?: boolean;
  onReplayAudio?: () => void;
  onStopAudio?: () => void;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  message,
  isSpeaking,
  actionTag,
  hasAudioAvailable = false,
  onReplayAudio,
  onStopAudio,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Typewriter effect whenever a new message arrives
  useEffect(() => {
    if (!message) {
      setDisplayedText('');
      return;
    }

    playSoundEffect('pop');
    setDisplayedText('');
    setIsTyping(true);

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex += 1;
      setDisplayedText(message.slice(0, currentIndex));

      if (currentIndex >= message.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 28);

    return () => clearInterval(interval);
  }, [message]);

  if (!message) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.9 }}
        transition={{ duration: 0.25 }}
        className="relative z-30 max-w-sm sm:max-w-md w-full px-4 py-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-slate-100"
      >
        {/* Tail pointing down towards Tato */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-slate-900 border-b border-r border-slate-700/80 rotate-45" />

        {/* Header row with status & audio control */}
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              ტატოს პასუხი
            </span>
            {actionTag && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                {actionTag}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {hasAudioAvailable && (
              isSpeaking ? (
                <button
                  onClick={onStopAudio}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-medium border border-rose-500/30 hover:bg-rose-500/30 transition-colors"
                  title="ხმის გაჩერება"
                >
                  <VolumeX className="w-3 h-3" />
                  <span>გაჩერება</span>
                </button>
              ) : (
                <button
                  onClick={onReplayAudio}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700 hover:text-white hover:bg-slate-700 transition-colors"
                  title="აუდიო გაჟღერება"
                >
                  <Volume2 className="w-3 h-3 text-cyan-400" />
                  <span>მოსმენა</span>
                </button>
              )
            )}

            {!hasAudioAvailable && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 text-[10px] border border-slate-700/60" title="ვიზუალური ქართული სუბტიტრები">
                <MessageSquareQuote className="w-3 h-3 text-amber-400" />
                <span>ქართული სუბტიტრები</span>
              </span>
            )}
          </div>
        </div>

        {/* Animated Spoken Text (Typewriter) */}
        <p className="text-xs sm:text-sm font-normal text-slate-200 leading-relaxed min-h-[2.5rem]">
          {displayedText}
          {isTyping && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="inline-block w-1.5 h-3.5 ml-1 bg-amber-400 align-middle rounded-full"
            />
          )}
        </p>

        {/* Audio Equalizer Waveform while speaking */}
        {isSpeaking && (
          <div className="flex items-center gap-1 mt-2.5 pt-1.5 border-t border-slate-800/80 justify-center">
            {[40, 75, 50, 95, 60, 85, 45, 90, 65, 35].map((height, idx) => (
              <motion.div
                key={idx}
                animate={{
                  height: [6, height / 3.5, 6],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: idx * 0.06,
                  ease: "easeInOut",
                }}
                className="w-1 bg-gradient-to-t from-cyan-500 to-amber-400 rounded-full"
              />
            ))}
            <span className="text-[10px] text-cyan-400 ml-2 font-medium">საუბრობს...</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

