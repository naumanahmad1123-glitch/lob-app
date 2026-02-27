import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LobSentAnimationProps {
  show: boolean;
}

const CONFETTI = ['🎉', '✨', '🔥', '⭐', '💥', '🌟', '🎊', '🏐'];

function randomBetween(a: number, b: number) {
  return Math.random() * (b - a) + a;
}

export function LobSentAnimation({ show }: LobSentAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; emoji: string; x: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      setParticles(
        Array.from({ length: 12 }, (_, i) => ({
          id: i,
          emoji: CONFETTI[i % CONFETTI.length],
          x: randomBetween(-120, 120),
          delay: randomBetween(0, 0.15),
        }))
      );
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
        >
          {/* Ball arc */}
          <motion.div
            initial={{ y: 100, scale: 1, opacity: 1 }}
            animate={{ y: -400, scale: 0.3, opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
            className="text-5xl absolute"
          >
            🏐
          </motion.div>

          {/* Confetti burst */}
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ y: 0, x: 0, scale: 0, opacity: 1 }}
              animate={{
                y: randomBetween(-200, -50),
                x: p.x,
                scale: [0, 1.2, 0.8],
                opacity: [1, 1, 0],
                rotate: randomBetween(-180, 180),
              }}
              transition={{ duration: 0.8, delay: 0.3 + p.delay, ease: 'easeOut' }}
              className="absolute text-xl"
            >
              {p.emoji}
            </motion.div>
          ))}

          {/* Flash ring */}
          <motion.div
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="absolute w-24 h-24 rounded-full border-2 border-primary"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
