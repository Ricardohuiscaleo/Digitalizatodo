import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Paperclip, MoreHorizontal, Image as ImageIcon, Mic, Bot } from 'lucide-react';

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
    const scrollRef = useRef<HTMLDivElement>(null);
    const recordingInterval = useRef<any>(null);
    const audioChunks = useRef<Blob[]>([]);
    const notificationAudio = useRef<HTMLAudioElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

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
    }, []);

    useEffect(() => {
        if (isOpen) setUnreadCount(0);
    }, [isOpen]);

    // SSE Integration
    useEffect(() => {
        if (!sessionId) return;
        const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://admin.digitalizatodo.cl';
        const eventSource = new EventSource(`${API_BASE}/api/w/chat/stream?session_id=${sessionId}`);

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

        const fetchInitial = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/w/chat/messages?session_id=${sessionId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.length > 0) {
                        setMessages(prev => {
                            const existingIds = new Set(prev.map(m => m.id));
                            const newOnly = data.filter((m: any) => !existingIds.has(m.id));
                            return [...prev, ...newOnly];
                        });
                    }
                }
            } catch (e) {}
        };
        fetchInitial();
        return () => eventSource.close();
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
            await fetch(`${API_BASE}/api/w/chat/upload`, { method: 'POST', body: formData });
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
                bottom-0 left-0 right-0 h-[85vh] sm:bottom-24 sm:right-6 sm:left-auto sm:w-[450px] sm:h-[650px] 
                bg-white sm:rounded-3xl rounded-t-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col overflow-hidden`}
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
                            <p className="text-[10px] text-slate-400 font-medium">En línea • responde en minutos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white sm:hidden">
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
                            
                            <div className="flex items-center">
                                <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2.5 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-full transition-all"><ImageIcon className="w-5 h-5" /></button>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-full transition-all"><Paperclip className="w-5 h-5" /></button>
                                <button type="button" onClick={startRecording} className="p-2.5 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-full transition-all"><Mic className="w-5 h-5" /></button>
                            </div>

                            <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-brand-orange/20 focus-within:border-brand-orange transition-all">
                                <textarea 
                                    rows={1}
                                    placeholder="Mensaje..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                                    className="w-full bg-transparent border-none outline-none resize-none px-4 py-3 text-sm text-slate-700"
                                />
                            </div>

                            <button type="submit" disabled={!message.trim() || chatStatus === 'sending'} className="p-3 bg-brand-orange text-white rounded-full hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 disabled:opacity-50">
                                {chatStatus === 'sending' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* FLOATING ACTION BUTTON (FAB) */}
            <div className="fixed bottom-6 right-6 z-[100] transform-gpu">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-500 relative
                    ${isOpen ? 'bg-slate-900 rotate-90' : 'bg-brand-orange hover:bg-orange-600 rotate-0'}`}
                >
                    {!isOpen && unreadCount > 0 && (
                        <div className="absolute -top-1 -left-1 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-20">
                            <span className="text-emerald-500 text-[10px] font-black">{unreadCount}</span>
                        </div>
                    )}
                    {!isOpen && (
                        <div className="absolute inset-0 bg-brand-orange rounded-full animate-ping opacity-20 scale-125 -z-10"></div>
                    )}
                    {isOpen ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7 fill-white/10" />}
                </button>
            </div>
        </>
    );
};

export default FloatingChat;
