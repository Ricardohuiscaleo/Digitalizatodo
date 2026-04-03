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
    return () => { echo.leave(`timer.${branding.slug}`); };
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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
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
    setStatus(newStatus);
    syncState({ status: newStatus, remainingSeconds: timeLeft });
  };

  const resetTimer = () => {
    setTimeLeft(initialSeconds);
    setStatus('idle');
    syncState({ status: 'idle', remainingSeconds: initialSeconds });
  };

  // Lógica de colores Dinámicos
  const getDisplayColors = () => {
     if (timeLeft === 0 && status === 'finished') return 'bg-red-600 text-white animate-pulse';
     if (timeLeft <= 30 && status === 'running') return 'bg-yellow-500 text-white'; // Profesor: Aviso Últimos 30s
     return 'bg-zinc-950 text-white';
  };

  // VISTA PROYECTOR (PC/TV)
  if (!isRemoteMode) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-10 overflow-hidden font-sans transition-colors duration-1000 ${getDisplayColors()}`}>
        {/* Header UI */}
        <div className="absolute top-10 left-10 right-10 flex justify-between items-center opacity-60">
           <img src="/integracao/4.png" alt="Logo Digitalizatodo" className="h-10 invert brightness-200" />
           <div className="text-right">
                <p className="text-xs font-black tracking-widest uppercase">Cronómetro Oficial</p>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-tighter">{branding?.name} — SALA</p>
           </div>
        </div>

        {/* Timer Display */}
        <div className={`relative flex flex-col items-center transition-all duration-700 ${status === 'running' ? 'scale-110' : 'scale-100 opacity-80'}`}>
            <h1 className="text-[25vw] md:text-[22rem] font-black tracking-tighter leading-none select-none tabular-nums drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                {formatTime(timeLeft)}
            </h1>
            <div className="flex gap-4 mt-8">
               <div className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border-2 ${status === 'running' ? 'bg-white/10 border-white text-white' : 'bg-white/5 border-white/20 text-white/40'}`}>
                    {status === 'running' ? '• Combate en curso' : status === 'finished' ? 'TIEMPO AGOTADO' : 'En pausa'}
               </div>
            </div>
        </div>

        {/* Floating Controls Overlay */}
        <div className="fixed bottom-10 flex gap-4 opacity-0 hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xl p-3 rounded-3xl border border-white/10">
             <button onClick={() => setIsRemoteMode(true)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors">
                  <Smartphone size={20} />
             </button>
             <button onClick={toggleTimer} className="px-8 py-3 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-transform">
                  {status === 'running' ? 'Pausar' : 'Iniciar'}
             </button>
             <button onClick={resetTimer} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors">
                  <RotateCcw size={20} />
             </button>
        </div>
      </div>
    );
  }

  // VISTA CONTROL REMOTO (MÓVIL)
  return (
    <div className={`min-h-screen p-6 pb-24 font-sans select-none overflow-y-auto transition-colors duration-500 ${getDisplayColors()}`}>
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <img src="/integracao/4.png" alt="Logo" className="h-6 invert brightness-200" />
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight leading-none">S A L A</h2>
            <p className="text-[8px] font-bold opacity-60 uppercase tracking-widest">Digitalizatodo Remote</p>
          </div>
        </div>
        <button onClick={() => setIsRemoteMode(false)} className="p-3 bg-white/10 border border-white/20 rounded-2xl active:scale-90 transition-transform">
          <Monitor size={20} className="text-white" />
        </button>
      </div>

      {/* Primary Display Remoto */}
      <div className={`border border-white/10 rounded-[2.5rem] p-10 text-center mb-8 relative overflow-hidden transition-colors ${status === 'running' ? 'bg-white/5' : 'bg-black/20'}`}>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl opacity-50" />
        <h3 className="text-7xl font-black tracking-tighter tabular-nums mb-2 drop-shadow-2xl">
            {formatTime(timeLeft)}
        </h3>
        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${status === 'running' ? 'text-white' : 'text-white/30'}`}>
            {status === 'running' ? '• Cronómetro Activo' : status === 'finished' ? 'Fin del tiempo' : 'Pausado'}
        </p>
      </div>

      {/* Main Controls - MÁS VISIBLES Y GRANDES */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <button 
          onClick={toggleTimer}
          className={`h-28 rounded-[2rem] flex flex-col items-center justify-center gap-2 shadow-2xl transition-all active:scale-90 ${status === 'running' ? 'bg-zinc-800 text-white' : 'bg-white text-black'}`}
        >
          {status === 'running' ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
          <span className="font-black uppercase text-[10px] tracking-widest">{status === 'running' ? 'Pausar' : 'Iniciar'}</span>
        </button>
        <button 
          onClick={resetTimer}
          className="h-28 bg-white/10 border border-white/20 rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-all active:scale-90 backdrop-blur-md"
        >
          <RotateCcw size={32} />
          <span className="font-black uppercase text-[10px] tracking-widest">Reiniciar</span>
        </button>
      </div>

      {/* Quick Select Times */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6 px-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Configurar Tiempo</h4>
            <div className="h-[1px] flex-1 bg-white/10 ml-4" />
        </div>
        <div className="grid grid-cols-3 gap-3">
            {gridTimes.map(time => (
                <button 
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  className={`h-16 rounded-2xl font-black text-sm border-2 transition-all active:scale-90 ${initialSeconds === time ? 'bg-white text-black border-white shadow-xl' : 'bg-white/5 border-white/10 text-white/50'}`}
                >
                  {time < 60 ? `${time}s` : `${time / 60}m`}
                </button>
            ))}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-12 py-8 border-t border-white/5 text-center flex flex-col items-center gap-4">
          <img src="/integracao/4.png" alt="Digitalizatodo" className="h-4 opacity-30 invert" />
          <p className="text-[8px] font-black uppercase tracking-[0.5em] opacity-40">Industrial Grade System</p>
      </div>
    </div>
  );
}
