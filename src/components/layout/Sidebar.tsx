import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard, Shield, Bot, MessageSquare, Activity,
  Globe, Lock, Settings, ChevronLeft, ChevronRight,
  Brain, BarChart3, Cpu
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/threats', icon: Shield, label: 'Threat Center' },
  { to: '/monitor', icon: Activity, label: 'Real-Time Monitor' },
  { to: '/soc', icon: Brain, label: 'AI SOC' },
  { to: '/assistant', icon: MessageSquare, label: 'AI Assistant' },
  { to: '/usage', icon: BarChart3, label: 'AI Usage' },
  { to: '/browser', icon: Globe, label: 'Browser Shield' },
  { to: '/privacy', icon: Lock, label: 'Privacy' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: collapsed ? 60 : 220 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col h-full shrink-0 relative z-10"
      style={{
        background: 'rgba(10,10,12,0.9)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Logo / Wordmark */}
      <div className="flex items-center h-14 px-4 gap-3 shrink-0">
        <div className="shrink-0">
          <LogoMark />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              className="font-semibold text-sm tracking-[0.12em] text-white"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              FIKR<span style={{ color: '#0A84FF' }}>I</span>ON
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="divider mx-2" />

      {/* Navigation */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 overflow-hidden px-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to}>
              <motion.div
                className={`flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors duration-150 ${
                  isActive
                    ? 'bg-brand-dim text-brand'
                    : 'text-secondary hover:text-white hover:bg-white/5'
                }`}
                whileHover={{ x: collapsed ? 0 : 2 }}
                transition={{ duration: 0.1 }}
              >
                <Icon size={16} className="shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      className="text-xs font-medium whitespace-nowrap"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto px-4 pb-2">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-2"
            >
              <p className="text-[9px] font-semibold tracking-wider text-secondary uppercase">A. HALIDDIN</p>
              <p className="text-[8px] text-tertiary italic mt-0.5">Just a nerd in his habitat</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="btn-ghost mx-2 mb-3 py-1.5 justify-center no-drag"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </motion.aside>
  );
}

function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 80 80" fill="none">
      <path d="M40 20 L54 28 L54 44 L40 52 L26 44 L26 28 Z"
        stroke="#0A84FF" strokeWidth="2" fill="rgba(10,132,255,0.1)" />
      <circle cx="40" cy="36" r="5" fill="#0A84FF" />
      <circle cx="40" cy="8" r="3" fill="#0A84FF" opacity="0.6" />
      <line x1="40" y1="8" x2="40" y2="20" stroke="#0A84FF" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}
