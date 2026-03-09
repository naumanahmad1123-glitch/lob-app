import { motion } from 'framer-motion';
import { ResponseType } from '@/data/types';

interface ResponseButtonsProps {
  current?: ResponseType;
  onChange: (response: ResponseType) => void;
}

const options: { value: ResponseType; label: string; activeClass: string }[] = [
  { value: 'in', label: "I'm In", activeClass: 'bg-orange-500 text-white' },
  { value: 'maybe', label: 'Maybe', activeClass: 'bg-amber-600 text-white' },
  { value: 'out', label: 'Out', activeClass: 'bg-red-900 text-white' },
];

export function ResponseButtons({ current, onChange }: ResponseButtonsProps) {
  return (
    <div className="flex gap-2">
      {options.map(({ value, label, activeClass }) => {
        const isActive = current === value;
        return (
          <motion.button
            key={value}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(value)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              isActive ? activeClass : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {label}
          </motion.button>
        );
      })}
    </div>
  );
}
