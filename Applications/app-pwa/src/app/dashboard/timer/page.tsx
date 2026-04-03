"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, TimerReset, Wind, Tv, Play, Pause, RotateCcw, Smartphone, Monitor, Clock, Maximize, Minimize, Volume2, VolumeX, ChevronRight, ChevronLeft, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { token } = useAdminDashboard(branding, setBranding);
  const [status, setStatus] = useState('idle'); // 'idle', 'running', 'paused', 'finished'
  const [view, setView] = useState<ViewState>('clock'); // 'clock', 'menu', 'timer'
  const [timeLeft, setTimeLeft] = useState(0);
  const [initialSeconds, setInitialSeconds] = useState(0);
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isRemoteMode, setIsRemoteMode] = useState(false);
  const [serverStartedAt, setServerStartedAt] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [focusedControl, setFocusedControl] = useState(-1);
  const [isMounted, setIsMounted] = useState(false);
  const [clockOffset, setClockOffset] = useState(0);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const footerControls = ['mute', 'fullscreen', 'minus10', 'playpause', 'plus10', 'reset', 'logout'];

  const setFocusWithTimeout = (idx: number) => {
    setFocusedIndex(idx);
    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    focusTimeoutRef.current = setTimeout(() => setFocusedIndex(-1), 5000);
  };

  const setControlWithTimeout = (idx: number) => {
    setFocusedControl(idx);
    if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
    controlTimeoutRef.current = setTimeout(() => setFocusedControl(-1), 5000);
  };
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<any>(null);
  const ignoreNextWsRef = useRef(false);
  const serverStartedAtRef = useRef<string | null>(null);
  const initialSecondsRef = useRef(0);
  const clockOffsetRef = useRef(0);
  
  const parseUTC = useCallback((dateStr: string | null) => {
    if (!dateStr) return 0;
    // Si la cadena no termina en Z y no tiene un desfase (+/-), le añadimos Z para que el navegador la lea como UTC
    let normalized = dateStr;
    if (!normalized.endsWith('Z') && !normalized.includes('+') && !normalized.match(/-\d{2}:\d{2}$/)) {
        normalized = normalized.replace(' ', 'T') + 'Z';
    }
    return new Date(normalized).getTime();
  }, []);

  const getSyncedNow = useCallback(() => Date.now() + clockOffsetRef.current, []);

  // Inicialización y Montaje
  useEffect(() => {
    setIsMounted(true);
    audioRef.current = new Audio('/notification.wav');
  }, []);

  // Reloj tiempo real (sincronizado)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date(getSyncedNow()));
    }, 1000);
    return () => clearInterval(interval);
  }, [getSyncedNow]);

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
  const syncState = useCallback(async (updates: any) => {
      if (!branding?.slug || !token) return;
      try {
          const newStatus = updates.status ?? status;
          await updateTimerState(branding.slug, token, {
              status: newStatus,
              initial_seconds: updates.initialSeconds ?? initialSeconds,
              remaining_seconds: updates.remainingSeconds ?? timeLeft,
              started_at: (newStatus === 'running') ? (updates.startedAt || new Date(getSyncedNow()).toISOString()) : null,
              view: updates.view ?? view
          });
      } catch (error) {
          console.error("Error syncing timer:", error);
      }
  }, [branding?.slug, token, status, initialSeconds, timeLeft, view]);

  // Manejo de teclado (Control Remoto TV)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isEnter = e.key === 'Enter' || e.key === 'OK' || e.key === 'Select';

    // Arriba/Abajo siempre abren/cierran el menú de tiempos
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (view === 'menu') {
        if (e.key === 'ArrowDown') setFocusWithTimeout((focusedIndex < 0 ? 0 : focusedIndex + 5) % gridTimes.length);
        if (e.key === 'ArrowUp') setFocusWithTimeout((focusedIndex < 0 ? 0 : (focusedIndex - 5 + gridTimes.length)) % gridTimes.length);
      } else {
        setView('menu');
      }
      return;
    }

    if (view === 'menu') {
      e.preventDefault();
      if (e.key === 'ArrowRight') setFocusWithTimeout((focusedIndex < 0 ? 0 : focusedIndex + 1) % gridTimes.length);
      if (e.key === 'ArrowLeft') setFocusWithTimeout((focusedIndex < 0 ? 0 : (focusedIndex - 1 + gridTimes.length)) % gridTimes.length);
      if (isEnter && focusedIndex >= 0) handleTimeSelect(gridTimes[focusedIndex]);
      if (e.key === 'Escape') setView(status === 'running' || status === 'paused' ? 'timer' : 'clock');
    } else {
      // clock o timer: izquierda/derecha navegan controles del footer
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setControlWithTimeout(focusedControl < 0 ? 0 : (focusedControl + 1) % footerControls.length);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setControlWithTimeout(focusedControl < 0 ? footerControls.length - 1 : (focusedControl - 1 + footerControls.length) % footerControls.length);
      }
      if (isEnter || e.key === ' ') {
        e.preventDefault();
        const ctrl = footerControls[focusedControl];
        if (ctrl === 'mute') setIsMuted(m => !m);
        else if (ctrl === 'fullscreen') toggleFullscreen();
        else if (ctrl === 'minus10') adjustTime(-10);
        else if (ctrl === 'playpause') toggleTimer();
        else if (ctrl === 'plus10') adjustTime(10);
        else if (ctrl === 'reset') resetTimer();
        else if (ctrl === 'logout') router.push('/dashboard');
      }
      if (e.key === 'Escape') {
        setView(status === 'running' || status === 'paused' ? 'timer' : 'clock');
      }
    }
  }, [view, focusedIndex, focusedControl, status, initialSeconds, timeLeft, isMuted]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Cargar estado inicial (solo si no hay acción local activa)
  const fetchState = useCallback(async () => {
    if (!branding?.slug || !token) return;
    try {
      const response = await getTimerState(branding.slug, token);
      if (response && response.state) {
          const { state, server_time } = response;
          
          // Calcular desfase de reloj (Server - Local)
          if (server_time) {
            const serverMs = new Date(server_time).getTime();
            const localMs = Date.now();
            const offset = serverMs - localMs;
            setClockOffset(offset);
            clockOffsetRef.current = offset;
          }

          if (state.status === 'running' && state.started_at) {
              const elapsed = Math.floor((getSyncedNow() - parseUTC(state.started_at)) / 1000);
              const remaining = state.initial_seconds - elapsed;
              if (remaining <= 0) {
                  // Timer ya expiró, resetear
                  setStatus('idle');
                  setView('clock');
                  setInitialSeconds(state.initial_seconds);
                  setTimeLeft(0);
                  setIsStateLoaded(true);
                  return;
              }
              setStatus('running');
              setView(state.view as ViewState || 'timer');
              setInitialSeconds(state.initial_seconds);
              initialSecondsRef.current = state.initial_seconds;
              setServerStartedAt(state.started_at);
              serverStartedAtRef.current = state.started_at;
              setTimeLeft(remaining);
              setIsStateLoaded(true);
          } else {
              setStatus(state.status);
              setView(state.view as ViewState || 'clock');
              setInitialSeconds(state.initial_seconds);
              initialSecondsRef.current = state.initial_seconds;
              setServerStartedAt(state.started_at);
              serverStartedAtRef.current = state.started_at;
              setTimeLeft(state.remaining_seconds);
              setIsStateLoaded(true);
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
      if (ignoreNextWsRef.current) {
        ignoreNextWsRef.current = false;
        return;
      }
      
      const incomingView = (data.view as ViewState) || 'timer';
      const incomingStatus = data.status;

      console.log(`📡 [SYNC] Status: ${incomingStatus} | View: ${incomingView} | Time: ${data.remainingSeconds}`);
      
      setStatus(incomingStatus);
      setInitialSeconds(data.initialSeconds);
      
      // LOGICA DE AUTO-CAMBIO DE VISTA: 
      // Si el cronómetro está activo, el proyector DEBE mostrar el timer
      if (incomingStatus === 'running' || incomingStatus === 'paused') {
        setView('timer');
      } else {
        setView(incomingView);
      }
      setServerStartedAt(data.startedAt);
      serverStartedAtRef.current = data.startedAt;
      initialSecondsRef.current = data.initialSeconds;
      setIsStateLoaded(true);
      if (data.status === 'idle' || data.status === 'finished') {
          setTimeLeft(0);
      } else if (data.status === 'running' && data.startedAt) {
          const elapsed = Math.floor((getSyncedNow() - parseUTC(data.startedAt)) / 1000);
          setTimeLeft(Math.max(0, data.initialSeconds - elapsed));
      } else {
          setTimeLeft(data.remainingSeconds);
      }
    });
    return () => { echo.leave(`timer.${branding.slug}`); };
  }, [branding?.slug]);

  // Cronómetro sincronizado con servidor via refs
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (status === 'running') {
      timerRef.current = setInterval(() => {
        const startedAt = serverStartedAtRef.current;
        const initSecs = initialSecondsRef.current;
        if (startedAt && initSecs > 0) {
          const elapsed = Math.floor((getSyncedNow() - parseUTC(startedAt)) / 1000);
          const remaining = Math.max(0, initSecs - elapsed);
          setTimeLeft(remaining);
        }
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  // Detectar fin del tiempo
  useEffect(() => {
    if (timeLeft === 0 && status === 'running') {
      setStatus('finished');
      syncState({ status: 'finished', remainingSeconds: 0 });
      if (!isMuted && audioRef.current) {
        audioRef.current.play().catch(e => console.log("Audio block:", e));
      }
      if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
      setTimeout(() => {
        setView('clock');
        syncState({ view: 'clock' });
      }, 10000);
    }
  }, [timeLeft, status, syncState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRealTime = (date: Date) => {
      return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const handleTimeSelect = (seconds: number) => {
    const startedAt = new Date(getSyncedNow()).toISOString();
    ignoreNextWsRef.current = true;
    initialSecondsRef.current = seconds;
    serverStartedAtRef.current = startedAt;
    setInitialSeconds(seconds);
    setTimeLeft(seconds);
    setStatus('running');
    setView('timer');
    setServerStartedAt(startedAt);
    if (!branding?.slug || !token) return;
    updateTimerState(branding.slug, token, {
      status: 'running',
      initial_seconds: seconds,
      remaining_seconds: seconds,
      started_at: startedAt,
      view: 'timer'
    }).catch(e => console.error('syncState error:', e));
  };

  const toggleTimer = () => {
    const newStatus = status === 'running' ? 'paused' : 'running';
    setStatus(newStatus);
    
    if (newStatus === 'running') {
      const now = new Date(getSyncedNow()).toISOString();
      // Al reanudar, el residuo se convierte en la nueva base
      initialSecondsRef.current = timeLeft;
      serverStartedAtRef.current = now;
      setInitialSeconds(timeLeft);
      setServerStartedAt(now);
      setView('timer');
      syncState({ 
        status: 'running', 
        initialSeconds: timeLeft, 
        startedAt: now,
        view: 'timer'
      });
    } else {
      syncState({ status: 'paused', remainingSeconds: timeLeft });
    }
  };

  const adjustTime = (delta: number) => {
    const newTime = Math.max(0, timeLeft + delta);
    setTimeLeft(newTime);
    
    if (status === 'running') {
      const now = new Date(getSyncedNow()).toISOString();
      initialSecondsRef.current = newTime;
      serverStartedAtRef.current = now;
      setInitialSeconds(newTime);
      setServerStartedAt(now);
      syncState({ status: 'running', initialSeconds: newTime, startedAt: now });
    } else {
      setInitialSeconds(newTime);
      initialSecondsRef.current = newTime;
      syncState({ remainingSeconds: newTime, initialSeconds: newTime });
    }
  };

  const resetTimer = () => {
    if (initialSecondsRef.current <= 0) return;
    setTimeLeft(initialSecondsRef.current);
    setStatus('idle');
    syncState({ status: 'idle', remainingSeconds: initialSecondsRef.current });
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
     if (timeLeft === 0 && status === 'finished' && view === 'timer') return 'bg-red-600';
     if (timeLeft <= 15 && status === 'running' && view === 'timer') return 'bg-yellow-500';
     return 'bg-zinc-950';
  };

  // VISTA PROYECTOR (PC/TV)
  if (!isRemoteMode) {
    const menuOpen = view === 'menu';
    return (
      <div 
        onClick={handleFirstInteraction}
        className={`min-h-screen flex flex-col items-center justify-between overflow-hidden font-sans transition-all duration-1000 relative ${getDisplayColors()}`}
      >
        {/* HEADER */}
        <header className="w-full grid grid-cols-3 items-center z-10 py-4 px-10">
          <div className="flex items-center gap-6">
            <img src="/integracao/2.png" alt="Collab" className="h-16 md:h-24 w-auto object-contain" />
            {branding?.logo && <div className="h-14 w-[1px] bg-white/10 mx-2" />}
            {branding?.logo && <img src={branding.logo} alt="Tenant" className="h-16 md:h-24 w-auto object-contain rounded-full" />}
          </div>
          <div className="flex flex-col items-center">
            <h1 className="text-[clamp(1.5rem,4vw,3.5rem)] font-black tracking-tighter leading-none text-white uppercase whitespace-nowrap text-center">
              {branding?.name || 'SALA'}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 mt-2 opacity-90">JIU JITSU BRASILEÑO TIMER PROFESIONAL</p>
          </div>
          <div className="flex justify-end pr-8">
            <img src="/integracao/4.png" alt="Branding" style={{ width: '160px', height: '100px', objectFit: 'contain' }} className="drop-shadow-2xl brightness-110 flex-shrink-0" />
          </div>
        </header>

        {/* MAIN: CRONÓMETRO */}
        <main className="flex-1 w-full flex flex-col items-center justify-center relative px-24" style={{ paddingBottom: '100px' }}>
          {view === 'clock' && (
            <div
              className="text-[22vw] font-black tracking-tighter leading-none cursor-pointer text-white tabular-nums"
              onClick={() => setView('menu')}
            >
              {isMounted ? formatRealTime(currentTime) : '00:00:00'}
            </div>
          )}
          {(view === 'timer' || view === 'menu') && (
            <div className="flex flex-col items-center">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 mb-4">
                {status === 'running' ? 'combate en curso' : status === 'finished' ? 'tiempo agotado' : status === 'paused' ? 'en pausa' : 'listo'}
              </p>
              <h2 className="text-[28vw] font-black tracking-tighter leading-none select-none tabular-nums text-white">
                {formatTime(timeLeft)}
              </h2>
            </div>
          )}
        </main>

        {/* CONTENEDOR INFERIOR: sheet + navbar */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 flex flex-col gap-2" style={{ width: 'min(900px, 95vw)', paddingBottom: '1.5rem' }}>

          {/* SELECTOR DE TIEMPOS — aparece encima del navbar */}
          <div className={`transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}>
            <div className="bg-zinc-900/95 backdrop-blur-2xl rounded-[1.5rem] border border-white/10 shadow-[0_-8px_40px_rgba(0,0,0,0.5)] p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-3 px-1">Seleccionar tiempo</p>
              <div className="grid grid-cols-5 gap-2">
                {gridTimes.map((time, index) => {
                  const isFocused = index === focusedIndex;
                  const isActive = initialSeconds === time && (status === 'running' || status === 'paused');
                  return (
                    <button key={index} onClick={() => handleTimeSelect(time)}
                      className={`py-4 rounded-2xl font-black text-lg tracking-tight transition-all duration-300 active:scale-95 ${
                        isFocused ? 'bg-yellow-400/20 border-2 border-yellow-400 text-white scale-105'
                        : isActive ? 'bg-white text-black border-2 border-transparent'
                        : 'bg-white/5 border-2 border-transparent text-white/50 hover:bg-white/10 hover:text-white'
                      }`}>
                      {time < 60 ? `${time}s` : `${time / 60}:00`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* NAVBAR */}
          <nav>
            <div className="bg-zinc-900/95 backdrop-blur-2xl rounded-[1.5rem] border border-white/10 shadow-[0_-4px_30px_rgba(0,0,0,0.4)] px-5 py-3 flex items-center justify-between gap-3">
            {/* Utilidades */}
            <div className="flex gap-2 items-center">
              {[
                { id: 0, icon: isMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>, action: () => setIsMuted(m => !m) },
                { id: 1, icon: isFullscreen ? <Minimize size={18}/> : <Maximize size={18}/>, action: toggleFullscreen },
              ].map(({ id, icon, action }) => (
                <button key={id} onClick={action}
                  className={`p-2.5 rounded-xl border transition-all active:scale-90 text-white ${
                    focusedControl === id ? 'bg-yellow-400/20 border-yellow-400' : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}>
                  {icon}
                </button>
              ))}
            </div>

            {/* Controles principales */}
            <div className="flex items-center gap-2">
              <button onClick={() => adjustTime(-10)}
                className={`px-4 py-2.5 rounded-xl border text-white font-black text-sm transition-all active:scale-90 ${
                  focusedControl === 2 ? 'bg-yellow-400/20 border-yellow-400' : 'bg-white/5 border-white/10'
                }`}>−10s</button>
              <button onClick={toggleTimer}
                className={`px-8 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${
                  focusedControl === 3 ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-zinc-900' : ''
                } ${status === 'running' ? 'bg-white text-black' : 'bg-white/10 text-white border border-white/20'}`}>
                {status === 'running' ? <><Pause size={14} fill="currentColor"/>PAUSAR</> : <><Play size={14} fill="currentColor"/>INICIAR</>}
              </button>
              <button onClick={() => adjustTime(10)}
                className={`px-4 py-2.5 rounded-xl border text-white font-black text-sm transition-all active:scale-90 ${
                  focusedControl === 4 ? 'bg-yellow-400/20 border-yellow-400' : 'bg-white/5 border-white/10'
                }`}>+10s</button>
              <button onClick={resetTimer}
                className={`p-2.5 rounded-xl border text-white transition-all active:scale-90 group ${
                  focusedControl === 5 ? 'bg-yellow-400/20 border-yellow-400' : 'bg-white/5 border-white/10'
                }`}>
                <RotateCcw size={16} className="group-hover:rotate-180 transition-all duration-500"/>
              </button>
            </div>

            {/* Hora + logout */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-lg font-black text-white/40 tabular-nums tracking-tighter">
                  {isMounted ? formatRealTime(currentTime) : '00:00:00'}
                </div>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className={`p-2.5 rounded-xl border transition-all active:scale-90 ${
                  focusedControl === 6 ? 'bg-red-600 border-red-600 text-white' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }`}>
                <LogOut size={18}/>
              </button>
            </div>
          </div>
          {/* Footer debajo del navbar */}
          <div className="flex items-center justify-center gap-2 pointer-events-none select-none">
            <img src="/DLogo-v2.webp" alt="" className="w-5 h-5 rounded-full object-cover opacity-50" />
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/40">Digitaliza Todo &middot; Desarrollo de Software &middot; Arica Chile</p>
          </div>
        </nav>
        </div>

        {/* Overlay para cerrar selector */}
        {menuOpen && (
          <div className="fixed inset-0 z-30" onClick={() => setView(status === 'running' || status === 'paused' ? 'timer' : 'clock')} />
        )}
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
             <button onClick={() => changeView('timer')} className={`p-3 rounded-2xl active:scale-90 transition-all ${view === 'timer' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
                <TimerReset size={20} />
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
            {!isStateLoaded ? (isMounted ? formatRealTime(currentTime) : '--:--:--') : status === 'idle' ? (isMounted ? formatRealTime(currentTime) : '--:--:--') : formatTime(timeLeft)}
        </h3>
        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${status === 'running' ? 'text-white' : 'text-white/30'}`}>
            {status === 'running' ? '• Combate Activo' : status === 'finished' ? 'Fin del tiempo' : status === 'paused' ? 'En Pausa' : 'Hora actual'}
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
          <button onClick={() => adjustTime(-10)} className="h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest">-10 Segundos</button>
          <button onClick={() => adjustTime(10)} className="h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest">+10 Segundos</button>
      </div>

      <div className="mt-12 py-8 border-t border-white/10 text-center flex flex-col items-center gap-4">
          <img src="/integracao/4.png" alt="Digitalizatodo" className="h-8 object-contain opacity-50" />
          <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white opacity-20">Powered by Digitalizatodo</p>
      </div>
    </div>
  );
}
