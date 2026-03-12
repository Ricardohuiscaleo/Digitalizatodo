import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, User, Bot } from 'lucide-react';

const FloatingChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatStatus, setChatStatus] = useState<'idle' | 'sending'>('idle');
    const [sessionId, setSessionId] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial message
    const [messages, setMessages] = useState([
        { id: 'init', message: "Hola! 👋 Soy Ricardo. ¿En qué puedo ayudarte hoy?", sender: 'admin', created_at: new Date().toISOString() }
    ]);

    // Initialize session and Traffic Ping
    useEffect(() => {
        let sid = localStorage.getItem('chat_session_id');
        if (!sid) {
            sid = Math.random().toString(36).substring(7);
            localStorage.setItem('chat_session_id', sid);
        }
        setSessionId(sid);

        const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : 'https://admin.digitalizatodo.cl';

        // Traffic Ping (Live Traffic)
        const pingVisit = async () => {
            try {
                const metadata = { userAgent: navigator.userAgent, language: navigator.language };
                await fetch(`${API_BASE}/api/webhooks/visit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sid, url: window.location.href, metadata }),
                });
            } catch (e) {}
        };
        pingVisit();
    }, []);

    // Polling for new messages
    useEffect(() => {
        if (!isOpen || !sessionId) return;

        const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : 'https://admin.digitalizatodo.cl';

        const fetchMessages = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/webhooks/chat/messages?session_id=${sessionId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.length > 0) {
                        setMessages(prev => {
                            const initMsg = prev[0];
                            return [initMsg, ...data];
                        });
                    }
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        };

        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [isOpen, sessionId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !sessionId) return;

        const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : 'https://admin.digitalizatodo.cl';

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

            await fetch(`${API_BASE}/api/webhooks/chat/send`, {
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
                <div className="absolute bottom-16 sm:bottom-20 right-0 w-[calc(100vw-2rem)] max-w-[350px] sm:max-w-[400px] h-[500px] bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
                    {/* Header */}
                    <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
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
                                <h4 className="font-black text-sm uppercase tracking-tight">Ricardo - En vivo</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Respuesta rápida</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                    msg.sender === 'user' 
                                    ? 'bg-brand-orange text-white rounded-tr-none' 
                                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                }`}>
                                    {msg.message}
                                    <p className={`text-[9px] mt-1 font-bold uppercase opacity-30 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
                        <input 
                            type="text"
                            placeholder="Mensaje para Ricardo..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-brand-orange transition-all text-sm"
                        />
                        <button 
                            type="submit"
                            disabled={!message.trim() || chatStatus === 'sending'}
                            className="w-11 h-11 rounded-xl bg-brand-orange text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-orange-200 disabled:opacity-50"
                        >
                            {chatStatus === 'sending' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-90 ${
                    isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-brand-orange text-white'
                }`}
            >
                {isOpen ? <X className="w-6 h-6 sm:w-8 sm:h-8" /> : <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8" />}
            </button>
        </div>
    );
};

export default FloatingChat;
