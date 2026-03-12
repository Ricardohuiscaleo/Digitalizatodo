import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, User, Bot, Paperclip, MoreVertical, Image as ImageIcon, File as FileIcon } from 'lucide-react';

const FloatingChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatStatus, setChatStatus] = useState<'idle' | 'sending'>('idle');
    const [sessionId, setSessionId] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const notificationAudio = useRef<HTMLAudioElement | null>(null);

    // Initial message with delay
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMessages([
                { id: 'init', message: "Hola! 👋 Soy Ricardo. ¿En qué puedo ayudarte hoy?", sender: 'admin', created_at: new Date().toISOString() }
            ]);
            if (!isOpen) {
                setUnreadCount(prev => prev + 1);
                playNotification();
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    // Audio activation on scroll (silent)
    useEffect(() => {
        notificationAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        
        const enableAudio = () => {
            if (!isAudioEnabled) {
                // Play a silent short sound to unlock audio context in browsers
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
            notificationAudio.current.play().catch(e => console.log('Audio play failed:', e));
        }
    };

    // Initialize session and Traffic Ping
    useEffect(() => {
        let sid = localStorage.getItem('chat_session_id');
        if (!sid) {
            sid = Math.random().toString(36).substring(7);
            localStorage.setItem('chat_session_id', sid);
        }
        setSessionId(sid);

        const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://admin.digitalizatodo.cl';

        // Traffic Ping (Live Traffic)
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

    // Reset unread when open
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [isOpen]);

    // SSE for real-time messages
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
            } catch (err) {
                console.error('SSE Parse Error:', err);
            }
        });

        eventSource.onerror = (err) => {
            console.error('SSE Error:', err);
            eventSource.close();
        };

        // Fetch inicial para cargar historial
        const fetchInitial = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/w/chat/messages?session_id=${sessionId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.length > 0) {
                        setMessages(prev => {
                            const initMsg = prev[0];
                            const existingIds = new Set(prev.map(m => m.id));
                            const newOnly = data.filter((m: any) => !existingIds.has(m.id));
                            return [...prev, ...newOnly];
                        });
                    }
                }
            } catch (e) {}
        };
        fetchInitial();

        return () => {
            eventSource.close();
        };
    }, [sessionId, isOpen]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !sessionId) return;

        const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://admin.digitalizatodo.cl';
        setChatStatus('sending');

        try {
            const formData = new FormData();
            formData.append('session_id', sessionId);
            formData.append('file', file);

            await fetch(`${API_BASE}/api/w/chat/upload`, {
                method: 'POST',
                body: formData
            });
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setChatStatus('idle');
            e.target.value = ''; // Reset input
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
            const visitorData = {
                url: window.location.href,
                userAgent: navigator.userAgent,
                screen: `${window.screen.width}x${window.screen.height}`,
                language: navigator.language
            };

            await fetch(`${API_BASE}/api/w/chat/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    session_id: sessionId, 
                    message: currentMsg,
                    metadata: visitorData 
                }),
            });
        } catch (error) {
            console.error('Send error:', error);
        } finally {
            setChatStatus('idle');
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-16 sm:bottom-20 right-0 w-[calc(100vw-2rem)] max-w-[350px] sm:max-w-[400px] h-[600px] bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
                    {/* Header */}
                    <div className="bg-slate-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-brand-orange/50">
                                    <img 
                                        src="/crh.png" 
                                        alt="Ricardo" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                            </div>
                            <div>
                                <h4 className="font-black text-sm uppercase tracking-tight">Ricardo - DigitalizaTodo</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Responde en minutos</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 sm:hidden">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 scroll-smooth">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                    msg.sender === 'user' 
                                    ? 'bg-brand-orange text-white rounded-tr-none' 
                                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                }`}>
                                    {(msg as any).type === 'image' && (msg as any).file_path && (
                                        <img 
                                            src={(msg as any).file_path} 
                                            alt="Media" 
                                            className="rounded-lg mb-2 max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open((msg as any).file_path, '_blank')}
                                        />
                                    )}
                                    {(msg as any).type === 'audio' && (msg as any).file_path && (
                                        <div className="mb-2 min-w-[200px]">
                                            <audio controls className="w-full h-8">
                                                <source src={(msg as any).file_path} type="audio/ogg" />
                                                Audio
                                            </audio>
                                        </div>
                                    )}
                                    {msg.message}
                                    <p className={`text-[9px] mt-1 font-bold uppercase opacity-30 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                        <form onSubmit={handleSend} className="flex items-end gap-2">
                            <input 
                                type="file" 
                                id="chat-file-upload" 
                                className="hidden" 
                                onChange={handleFileUpload}
                                accept="image/*,.pdf,.doc,.docx"
                            />
                            <label 
                                htmlFor="chat-file-upload"
                                className="p-3 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-full transition-all cursor-pointer"
                            >
                                <Paperclip className="w-5 h-5" />
                            </label>

                            <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-brand-orange/20 focus-within:border-brand-orange transition-all">
                                <textarea 
                                    rows={1}
                                    placeholder="Escribe tu mensaje..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend(e);
                                        }
                                    }}
                                    className="w-full bg-transparent border-none outline-none resize-none px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400"
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={!message.trim() || chatStatus === 'sending'}
                                className="p-3 bg-brand-orange text-white rounded-full hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
                            >
                                {chatStatus === 'sending' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <div className="relative">
                {unreadCount > 0 && (
                    <div className="absolute -top-2 -left-2 w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-50 animate-bounce">
                        <span className="text-emerald-500 text-xs font-black">{unreadCount}</span>
                    </div>
                )}
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-90 ${
                        isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-brand-orange text-white'
                    }`}
                >
                    {isOpen ? <X className="w-6 h-6 sm:w-8 sm:h-8" /> : <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8" />}
                </button>
            </div>
        </div>
    );
};

export default FloatingChat;
