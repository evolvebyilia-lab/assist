import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AvatarState } from '../types';
import { Sparkles, Mic, Brain, CheckCircle2, AlertCircle } from 'lucide-react';

interface AssistantAvatarProps {
  state: AvatarState;
  isSpeaking: boolean;
  mood?: string;
  onClick?: () => void;
}

export const AssistantAvatar: React.FC<AssistantAvatarProps> = ({
  state,
  isSpeaking,
  mood = 'happy',
  onClick,
}) => {
  const [blink, setBlink] = useState(false);

  // Random natural blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3800 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Avatar posture and head tilt based on state
  const headVariants = {
    IDLE: { rotate: [0, 1.2, 0, -1.2, 0], y: [0, -2, 0, -2, 0], transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" } },
    LISTENING: { rotate: 2.5, y: -4, scale: 1.03, transition: { duration: 0.3 } },
    THINKING: { rotate: -4.5, y: -3, transition: { duration: 0.4 } },
    ACTING: { rotate: 2, y: -2, transition: { duration: 0.4 } },
    SUCCESS: { rotate: 0, y: [-1, -4, 0], scale: 1.02, transition: { duration: 0.5 } },
    ERROR: { rotate: -3, y: 1, transition: { duration: 0.3 } },
  };

  return (
    <div 
      className="relative flex flex-col items-center justify-center select-none cursor-pointer group"
      onClick={onClick}
      title="ტატო — შენი პირადი AI ასისტენტი (დააწკაპუნე სალაპარაკოდ)"
    >
      {/* Listening / Thinking Ambient Halo */}
      {state === 'LISTENING' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-6 rounded-full bg-gradient-to-r from-emerald-500/25 via-cyan-500/25 to-blue-500/25 blur-xl pointer-events-none"
        />
      )}

      {state === 'THINKING' && (
        <motion.div
          animate={{ rotate: 360, opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-5 rounded-full bg-gradient-to-tr from-amber-500/20 via-indigo-500/20 to-purple-500/20 blur-lg pointer-events-none"
        />
      )}

      {/* Main Avatar Body Container */}
      <motion.div
        animate={headVariants[state] || headVariants.IDLE}
        className="relative z-10 w-44 h-52 sm:w-48 sm:h-56 flex items-center justify-center"
      >
        <svg
          viewBox="0 0 240 280"
          className="w-full h-full drop-shadow-2xl overflow-visible"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2D3748" />
              <stop offset="100%" stopColor="#1A202C" />
            </linearGradient>
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FBD38D" />
              <stop offset="100%" stopColor="#F6AD55" />
            </linearGradient>
            <linearGradient id="jacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3182CE" />
              <stop offset="100%" stopColor="#1A365D" />
            </linearGradient>
            <linearGradient id="collarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EDF2F7" />
              <stop offset="100%" stopColor="#CBD5E0" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Shoulders & Jacket */}
          <path
            d="M 40 250 C 40 205, 80 195, 120 195 C 160 195, 200 205, 200 250 L 210 280 L 30 280 Z"
            fill="url(#jacketGrad)"
          />
          {/* Inner Shirt Collar */}
          <polygon
            points="105,195 135,195 120,225"
            fill="url(#collarGrad)"
          />
          {/* Tech Pendant / Mic Node */}
          <circle cx="120" cy="225" r="5" fill="#38B2AC" filter="url(#softGlow)" />
          {state === 'LISTENING' && (
            <circle cx="120" cy="225" r="9" fill="none" stroke="#4FD1C5" strokeWidth="1.5" className="animate-ping" />
          )}

          {/* Neck */}
          <rect x="105" y="165" width="30" height="35" rx="6" fill="#ED8936" opacity="0.8" />
          <rect x="107" y="165" width="26" height="30" rx="5" fill="url(#skinGrad)" />

          {/* Ears */}
          <ellipse cx="64" cy="130" rx="8" ry="12" fill="url(#skinGrad)" />
          <ellipse cx="176" cy="130" rx="8" ry="12" fill="url(#skinGrad)" />

          {/* Head Shape */}
          <path
            d="M 70 120 C 70 70, 170 70, 170 120 C 170 165, 150 178, 120 178 C 90 178, 70 165, 70 120 Z"
            fill="url(#skinGrad)"
          />

          {/* Cheeks - gentle blush */}
          <circle cx="85" cy="140" r="7" fill="#F56565" opacity="0.3" />
          <circle cx="155" cy="140" r="7" fill="#F56565" opacity="0.3" />

          {/* Modern Hair */}
          <path
            d="M 66 110 C 66 50, 174 50, 174 110 C 178 95, 170 70, 150 60 C 130 50, 95 55, 78 72 C 68 82, 65 96, 66 110 Z"
            fill="url(#hairGrad)"
          />
          {/* Stylish Hair Strands */}
          <path
            d="M 80 82 C 105 75, 135 78, 150 92 C 135 88, 110 88, 92 98 Z"
            fill="#4A5568"
          />

          {/* Eyebrows */}
          {state === 'THINKING' ? (
            <>
              {/* Left eyebrow raised */}
              <path d="M 84 105 Q 96 98 108 104" stroke="#2D3748" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Right eyebrow furrowed */}
              <path d="M 132 107 Q 144 109 156 106" stroke="#2D3748" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          ) : state === 'ERROR' ? (
            <>
              <path d="M 84 107 Q 96 109 108 106" stroke="#2D3748" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 132 106 Q 144 109 156 107" stroke="#2D3748" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Normal/Smiling eyebrows */}
              <path d="M 84 106 Q 96 102 108 106" stroke="#2D3748" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 132 106 Q 144 102 156 106" stroke="#2D3748" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          )}

          {/* Eyes */}
          {blink ? (
            <>
              {/* Blinking: closed lines */}
              <path d="M 86 122 Q 96 126 106 122" stroke="#1A202C" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 134 122 Q 144 126 154 122" stroke="#1A202C" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          ) : state === 'LISTENING' ? (
            <>
              {/* Wide attentive eyes */}
              <circle cx="96" cy="120" r="9" fill="#1A202C" />
              <circle cx="144" cy="120" r="9" fill="#1A202C" />
              {/* Iris highlights */}
              <circle cx="94" cy="118" r="3.5" fill="#FFFFFF" />
              <circle cx="98" cy="122" r="1.5" fill="#FFFFFF" />
              <circle cx="142" cy="118" r="3.5" fill="#FFFFFF" />
              <circle cx="146" cy="122" r="1.5" fill="#FFFFFF" />
              {/* Listening cyan sparkle in eyes */}
              <circle cx="97" cy="119" r="1.2" fill="#38B2AC" />
              <circle cx="145" cy="119" r="1.2" fill="#38B2AC" />
            </>
          ) : state === 'THINKING' ? (
            <>
              {/* Looking slightly upward */}
              <circle cx="98" cy="117" r="7.5" fill="#1A202C" />
              <circle cx="146" cy="117" r="7.5" fill="#1A202C" />
              <circle cx="96" cy="115" r="2.8" fill="#FFFFFF" />
              <circle cx="144" cy="115" r="2.8" fill="#FFFFFF" />
            </>
          ) : (
            <>
              {/* Normal friendly eyes */}
              <ellipse cx="96" cy="121" rx="7.5" ry="8" fill="#1A202C" />
              <ellipse cx="144" cy="121" rx="7.5" ry="8" fill="#1A202C" />
              <circle cx="94" cy="118" r="2.8" fill="#FFFFFF" />
              <circle cx="98" cy="123" r="1.3" fill="#FFFFFF" />
              <circle cx="142" cy="118" r="2.8" fill="#FFFFFF" />
              <circle cx="146" cy="123" r="1.3" fill="#FFFFFF" />
            </>
          )}

          {/* Minimalist Nose */}
          <path d="M 120 126 L 118 135 L 122 135" stroke="#DD6B20" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

          {/* Mouth (Dynamic: speaking, smiling, thinking) */}
          {isSpeaking ? (
            <motion.path
              animate={{
                d: [
                  "M 112 150 Q 120 160 128 150 Q 120 156 112 150",
                  "M 114 150 Q 120 154 126 150 Q 120 152 114 150",
                  "M 110 150 Q 120 163 130 150 Q 120 158 110 150",
                ],
              }}
              transition={{ duration: 0.35, repeat: Infinity, ease: "easeInOut" }}
              fill="#9B2C2C"
              stroke="#742A2A"
              strokeWidth="1.5"
            />
          ) : state === 'THINKING' ? (
            // Small thoughtful mouth
            <path d="M 114 151 Q 120 151 126 149" stroke="#742A2A" strokeWidth="2" fill="none" strokeLinecap="round" />
          ) : state === 'ERROR' ? (
            // Slight wry / questioning mouth
            <path d="M 114 152 Q 120 148 126 151" stroke="#742A2A" strokeWidth="2" fill="none" strokeLinecap="round" />
          ) : (
            // Gentle warm smile
            <path d="M 110 148 Q 120 157 130 148" stroke="#742A2A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}

          {/* Modern Minimal Glasses/Visor Frame */}
          <g opacity="0.85">
            <rect x="82" y="112" width="28" height="18" rx="6" fill="none" stroke="#4A5568" strokeWidth="1.5" />
            <rect x="130" y="112" width="28" height="18" rx="6" fill="none" stroke="#4A5568" strokeWidth="1.5" />
            <path d="M 110 120 L 130 120" stroke="#4A5568" strokeWidth="1.5" />
            {/* Glasses reflection */}
            <path d="M 85 115 L 94 115" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
            <path d="M 133 115 L 142 115" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
          </g>
        </svg>

        {/* State Indicator Badges floating above Tato */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          {state === 'LISTENING' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 rounded-full text-emerald-300 text-xs font-medium shadow-lg"
            >
              <Mic className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>გისმენს...</span>
            </motion.div>
          )}

          {state === 'THINKING' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 backdrop-blur-md border border-amber-400/40 rounded-full text-amber-300 text-xs font-medium shadow-lg"
            >
              <Brain className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>ფიქრობს...</span>
            </motion.div>
          )}

          {state === 'ACTING' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 backdrop-blur-md border border-cyan-400/40 rounded-full text-cyan-300 text-xs font-medium shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
              <span>ბუბუ ასრულებს...</span>
            </motion.div>
          )}

          {state === 'SUCCESS' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 backdrop-blur-md border border-teal-400/40 rounded-full text-teal-300 text-xs font-medium shadow-lg"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>შესრულებულია!</span>
            </motion.div>
          )}

          {state === 'ERROR' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 backdrop-blur-md border border-rose-400/40 rounded-full text-rose-300 text-xs font-medium shadow-lg"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>დააზუსტე გთხოვ</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Name and Role Label */}
      <div className="mt-1 flex flex-col items-center">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-100 text-base tracking-wide">ტატო</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="აქტიურია" />
        </div>
        <span className="text-xs text-slate-400 font-medium">ქართულენოვანი AI ასისტენტი</span>
      </div>
    </div>
  );
};
