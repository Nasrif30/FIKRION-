import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getDynamicGreeting } from '@/utils/greeting';
import { useSystemStore } from '@/stores/systemStore';

// FIKRION SVG Logo — geometric brain-circuit hybrid
function FikrionLogo({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Outer ring */}
      <circle cx="40" cy="40" r="36" stroke="url(#grad)" strokeWidth="1.5" strokeDasharray="4 3" className="splash-logo-path" />
      {/* Circuit nodes */}
      <circle cx="40" cy="8" r="3" fill="#0A84FF" />
      <circle cx="72" cy="40" r="3" fill="#0A84FF" />
      <circle cx="40" cy="72" r="3" fill="#0A84FF" />
      <circle cx="8" cy="40" r="3" fill="#0A84FF" />
      {/* Brain hex shape */}
      <path d="M40 20 L54 28 L54 44 L40 52 L26 44 L26 28 Z"
        stroke="url(#grad)" strokeWidth="1.5" fill="rgba(10,132,255,0.08)" className="splash-logo-path" />
      {/* Circuit lines */}
      <line x1="40" y1="8" x2="40" y2="20" stroke="#0A84FF" strokeWidth="1" opacity="0.6" />
      <line x1="72" y1="40" x2="54" y2="40" stroke="#0A84FF" strokeWidth="1" opacity="0.6" />
      <line x1="40" y1="72" x2="40" y2="52" stroke="#0A84FF" strokeWidth="1" opacity="0.6" />
      <line x1="8" y1="40" x2="26" y2="40" stroke="#0A84FF" strokeWidth="1" opacity="0.6" />
      {/* Center dot */}
      <circle cx="40" cy="36" r="5" fill="#0A84FF" />
      <circle cx="40" cy="36" r="8" stroke="#0A84FF" strokeWidth="0.5" opacity="0.3" />
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0A84FF" />
          <stop offset="1" stopColor="#5E5CE6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'logo' | 'tagline' | 'loading' | 'ready'>('logo');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing FIKRION...');
  const { weatherData } = useSystemStore();

  useEffect(() => {
    const steps = [
      { text: 'Loading detection engine...', target: 25 },
      { text: 'Checking AI providers...', target: 55 },
      { text: 'Initializing database...', target: 80 },
      { text: 'Ready', target: 100 },
    ];

    let step = 0;
    const t1 = setTimeout(() => setPhase('tagline'), 900);
    const t2 = setTimeout(() => setPhase('loading'), 1800);

    const interval = setInterval(() => {
      if (step < steps.length) {
        setStatusText(steps[step].text);
        setProgress(steps[step].target);
        if (step === 3) {
          setTimeout(() => setPhase('ready'), 400); // short delay so the bar visually hits 100% before transitioning
          clearInterval(interval);
          setTimeout(onComplete, 4000); // 4 seconds for the user to read the massive text
        }
        step++;
      }
    }, 600);

    return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(interval); };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ background: '#09090B' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence>
        <motion.div
          className="flex flex-col items-center gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Logo */}
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <FikrionLogo size={88} />
          </motion.div>

          {/* Wordmark */}
          <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <h1 className="text-3xl font-semibold tracking-[0.12em] text-white" style={{ letterSpacing: '0.15em' }}>
              FIKR<span style={{ color: '#0A84FF' }}>I</span>ON
            </h1>
          </motion.div>

          {/* Tagline */}
          <AnimatePresence>
            {(phase === 'tagline' || phase === 'loading') && (
              <motion.p
                className="text-sm text-tertiary tracking-widest uppercase"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Think Before the Threat.
              </motion.p>
            )}
          </AnimatePresence>

          {/* Loading bar */}
          <AnimatePresence>
            {phase === 'loading' && (
              <motion.div
                className="w-64 flex flex-col items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <div className="w-full h-[1px] bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #0A84FF, #5E5CE6)' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs text-tertiary font-mono">{statusText}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ready State */}
          <AnimatePresence>
            {phase === 'ready' && (
              <motion.div
                className="flex flex-col items-center gap-6 text-center mt-2 max-w-2xl px-6"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <h2 className="text-5xl font-black text-white tracking-widest uppercase">I AM READY.</h2>
                <p className="text-lg text-brand font-medium tracking-wide leading-relaxed">
                  {weatherData ? (
                    `Good ${getDynamicGreeting(false).split(' ')[1]}, sir. It's ${weatherData.temp}°C with ${weatherData.condition} in ${weatherData.location}.`
                  ) : (
                    getDynamicGreeting(false).replace(' How may I assist you?', '')
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
