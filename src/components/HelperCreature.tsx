import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TargetWidget } from '../types';
import { Sparkles } from 'lucide-react';

interface HelperCreatureProps {
  avatarState: string;
  targetWidget: TargetWidget;
  onArrivedAtTarget?: (widget: TargetWidget) => void;
  onReturnedHome?: () => void;
}

export const HelperCreature: React.FC<HelperCreatureProps> = ({
  avatarState,
  targetWidget,
  onArrivedAtTarget,
  onReturnedHome,
}) => {
  const [internalPhase, setInternalPhase] = useState<'HOME' | 'FLYING_OUT' | 'TOUCHING' | 'FLYING_BACK'>('HOME');

  // Trigger flight animation sequence when targetWidget is set and avatar enters ACTING state
  useEffect(() => {
    if (avatarState === 'ACTING' && targetWidget) {
      setInternalPhase('FLYING_OUT');

      // Arrive at target after 800ms
      const touchTimer = setTimeout(() => {
        setInternalPhase('TOUCHING');
        if (onArrivedAtTarget) onArrivedAtTarget(targetWidget);

        // Stay and interact for 900ms
        const returnTimer = setTimeout(() => {
          setInternalPhase('FLYING_BACK');

          // Back home after 800ms
          const homeTimer = setTimeout(() => {
            setInternalPhase('HOME');
            if (onReturnedHome) onReturnedHome();
          }, 800);

          return () => clearTimeout(homeTimer);
        }, 900);

        return () => clearTimeout(returnTimer);
      }, 800);

      return () => clearTimeout(touchTimer);
    } else {
      setInternalPhase('HOME');
    }
  }, [avatarState, targetWidget]);

  // Determine destination coordinates relative to its resting dock beside Tato
  const getDestinationCoords = () => {
    if (internalPhase === 'HOME') {
      return { x: 0, y: 0, rotate: 0, scale: 1 };
    }

    if (internalPhase === 'FLYING_OUT' || internalPhase === 'TOUCHING') {
      if (targetWidget === 'calendar') {
        // Upper right (Calendar board on wall)
        return { x: 260, y: -110, rotate: internalPhase === 'TOUCHING' ? 360 : 15, scale: 1.15 };
      }
      if (targetWidget === 'tasks' || targetWidget === 'notes') {
        // Lower right / desk area (Notebook & Sticky notes widget)
        return { x: 240, y: 130, rotate: internalPhase === 'TOUCHING' ? 360 : -10, scale: 1.15 };
      }
      return { x: 180, y: 0, rotate: 20, scale: 1.1 };
    }

    if (internalPhase === 'FLYING_BACK') {
      return { x: 0, y: 0, rotate: -15, scale: 0.95 };
    }

    return { x: 0, y: 0, rotate: 0, scale: 1 };
  };

  const coords = getDestinationCoords();

  return (
    <motion.div
      animate={{
        x: coords.x,
        y: coords.y,
        rotate: coords.rotate,
        scale: coords.scale,
      }}
      transition={{
        duration: internalPhase === 'TOUCHING' ? 0.4 : 0.8,
        ease: internalPhase === 'TOUCHING' ? "easeInOut" : [0.25, 1, 0.5, 1],
      }}
      className="relative z-20 cursor-pointer select-none group"
      title="ბუბუ (Bubu) — ტატოს მფრინავი დამხმარე"
    >
      {/* Flight Trail / Glow */}
      <AnimatePresence>
        {(internalPhase === 'FLYING_OUT' || internalPhase === 'FLYING_BACK') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.8, scale: 1.6 }}
            exit={{ opacity: 0, scale: 0.2 }}
            className="absolute -inset-4 rounded-full bg-gradient-to-r from-amber-400/40 via-cyan-400/40 to-indigo-500/40 blur-md pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Sparkles burst when touching widget */}
      <AnimatePresence>
        {internalPhase === 'TOUCHING' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 2], opacity: [1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute -inset-6 rounded-full border-2 border-amber-300 bg-amber-400/20 blur-sm pointer-events-none flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-amber-300 animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Creature Body with gentle bobbing when at home */}
      <motion.div
        animate={
          internalPhase === 'HOME'
            ? { y: [-4, 4, -4], rotate: [-2, 2, -2] }
            : {}
        }
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex flex-col items-center"
      >
        {/* Antenna / Energy Halo */}
        <div className="relative flex flex-col items-center">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#F6E05E]"
          />
          <div className="w-0.5 h-2 bg-slate-400" />
        </div>

        {/* Cute Floating Orb SVG */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl overflow-visible">
            <defs>
              <linearGradient id="creatureGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
              <linearGradient id="creatureScreen" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0F172A" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>
              <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Left Tiny Wing */}
            <motion.ellipse
              cx="12"
              cy="50"
              rx="12"
              ry="6"
              fill="url(#wingGrad)"
              animate={{ rotate: [-20, 20, -20] }}
              transition={{ duration: 0.35, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Right Tiny Wing */}
            <motion.ellipse
              cx="88"
              cy="50"
              rx="12"
              ry="6"
              fill="url(#wingGrad)"
              animate={{ rotate: [20, -20, 20] }}
              transition={{ duration: 0.35, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Main Round Robotic/Spirit Orb Shell */}
            <circle cx="50" cy="50" r="38" fill="url(#creatureGrad)" />
            {/* Gloss Highlight */}
            <ellipse cx="40" cy="24" rx="14" ry="7" fill="#FFFFFF" opacity="0.3" />

            {/* Inner Digital Screen Face Mask */}
            <rect x="22" y="32" width="56" height="36" rx="18" fill="url(#creatureScreen)" stroke="#C084FC" strokeWidth="1.5" />

            {/* Emotive Digital Eyes */}
            {internalPhase === 'TOUCHING' ? (
              // Star Sparkle Eyes (*‿*)
              <g fill="#FDE047">
                <text x="32" y="56" fontSize="18" fontWeight="bold" textAnchor="middle">★</text>
                <text x="68" y="56" fontSize="18" fontWeight="bold" textAnchor="middle">★</text>
                {/* Cheerful small smile */}
                <path d="M 44 56 Q 50 62 56 56" stroke="#FDE047" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </g>
            ) : internalPhase === 'FLYING_OUT' || internalPhase === 'FLYING_BACK' ? (
              // Energetic focused expression (> ‿ <)
              <g stroke="#38BDF8" strokeWidth="2.5" fill="none" strokeLinecap="round">
                <path d="M 32 46 L 40 51 L 32 56" />
                <path d="M 68 46 L 60 51 L 68 56" />
                <path d="M 44 55 Q 50 59 56 55" />
              </g>
            ) : avatarState === 'ERROR' ? (
              // Questioning/Curious eyes (o _ o)
              <g fill="#F43F5E">
                <circle cx="36" cy="50" r="4.5" />
                <circle cx="64" cy="50" r="4.5" />
                <line x1="45" y1="56" x2="55" y2="56" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" />
              </g>
            ) : (
              // Happy gentle curved eyes (^ ‿ ^)
              <g stroke="#38BDF8" strokeWidth="2.5" fill="none" strokeLinecap="round">
                <path d="M 30 52 Q 36 44 42 52" />
                <path d="M 58 52 Q 64 44 70 52" />
                {/* Cute smile */}
                <path d="M 46 54 Q 50 58 54 54" strokeWidth="2" />
              </g>
            )}

            {/* Rosy Cheek Dots */}
            <circle cx="28" cy="56" r="2.5" fill="#F472B6" opacity="0.8" />
            <circle cx="72" cy="56" r="2.5" fill="#F472B6" opacity="0.8" />

            {/* Bottom Thruster Glow */}
            <ellipse cx="50" cy="88" rx="8" ry="3" fill="#38BDF8" opacity="0.6" className="animate-pulse" />
          </svg>
        </div>

        {/* Small Name Pill */}
        <span className="mt-0.5 text-[11px] font-bold text-indigo-300 tracking-wider bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-500/30">
          ბუბუ
        </span>
      </motion.div>
    </motion.div>
  );
};
