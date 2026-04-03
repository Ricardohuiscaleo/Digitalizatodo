"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, TimerReset, Wind, Tv, Play, Pause, RotateCcw, Smartphone, Monitor } from 'lucide-react';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useBranding } from '@/context/BrandingContext';
import { getEcho } from '@/lib/echo';
import { getTimerState, updateTimerState } from '@/lib/api';

const gridTimes = [
  30, 60, 120, 180, 240, 
  300, 360, 420, 480, 540, 
  600, 720, 900, 1200, 1800
];

export default function TimerPage() {
  const { branding, setBranding } = useBranding();
  const { token } = useAdminDashboard(branding, setBranding);
  const [status, setStatus] = useState('idle'); // 'idle', 'running', 'paused', 'finished'
  const [timeLeft, setTimeLeft] = useState(300);
  const [initialSeconds, setInitialSeconds] = useState(300);
  const [isMobile, setIsMobile] = useState(false);
  const [isRemoteMode, setIsRemoteMode] = useState(false);
  const [serverStartedAt, setServerStartedAt] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Detección de dispositivo
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Por defecto, en móvil iniciamos en modo remoto
      if (window.innerWidth < 768) setIsRemoteMode(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cargar estado inicial
  const fetchState = useCallback(async () => {
    if (!branding?.slug || !token) return;
    try {
      const response = await getTimerState(branding.slug, token);
      if (response && response.state) {
          const { state } = response;
          setStatus(state.status);
          setInitialSeconds(state.initial_seconds);
          setServerStartedAt(state.started_at);
          
          if (state.status === 'running' && state.started_at) {
              const started = new Date(state.started_at).getTime();
              const now = new Date().getTime();
              const diff = Math.floor((now - started) / 1000);
              setTimeLeft(Math.max(0, state.remaining_seconds - diff));
          } else {
              setTimeLeft(state.remaining_seconds);
          }
      }
    } catch (error) {
      console.error("Error fetching timer state:", error);
    }
  }, [branding?.slug, token]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!branding?.slug) return;
    
    const echo = getEcho();
    if (!echo) return;

    const channel = echo.channel(`timer.${branding.slug}`);
    
    channel.listen('.timer.updated', (data: any) => {
      console.log("Timer updated via Echo:", data);
      setStatus(data.status);
      setInitialSeconds(data.initialSeconds);
      setServerStartedAt(data.startedAt);
      
      if (data.status === 'running' && data.startedAt) {
          const started = new Date(data.startedAt).getTime();
          const now = new Date().getTime();
          const diff = Math.floor((now - started) / 1000);
          setTimeLeft(Math.max(0, data.remainingSeconds - diff));
      } else {
          setTimeLeft(data.remainingSeconds);
      }
    });

    return () => {
      echo.leave(`timer.${branding.slug}`);
    };
  }, [branding?.slug]);

  // Lógica local del cronómetro (para fluidez visual)
  useEffect(() => {
    if (status === 'running' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    
    if (timeLeft === 0 && status === 'running') {
        setStatus('finished');
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, timeLeft]);

  // API para actualizar estado
  const syncState = async (updates: any) => {
      if (!branding?.slug || !token) return;
      try {
          await updateTimerState(branding.slug, token, {
              status: updates.status ?? status,
              initial_seconds: updates.initialSeconds ?? initialSeconds,
              remaining_seconds: updates.remainingSeconds ?? timeLeft,
              started_at: (updates.status === 'running' || (status === 'running' && !updates.status)) ? new Date().toISOString() : null
          });
      } catch (error) {
          console.error("Error syncing timer:", error);
      }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeSelect = (seconds: number) => {
    setInitialSeconds(seconds);
    setTimeLeft(seconds);
    setStatus('idle');
    syncState({ status: 'idle', initialSeconds: seconds, remainingSeconds: seconds });
  };

  const toggleTimer = () => {
    const newStatus = status === 'running' ? 'paused' : 'running';
    const currentRemaining = timeLeft;
    setStatus(newStatus);
    syncState({ status: newStatus, remainingSeconds: currentRemaining });
  };

  const resetTimer = () => {
    setTimeLeft(initialSeconds);
    setStatus('idle');
    syncState({ status: 'idle', remainingSeconds: initialSeconds });
  };

  // VISTA PROYECTOR (PC/TV)
  if (!isRemoteMode) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-10 overflow-hidden font-sans">
        {/* Header UI */}
        <div className="absolute top-10 left-10 right-10 flex justify-between items-center opacity-40">
           <img src="/4.png" alt="Logo" className="h-12 invert brightness-200" />
           <div className="text-right">
                <p className="text-xs font-black tracking-widest uppercase">Cronómetro Oficial</p>
                <p className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">{branding?.name} — SALA</p>
           </div>
        </div>

        {/* Timer Display */}
        <div className={`relative flex flex-col items-center transition-all duration-700 ${status === 'running' ? 'scale-110' : 'scale-100 opacity-80'}`}>
            <h1 className="text-[25vw] md:text-[20rem] font-black tracking-tighter leading-none select-none tabular-nums">
                {formatTime(timeLeft)}
            </h1>
            <div className="flex gap-4 mt-4">
               <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${status === 'running' ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-white/5 border-white/10 text-white/40'}`}>
                    {status === 'running' ? '• Combate en curso' : 'En pausa'}
               </div>
            </div>
        </div>

        {/* Floating Controls Overlay (Visible al mover mouse) */}
        <div className="fixed bottom-10 flex gap-4 opacity-0 hover:opacity-100 transition-opacity bg-white/5 backdrop-blur-xl p-3 rounded-3xl border border-white/10">
             <button onClick={() => setIsRemoteMode(true)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors">
                  <Smartphone size={20} />
             </button>
             <button onClick={toggleTimer} className="px-6 py-3 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest">
                  {status === 'running' ? 'Pausar' : 'Iniciar'}
             </button>
        </div>
      </div>
    );
  }

  // VISTA CONTROL REMOTO (MÓVIL)
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 pb-24 font-sans select-none overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">S A L A</h2>
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest tracking-tighter">Control Remoto</p>
        </div>
        <button onClick={() => setIsRemoteMode(false)} className="p-3 bg-white/5 border border-white/10 rounded-2xl">
          <Monitor size={20} className="text-zinc-400" />
        </button>
      </div>

      {/* Primary Display Remoto */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 text-center mb-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
        <h3 className="text-6xl font-black tracking-tighter tabular-nums mb-2">
            {formatTime(timeLeft)}
        </h3>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
            {status === 'running' ? 'Corriendo' : 'Pausado'}
        </p>
      </div>

      {/* Main Controls */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button 
          onClick={toggleTimer}
          className={`h-20 rounded-[2rem] flex items-center justify-center gap-3 transition-all active:scale-95 ${status === 'running' ? 'bg-zinc-800 text-white' : 'bg-white text-black'}`}
        >
          {status === 'running' ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
          <span className="font-black uppercase text-xs tracking-widest">{status === 'running' ? 'Pausar' : 'Iniciar'}</span>
        </button>
        <button 
          onClick={resetTimer}
          className="h-20 bg-zinc-900 border border-zinc-800 rounded-[2rem] flex items-center justify-center gap-3 transition-all active:scale-95"
        >
          <RotateCcw size={20} />
          <span className="font-black uppercase text-xs tracking-widest">Reiniciar</span>
        </button>
      </div>

      {/* Quick Select Times */}
      <div className="mb-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 px-2">Ajuste de Tiempo</h4>
        <div className="grid grid-cols-3 gap-3">
            {gridTimes.map(time => (
                <button 
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  className={`h-16 rounded-2xl font-bold text-sm border transition-all active:scale-95 ${initialSeconds === time ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-white/60'}`}
                >
                  {time < 60 ? `${time}s` : `${time / 60}m`}
                </button>
            ))}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-8 pt-8 border-t border-white/5 text-center opacity-20">
          <p className="text-[8px] font-black uppercase tracking-widest">Powered by Digitalizatodo</p>
      </div>
    </div>
  );
}
