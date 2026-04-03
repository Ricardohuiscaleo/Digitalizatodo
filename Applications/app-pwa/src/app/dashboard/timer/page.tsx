"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, TimerReset, Wind, Tv, Play, Pause, RotateCcw, Smartphone, Monitor, Clock, Maximize, Minimize, Volume2, VolumeX, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useBranding } from '@/context/BrandingContext';
import { getEcho } from '@/lib/echo';
import { getTimerState, updateTimerState } from '@/lib/api';

const gridTimes = [
  30, 60, 120, 180, 240, 
  300, 360, 420, 480, 540, 
  600, 720, 900, 1200, 1800
];

type ViewState = 'clock' | 'menu' | 'timer';

export default function TimerPage() {
  const { branding, setBranding } = useBranding();
  const { token } = useAdminDashboard(branding, setBranding);
  const [status, setStatus] = useState('idle'); // 'idle', 'running', 'paused', 'finished'
  const [view, setView] = useState<ViewState>('clock'); // 'clock', 'menu', 'timer'
  const [timeLeft, setTimeLeft] = useState(300);
  const [initialSeconds, setInitialSeconds] = useState(300);
  const [isMobile, setIsMobile] = useState(false);
  const [isRemoteMode, setIsRemoteMode] = useState(false);
  const [serverStartedAt, setServerStartedAt] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(5); // 5:00 por defecto en el menú
  const [isMounted, setIsMounted] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Inicialización y Montaje
  useEffect(() => {
    setIsMounted(true);
    audioRef.current = new Audio('/notification.wav');
  }, []);

  // Reloj tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Mantener pantalla encendida (Wake Lock)
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && status === 'running') {
        try {
          if (!wakeLockRef.current) {
            wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          }
        } catch (err: any) {
          if (err.name !== 'NotAllowedError') {
            console.warn(`WakeLock: ${err.name}, ${err.message}`);
          }
        }
      }
    };

    if (status === 'running') {
      requestWakeLock();
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    }
    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, [status]);

  // Pantalla Completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

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

  // API para actualizar estado integral
  const syncState = async (updates: any) => {
      if (!branding?.slug || !token) return;
      try {
          await updateTimerState(branding.slug, token, {
              status: updates.status ?? status,
              initial_seconds: updates.initialSeconds ?? initialSeconds,
              remaining_seconds: updates.remainingSeconds ?? timeLeft,
              started_at: (updates.status === 'running' || (status === 'running' && !updates.status)) ? (updates.startedAt || new Date().toISOString()) : null,
              view: updates.view ?? view
          });
      } catch (error) {
          console.error("Error syncing timer:", error);
      }
  };

  // Manejo de teclado (Control Remoto TV)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isEnter = e.key === 'Enter' || e.key === 'OK' || e.key === 'Select';

    if (view === 'menu') {
      if (e.key === 'ArrowRight') setFocusedIndex((prev) => (prev + 1) % gridTimes.length);
      if (e.key === 'ArrowLeft') setFocusedIndex((prev) => (prev - 1 + gridTimes.length) % gridTimes.length);
      if (e.key === 'ArrowDown') setFocusedIndex((prev) => (prev + 5) % gridTimes.length);
      if (e.key === 'ArrowUp') setFocusedIndex((prev) => (prev - 5 + gridTimes.length) % gridTimes.length);
      if (isEnter) {
        handleTimeSelect(gridTimes[focusedIndex]);
      }
      if (e.key === 'Escape') setView('clock');
    } else if (view === 'clock') {
        if (isEnter || e.key === ' ' || e.key === 'ArrowUp') setView('menu');
    } else if (view === 'timer') {
        if (e.key === 'Escape') {
            setStatus('paused');
            setView('menu');
            syncState({ view: 'menu', status: 'paused' });
        }
        if (isEnter || e.key === ' ') {
            toggleTimer();
        }
    }
  }, [view, focusedIndex, status, isRemoteMode, isMobile, initialSeconds, timeLeft]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Cargar estado inicial
  const fetchState = useCallback(async () => {
    if (!branding?.slug || !token) return;
    try {
      const response = await getTimerState(branding.slug, token);
      if (response && response.state) {
          const { state } = response;
          setStatus(state.status);
          setView(state.view as ViewState || 'clock');
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
      setView(data.view as ViewState);
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
        if (!isMuted && audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio block:", e));
        }
        if (navigator.vibrate) {
            navigator.vibrate([300, 100, 300]);
        }
        setTimeout(() => {
            setView('clock');
            syncState({ view: 'clock' });
        }, 10000);
    }
    
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, timeLeft, isMuted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRealTime = (date: Date) => {
      return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const handleTimeSelect = (seconds: number) => {
    setInitialSeconds(seconds);
    setTimeLeft(seconds);
    setStatus('running');
    setView('timer');
    syncState({ view: 'timer', status: 'running', initialSeconds: seconds, remainingSeconds: seconds, startedAt: new Date().toISOString() });
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

  const changeView = (newView: ViewState) => {
      setView(newView);
      syncState({ view: newView });
  };

  const handleFirstInteraction = async () => {
    if (status === 'running' && 'wakeLock' in navigator && !wakeLockRef.current) {
        try {
            wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (e) {}
    }
    if (audioRef.current) {
        audioRef.current.load();
    }
  };

  const getDisplayColors = () => {
     if (timeLeft === 0 && status === 'finished' && view === 'timer') return 'bg-red-600 animate-pulse';
     if (timeLeft <= 30 && status === 'running' && view === 'timer') return 'bg-yellow-500';
     return 'bg-zinc-950';
  };

  // VISTA PROYECTOR (PC/TV)
  if (!isRemoteMode) {
    return (
      <div 
        onClick={handleFirstInteraction}
        className={`min-h-screen flex flex-col items-center justify-between overflow-hidden font-sans transition-all duration-1000 relative ${getDisplayColors()}`}
      >
        
        {/* HEADER: FRANJA DE MANDO INDUSTRIAL (Versión Final Sólida) */}
        <header className="w-full grid grid-cols-3 items-center z-10 border-b border-white/5 py-4 px-10 bg-zinc-900/90 backdrop-blur-md shadow-[0_10px_50px_rgba(0,0,0,0.5)] overflow-hidden">
             {/* COL 1: LOGOS IZQUIERDA */}
             <div className="flex items-center gap-6">
                <img src="/integracao/2.png" alt="Collab" className="h-16 md:h-24 w-auto object-contain" />
                {branding?.logo && (
                    <div className="h-14 w-[1px] bg-white/10 mx-2" />
                )}
                {branding?.logo && (
                    <img src={branding.logo} alt="Tenant" className="h-16 md:h-24 w-auto object-contain rounded-full" />
                )}
             </div>
             
             {/* COL 2: ACADEMIA CENTRO */}
             <div className="flex flex-col items-center drop-shadow-2xl">
                 <h1 className="text-[clamp(1.5rem,4vw,3.5rem)] font-black tracking-tighter leading-none text-white uppercase whitespace-nowrap text-center">
                     {branding?.name || 'SALA'}
                 </h1>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 mt-2 opacity-90">
                    JIU JITSU BRASILEÑO TIMER PROFESIONAL
                 </p>
             </div>

             {/* COL 3: LOGO BRANDING DERECHA (80x50px via style inline) */}
             <div className="flex justify-end pr-8">
                <img 
                    src="/integracao/4.png" 
                    alt="Branding" 
                    style={{ width: '160px', height: '100px', objectFit: 'contain' }}
                    className="drop-shadow-2xl brightness-110 flex-shrink-0" 
                />
             </div>
        </header>

        {/* MAIN: CRONÓMETRO */}
        <main className="flex-1 w-full flex flex-col items-center justify-center relative transition-all duration-700 px-24 py-12">
            {view === 'clock' && (
                <div className="flex flex-col items-center">
                    <div 
                        className="text-[22vw] font-black tracking-tighter leading-none cursor-pointer text-white drop-shadow-[0_20px_100px_rgba(255,255,255,0.1)] transition-all tabular-nums"
                        onClick={() => changeView('menu')}
                    >
                        {isMounted ? formatRealTime(currentTime) : '00:00:00'}
                    </div>
                </div>
            )}

            {view === 'menu' && (
                <div className="grid grid-cols-5 gap-4 w-full max-w-7xl animate-in zoom-in-95 duration-500 relative z-20">
                    {gridTimes.map((time, index) => {
                        const isFocused = index === focusedIndex;
                        return (
                            <button 
                                key={index}
                                onClick={() => handleTimeSelect(time)}
                                className={`
                                    border-4 flex items-center justify-center py-12 cursor-pointer
                                    transition-all duration-300 ease-out rounded-3xl active:scale-95
                                    ${isFocused 
                                        ? 'border-white bg-white text-black scale-105 z-10 shadow-[0_0_50px_rgba(255,255,255,0.3)]' 
                                        : 'border-white/10 bg-transparent text-white/40 hover:border-white/40 hover:text-white'}
                                `}
                            >
                                <span className="text-6xl font-black tracking-tighter">
                                    {time < 60 ? `${time}s` : `${time / 60}:00`}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {view === 'timer' && (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                    <h2 className="text-[28vw] font-black tracking-tighter leading-none select-none tabular-nums text-white drop-shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
                        {formatTime(timeLeft)}
                    </h2>
                    <div className="flex flex-col items-center -mt-10">
                        <div className={`px-12 py-4 rounded-3xl text-xl font-black uppercase tracking-widest border-2 transition-all ${status === 'running' ? 'bg-white/10 border-white text-white' : status === 'finished' ? 'bg-black border-red-500 text-red-500 animate-pulse shadow-2xl scale-110' : 'bg-black/40 border-white/20 text-white/40'}`}>
                            {status === 'running' ? '• COMBATE EN CURSO' : status === 'finished' ? '¡TIEMPO AGOTADO!' : 'SISTEMA EN PAUSA'}
                        </div>
                    </div>
                </div>
            )}
        </main>

        {/* FOOTER: CONTROLES */}
        <footer className="w-full flex justify-between items-end z-10 px-12 pb-10 pt-6 relative border-t border-white/5">
             <div className="flex gap-4">
                 <button onClick={() => setIsMuted(!isMuted)} className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all active:scale-90">
                     {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                 </button>
                 <button onClick={toggleFullscreen} className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all active:scale-90">
                     {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                 </button>
                 <button onClick={() => setView('menu')} className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all active:scale-90">
                     <Settings size={24} />
                 </button>
             </div>

             <div className="flex flex-col items-center gap-3">
                 <div className="flex gap-4 p-2 bg-white/5 rounded-2xl border border-white/5">
                    <button onClick={() => setTimeLeft(prev => Math.max(0, prev - 10))} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/20 text-white transition-all active:scale-90">
                        <span className="text-xs font-bold">-10s</span>
                    </button>
                    <button onClick={toggleTimer} className={`p-4 px-10 rounded-xl transition-all active:scale-95 flex items-center gap-3 text-sm font-black uppercase tracking-widest ${status === 'running' ? 'bg-white text-black' : 'bg-white/10 text-white border border-white/20'}`}>
                        {status === 'running' ? <><Pause size={18} fill="currentColor" /> PAUSAR</> : <><Play size={18} fill="currentColor" /> INICIAR</>}
                    </button>
                    <button onClick={() => setTimeLeft(prev => prev + 10)} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/20 text-white transition-all active:scale-90">
                        <span className="text-xs font-bold">+10s</span>
                    </button>
                    <button onClick={resetTimer} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/20 text-white transition-all active:scale-90 group">
                        <RotateCcw size={20} className="group-hover:rotate-180 transition-all duration-500" />
                    </button>
                 </div>
             </div>

             <div className="flex flex-col items-end">
                 <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-3">Hora Local del Dojo</p>
                 <div className="text-6xl font-black text-white/40 drop-shadow-xl tabular-nums tracking-tighter">
                    {isMounted ? formatRealTime(currentTime) : '00:00:00'}
                 </div>
             </div>
        </footer>
      </div>
    );
  }

  // VISTA CONTROL REMOTO (MÓVIL)
  return (
    <div 
        onClick={handleFirstInteraction}
        className={`min-h-screen p-6 pb-24 font-sans select-none overflow-y-auto transition-colors duration-500 ${getDisplayColors()}`}
    >
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <img src="/integracao/4.png" alt="Logo" className="h-8 object-contain" />
          <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-white/10 rounded-xl">
              {isMuted ? <VolumeX size={16} className="text-white" /> : <Volume2 size={16} className="text-white" />}
          </button>
        </div>
        <div className="flex gap-2">
             <button onClick={() => changeView('clock')} className={`p-3 rounded-2xl active:scale-90 transition-all ${view === 'clock' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
                <Clock size={20} />
             </button>
             <button onClick={() => setIsRemoteMode(false)} className="p-3 bg-white/10 border border-white/20 rounded-2xl active:scale-90 transition-transform text-white">
                <Monitor size={20} />
             </button>
        </div>
      </div>

      <div className="text-center mb-8 opacity-40">
          <p className="text-sm font-black tracking-[0.4em] text-white">
            {isMounted ? formatRealTime(currentTime) : '--:--:--'}
          </p>
      </div>

      <div className={`border border-white/10 rounded-[2.5rem] p-10 text-center mb-8 relative overflow-hidden transition-all shadow-2xl ${status === 'running' ? 'bg-white/10' : 'bg-black/80'}`}>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl opacity-50" />
        <h3 className="text-7xl font-black tracking-tighter tabular-nums mb-2 text-white drop-shadow-lg">
            {formatTime(timeLeft)}
        </h3>
        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${status === 'running' ? 'text-white' : 'text-white/30'}`}>
            {status === 'running' ? '• Combate Activo' : status === 'finished' ? 'Fin del tiempo' : 'Sistema en Pausa'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <button 
          onClick={toggleTimer}
          className={`h-32 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 ${status === 'running' ? 'bg-zinc-800 text-white border border-white/10' : 'bg-white text-black'}`}
        >
          {status === 'running' ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" />}
          <span className="font-black uppercase text-[10px] tracking-widest">{status === 'running' ? 'PAUSAR' : 'ARRANCAR'}</span>
        </button>
        <button 
          onClick={resetTimer}
          className="h-32 bg-white/10 border border-white/20 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 transition-all active:scale-95 backdrop-blur-md text-white"
        >
          <RotateCcw size={36} />
          <span className="font-black uppercase text-[10px] tracking-widest">Reiniciar</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-6 px-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Menú de Tiempos</h4>
            <div className="h-[1px] flex-1 bg-white/10 ml-4" />
        </div>
        <div className="grid grid-cols-3 gap-3">
            {gridTimes.map(time => (
                <button 
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  className={`h-16 rounded-[1.25rem] font-black text-sm border-2 transition-all active:scale-90 ${initialSeconds === time ? 'bg-white text-black border-white shadow-2xl' : 'bg-white/10 border-white/5 text-white/60'}`}
                >
                  {time < 60 ? `${time}s` : `${time / 60}m`}
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-10">
          <button onClick={() => { setTimeLeft(prev => Math.max(0, prev - 10)); syncState({ remainingSeconds: timeLeft - 10 }); }} className="h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest">-10 Segundos</button>
          <button onClick={() => { setTimeLeft(prev => prev + 10); syncState({ remainingSeconds: timeLeft + 10 }); }} className="h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest">+10 Segundos</button>
      </div>

      <div className="mt-12 py-8 border-t border-white/10 text-center flex flex-col items-center gap-4">
          <img src="/integracao/4.png" alt="Digitalizatodo" className="h-8 object-contain opacity-50" />
          <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white opacity-20">Powered by Digitalizatodo</p>
      </div>
    </div>
  );
}
