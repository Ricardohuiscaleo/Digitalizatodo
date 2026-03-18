import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Paperclip, Image as ImageIcon, Mic, Bot } from 'lucide-react';

const FloatingChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatStatus, setChatStatus] = useState<'idle' | 'sending'>('idle');
    const [sessionId, setSessionId] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [fabHidden, setFabHidden] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const recordingInterval = useRef<any>(null);
    const audioChunks = useRef<Blob[]>([]);
    const notificationAudio = useRef<HTMLAudioElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [userIp, setUserIp] = useState('...');
    const [userCity, setUserCity] = useState('...');

    // Footer intersection observer
    useEffect(() => {
        const footer = document.getElementById('footer');
        if (!footer) return;
        const observer = new IntersectionObserver(
            ([entry]) => setFabHidden(entry.isIntersecting),
            { threshold: 0.1 }
        );
        observer.observe(footer);
        return () => observer.disconnect();
    }, []);

    // Initial message with delay
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMessages([
                { id: 'init', message: "¡Hola! 👋 Soy Ricardo. ¿En qué podemos ayudarte con tu próximo proyecto?", sender: 'admin', created_at: new Date().toISOString() }
            ]);
            if (!isOpen) {
                setUnreadCount(prev => prev + 1);
                playNotification();
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    // Audio activation
    useEffect(() => {
        notificationAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        const enableAudio = () => {
            if (!isAudioEnabled) {
                notificationAudio.current?.play().then(() => {
                    notificationAudio.current!.pause();
                    notificationAudio.current!.currentTime = 0;
                    setIsAudioEnabled(true);
                    window.removeEventListener('scroll', enableAudio);
                    window.removeEventListener('click', enableAudio);
                }).catch(() => {});
            }
        };
        window.addEventListener('scroll', enableAudio);
        window.addEventListener('click', enableAudio);
        return () => {
            window.removeEventListener('scroll', enableAudio);
            window.removeEventListener('click', enableAudio);
        };
    }, [isAudioEnabled]);

    const playNotification = () => {
        if (notificationAudio.current) {
            notificationAudio.current.play().catch(() => {});
        }
    };

    // Session Initialization
    useEffect(() => {
        let sid = localStorage.getItem('chat_session_id');
        if (!sid) {
            sid = Math.random().toString(36).substring(7);
            localStorage.setItem('chat_session_id', sid);
        }
        setSessionId(sid);

        const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://admin.digitalizatodo.cl';
        const pingVisit = async () => {
            try {
                const metadata = { userAgent: navigator.userAgent, language: navigator.language };
                await fetch(`${API_BASE}/api/w/visit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sid, url: window.location.href, metadata }),
                });
            } catch (e) {}
        };
        pingVisit();

        // Fetch Geolocation
        const fetchGeo = async () => {
            try {
                const res = await fetch('https://freeipapi.com/api/json');
                const data = await res.json();
                if (data.ipAddress) setUserIp(data.ipAddress);
                if (data.cityName) setUserCity(data.cityName);
            } catch (e) {}
        };
        fetchGeo();
    }, []);

    useEffect(() => {
        if (isOpen) setUnreadCount(0);
    }, [isOpen]);

    // SSE & Polling Integration
    useEffect(() => {
        if (!sessionId) return;
        const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://admin.digitalizatodo.cl';
        let eventSource: EventSource | null = null;
        let pollInterval: any = null;

        const setupSSE = () => {
            eventSource = new EventSource(`${API_BASE}/api/w/chat/stream?session_id=${sessionId}&t=${Date.now()}`);
            
            eventSource.addEventListener('new-message', (event: any) => {
                try {
                    const newMsg = JSON.parse(event.data);
                    setMessages(prev => {
                        if (prev.find(m => m.id === newMsg.id)) return prev;
                        if (!isOpen && newMsg.sender === 'admin') {
                            setUnreadCount(c => c + 1);
                            playNotification();
                        }
                        return [...prev, newMsg];
                    });
                } catch (err) {}
            });

            eventSource.onerror = () => {
                console.warn("SSE connection error, falling back to polling");
                if (eventSource) eventSource.close();
                startPolling();
            };
        };

        const fetchMessages = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/w/chat/messages?session_id=${sessionId}&t=${Date.now()}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.length > 0) {
                        setMessages(prev => {
                            const existingIds = new Set(prev.map(m => m.id));
                            const newOnly = data.filter((m: any) => !existingIds.has(m.id));
                            if (newOnly.length === 0) return prev;
                            
                            // Si hay mensajes nuevos de admin fuera del lag, notificar
                            const hasAdminMsg = newOnly.some((m: any) => m.sender === 'admin');
                            if (!isOpen && hasAdminMsg) {
                                setUnreadCount(c => c + 1);
                                playNotification();
                            }
                            return [...prev, ...newOnly];
                        });
                    }
                }
            } catch (e) {}
        };

        const startPolling = () => {
            if (pollInterval) return;
            pollInterval = setInterval(fetchMessages, 4000); // Polling cada 4s (Seguro para móvil)
        };

        setupSSE();
        fetchMessages(); // Carga inicial

        return () => {
            if (eventSource) eventSource.close();
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [sessionId, isOpen]);

    const handleFileUpload = async (e: any, type: string = 'file', blob?: Blob) => {
        const file = blob || e.target.files?.[0];
        if (!file || !sessionId) return;
        const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://admin.digitalizatodo.cl';
        setChatStatus('sending');
        try {
            const formData = new FormData();
            formData.append('session_id', sessionId);
            if (blob) {
                const extension = blob.type.includes('ogg') ? 'ogg' : 'webm';
                formData.append('file', blob, `voice_note_${Date.now()}.${extension}`);
            } else {
                formData.append('file', file);
            }
            await fetch(`${API_BASE}/api/w/chat/media-push?t=${Date.now()}`, { method: 'POST', body: formData });
        } catch (error) {} finally {
            setChatStatus('idle');
            if (e.target) e.target.value = '';
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            audioChunks.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.current.push(e.data); };
            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, { type: recorder.mimeType });
                handleFileUpload({ target: {} } as any, 'audio', audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };
            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingDuration(0);
            recordingInterval.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
        } catch (err) { alert('Verifica los permisos del micrófono.'); }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            clearInterval(recordingInterval.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.onstop = null;
            mediaRecorder.stop();
            setIsRecording(false);
            clearInterval(recordingInterval.current);
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !sessionId) return;
        const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://admin.digitalizatodo.cl';
        const currentMsg = message;
        setMessage('');
        setChatStatus('sending');
        try {
            await fetch(`${API_BASE}/api/w/chat/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, message: currentMsg, metadata: { url: window.location.href, userAgent: navigator.userAgent } }),
            });
        } catch (error) {} finally { setChatStatus('idle'); }
    };

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isOpen]);

    return (
        <>
            {/* Dark overlay on mobile when chat is open */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[90] sm:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Chat Window */}
            <div 
                className={`fixed z-[100] transition-all duration-500 ease-out origin-bottom-right transform-gpu
                ${isOpen ? 'opacity-100 scale-100 pointer-events-auto translate-y-0' : 'opacity-0 scale-95 pointer-events-none translate-y-10'}
                bottom-0 left-0 right-0 h-full sm:h-[650px] sm:bottom-24 sm:right-6 sm:left-auto sm:w-[450px] 
                bg-white sm:rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col overflow-hidden`}
            >
                {/* Header */}
                <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 overflow-hidden">
                                <img src="/crh.png" alt="R" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Ricardo - DigitalizaTodo</h3>
                            <p className="text-[10px] text-slate-400 font-medium leading-tight">En línea • responde en minutos</p>
                            <p className="text-[10px] text-brand-orange font-bold uppercase tracking-wider leading-tight">Tu IP es: {userIp} • Ciudad: {userCity}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white sm:hidden"
                            aria-label="Cerrar chat"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                    <div className="text-center mb-6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-200/50 px-3 py-1 rounded-full">Hoy</span>
                    </div>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} max-w-full animate-in fade-in slide-in-from-bottom-2`}>
                            <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm shadow-sm leading-relaxed ${
                                msg.sender === 'user' 
                                ? 'bg-brand-orange text-white rounded-tr-sm' 
                                : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
                            }`}>
                                {msg.type === 'image' && msg.file_path && (
                                    <img src={msg.file_path} alt="Media" className="rounded-lg mb-2 max-w-full h-auto cursor-pointer" onClick={() => window.open(msg.file_path, '_blank')} />
                                )}
                                {msg.type === 'audio' && msg.file_path && (
                                    <audio controls className="w-full h-8 mb-2"><source src={msg.file_path} type="audio/ogg" />Audio</audio>
                                )}
                                {msg.message || msg.text}
                            </div>
                            <span className="text-[10px] font-medium text-slate-400 mt-1 px-1">{new Date(msg.created_at || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                    {isRecording ? (
                        <div className="flex items-center justify-between bg-orange-50 p-3 rounded-2xl border border-brand-orange/20 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                                <span className="text-sm font-black text-brand-orange uppercase tracking-wider">Grabando... {Math.floor(recordingDuration/60)}:{ (recordingDuration%60).toString().padStart(2,'0') }</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={cancelRecording} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-500 uppercase">Cancelar</button>
                                <button onClick={stopRecording} className="bg-brand-orange text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 shadow-lg shadow-orange-500/20">Enviar</button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSend} className="flex items-end gap-1.5">
                            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'file')} accept=".pdf,.doc,.docx" />
                            <input type="file" ref={imageInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'image')} accept="image/*" />
                            
                            {/* Multimedia disabled by user request */}
                            {/* <div className="flex items-center">
                                <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2.5 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-full transition-all"><ImageIcon className="w-5 h-5" /></button>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-full transition-all"><Paperclip className="w-5 h-5" /></button>
                                <button type="button" onClick={startRecording} className="p-2.5 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-full transition-all"><Mic className="w-5 h-5" /></button>
                            </div> */}

                            <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-brand-orange/20 focus-within:border-brand-orange transition-all">
                                <textarea 
                                    rows={1}
                                    placeholder="Mensaje..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                                    className="w-full bg-transparent border-none outline-none resize-none px-4 py-3 text-base text-slate-700"
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={!message.trim() || chatStatus === 'sending'} 
                                className="p-3 bg-brand-orange text-white rounded-full hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 disabled:opacity-50"
                                aria-label="Enviar mensaje"
                            >
                                {chatStatus === 'sending' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* FLOATING ACTION BUTTON (FAB) */}
            <div className={`fixed bottom-6 right-6 z-[100] transform-gpu transition-all duration-300 ${
                isOpen ? 'hidden sm:block' : 'block'
            } ${fabHidden ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'}`}>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-500 relative
                    ${isOpen ? 'bg-slate-900 rotate-90' : 'bg-brand-orange hover:bg-orange-600 rotate-0'}`}
                    aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
                >
                    {!isOpen && unreadCount > 0 && (
                        <div className="absolute -top-1 -left-1 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-20">
                            <span className="text-emerald-500 text-[10px] font-black">{unreadCount}</span>
                        </div>
                    )}
                    {isOpen ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7 fill-white/10" />}
                </button>
            </div>
        </>
    );
};

export default FloatingChat;
