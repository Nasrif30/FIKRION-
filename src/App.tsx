import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import SplashScreen from '@/components/layout/SplashScreen';
import TitleBar from '@/components/layout/TitleBar';
import Sidebar from '@/components/layout/Sidebar';
import StatusBar from '@/components/layout/StatusBar';

import Dashboard from '@/routes/Dashboard';
import ThreatCenter from '@/routes/ThreatCenter';
import RealTimeMonitor from '@/routes/RealTimeMonitor';
import AISoc from '@/routes/AISoc';
import AIAssistant from '@/routes/AIAssistant';
import AIUsagePanel from '@/routes/AIUsagePanel';
import BrowserProtection from '@/routes/BrowserProtection';
import PrivacyDashboard from '@/routes/PrivacyDashboard';
import Settings from '@/routes/Settings';
import SetupWizard from '@/routes/SetupWizard';

import { useSettingsStore } from '@/stores/settingsStore';
import { useAIStore } from '@/stores/aiStore';
import { useSystemStore } from '@/stores/systemStore';
import { useThreatStore } from '@/stores/threatStore';
import { checkOllama } from '@/services/aiService';
import { getSystemMetrics, getProcessList, getSystemEvents } from '@/services/monitorService';
import { getDetections, getThreatScore } from '@/services/detectionService';

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="flex-1 overflow-hidden"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const { firstRunComplete } = useSettingsStore();
  const { setOllamaStatus } = useAIStore();
  const { setMetrics, setProcesses, setEvents } = useSystemStore();
  const { setDetections, setThreatScore } = useThreatStore();

  // Check Ollama on startup
  useEffect(() => {
    if (!splashDone) return;
    checkOllama().then(({ available, models }) => {
      setOllamaStatus(available, models);
      // We no longer forcefully override the user's activeProvider here
    });
  }, [splashDone]);

  // Poll real system metrics every 2 seconds
  useEffect(() => {
    if (!splashDone) return;
    const fetchMetrics = async () => {
      try {
        const [metrics, processes, events] = await Promise.all([
          getSystemMetrics(),
          getProcessList(),
          getSystemEvents(15),
        ]);
        setMetrics(metrics);
        setProcesses(processes);
        setEvents(events);
      } catch (e) { /* Backend not ready yet */ }
    };
    fetchMetrics();
    const id = setInterval(fetchMetrics, 5000);
    return () => clearInterval(id);
  }, [splashDone]);

  // Load detections once
  useEffect(() => {
    if (!splashDone) return;
    Promise.all([getDetections(), getThreatScore()])
      .then(([dets, score]) => { setDetections(dets); setThreatScore(score); })
      .catch(() => {});
  }, [splashDone]);

  // Fetch Weather once on startup
  const { openWeatherMapApiKey, manualLocation } = useSettingsStore();
  const { setWeatherData } = useSystemStore();
  useEffect(() => {
    if (!openWeatherMapApiKey) return;

    const fetchForecast = (lat: number, lon: number, city: string) => {
      fetch(`https://api.pirateweather.net/forecast/${openWeatherMapApiKey}/${lat},${lon}?units=si`)
        .then((r) => r.json())
        .then((w) => {
          setWeatherData({
            temp: Math.round(w.currently.temperature),
            condition: w.currently.summary,
            location: city,
          });
        })
        .catch(() => {});
    };

    if (manualLocation && manualLocation.trim().length > 0) {
      // Use Nominatim to geocode the manual location
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualLocation)}&format=json&limit=1`)
        .then(r => r.json())
        .then(data => {
          if (data && data.length > 0) {
            fetchForecast(parseFloat(data[0].lat), parseFloat(data[0].lon), manualLocation);
          }
        })
        .catch(() => {});
    } else {
      // Fallback to IP geolocation
      fetch('http://ip-api.com/json/')
        .then((r) => r.json())
        .then((loc) => {
          if (!loc.lat || !loc.lon) return;
          fetchForecast(loc.lat, loc.lon, loc.city || 'Unknown Location');
        })
        .catch(() => {});
    }
  }, [openWeatherMapApiKey, manualLocation]);

  return (
    <BrowserRouter>
      <div className="flex flex-col w-screen h-screen overflow-hidden" style={{ background: '#09090B' }}>
        <AnimatePresence>
          {!splashDone && (
            <SplashScreen onComplete={() => setSplashDone(true)} />
          )}
        </AnimatePresence>

        {splashDone && (
          <>
            <TitleBar />
            <div className="flex flex-1 overflow-hidden">
              {firstRunComplete && <Sidebar />}
              <main className="flex-1 overflow-hidden flex flex-col">
                <AnimatePresence mode="wait">
                  <Routes>
                    {!firstRunComplete ? (
                      <>
                        <Route path="/setup" element={<PageTransition><SetupWizard /></PageTransition>} />
                        <Route path="*" element={<Navigate to="/setup" replace />} />
                      </>
                    ) : (
                      <>
                        <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
                        <Route path="/threats" element={<PageTransition><ThreatCenter /></PageTransition>} />
                        <Route path="/monitor" element={<PageTransition><RealTimeMonitor /></PageTransition>} />
                        <Route path="/soc" element={<PageTransition><AISoc /></PageTransition>} />
                        <Route path="/assistant" element={<PageTransition><AIAssistant /></PageTransition>} />
                        <Route path="/usage" element={<PageTransition><AIUsagePanel /></PageTransition>} />
                        <Route path="/browser" element={<PageTransition><BrowserProtection /></PageTransition>} />
                        <Route path="/privacy" element={<PageTransition><PrivacyDashboard /></PageTransition>} />
                        <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </>
                    )}
                  </Routes>
                </AnimatePresence>
              </main>
            </div>
            <StatusBar />
          </>
        )}
      </div>
    </BrowserRouter>
  );
}
