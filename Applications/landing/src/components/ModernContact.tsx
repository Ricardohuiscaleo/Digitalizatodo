import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2, MessageCircle } from 'lucide-react';
import SectionBadge from './common/SectionBadge';

const ModernContact = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        service: 'Selecciona un servicio',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.service === 'Selecciona un servicio') {
            alert('Por favor selecciona un servicio');
            return;
        }

        setStatus('loading');

        try {
            const API_BASE = import.meta.env.PUBLIC_API_URL || 'https://admin.digitalizatodo.cl';

            const sessionId = localStorage.getItem('chat_session_id') || 'no-session';
            const response = await fetch(`${API_BASE}/api/w/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ ...formData, session_id: sessionId }),
            });

            if (response.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', service: 'Selecciona un servicio', message: '' });
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    return (
        <section id="contacto" className="py-24 px-[5px] sm:px-6 bg-slate-50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 grid lg:grid-cols-5 relative z-10">
                    {/* Left: Contact Info (2/5) */}
                    <div className="lg:col-span-2 bg-slate-900 p-6 sm:p-10 lg:p-16 text-white space-y-12 relative overflow-hidden flex flex-col justify-between">
                        <div className="relative z-10 space-y-6">
                            <SectionBadge text="Conectemos" />
                            <h3 className="text-3xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Hablemos de tu próximo proyecto</h3>
                            <p className="text-slate-400 text-lg leading-relaxed font-medium">
                                Estamos listos para ayudarte a digitalizar tu empresa. Déjanos tus datos y nos pondremos en contacto en menos de 24 horas.
                            </p>
                        </div>

                        <div className="relative z-10 space-y-6 pt-10 border-t border-white/5">
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-brand-orange group-hover:border-transparent transition-all duration-300">
                                    <Mail className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Email Directo</p>
                                    <p className="text-lg font-bold text-slate-200 hover:text-brand-orange transition-colors">
                                        <a href="mailto:info@digitalizatodo.cl">info@digitalizatodo.cl</a>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-brand-orange group-hover:border-transparent transition-all duration-300">
                                    <MessageCircle className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">WhatsApp Business</p>
                                    <p className="text-lg font-bold text-slate-200 hover:text-brand-orange transition-colors">
                                        <a href="https://wa.me/56945392581" target="_blank" rel="noopener noreferrer">+56 9 4539 2581</a>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Decor */}
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl -mb-32 -mr-32"></div>
                    </div>

                    {/* Right: Form (3/5) */}
                    <div className="lg:col-span-3 p-6 sm:p-10 lg:p-16">
                        {status === 'success' ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-500">
                                <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-3xl font-black text-slate-900">¡Mensaje Recibido!</h4>
                                    <p className="text-slate-500 text-lg">Nos llegará una notificación instantánea a Telegram. <br /> Te contactaremos muy pronto.</p>
                                </div>
                                <button 
                                    onClick={() => setStatus('idle')}
                                    className="text-brand-orange font-bold hover:underline"
                                >
                                    Enviar otro mensaje
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Nombre Completo</label>
                                    <input 
                                        required
                                        type="text" 
                                        placeholder="Ej. Juan Pérez"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-brand-orange focus:ring-4 focus:ring-orange-100 outline-none transition-all placeholder:text-slate-400" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Email Corporativo</label>
                                    <input 
                                        required
                                        type="email" 
                                        placeholder="juan@empresa.cl"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-brand-orange focus:ring-4 focus:ring-orange-100 outline-none transition-all placeholder:text-slate-400" 
                                    />
                                </div>
                                <div className="sm:col-span-2 space-y-2">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Servicio de Interés</label>
                                    <div className="relative">
                                        <select 
                                            required
                                            value={formData.service}
                                            onChange={(e) => setFormData({...formData, service: e.target.value})}
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-brand-orange focus:ring-4 focus:ring-orange-100 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option disabled>Selecciona un servicio</option>
                                            <option>Desarrollo de Software</option>
                                            <option>Desarrollo Web</option>
                                            <option>Automatización de Procesos</option>
                                            <option>Otro</option>
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="sm:col-span-2 space-y-2">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Mensaje / Detalles</label>
                                    <textarea 
                                        required
                                        rows={4}
                                        placeholder="Cuéntanos un poco sobre tu necesidad..."
                                        value={formData.message}
                                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-brand-orange focus:ring-4 focus:ring-orange-100 outline-none transition-all placeholder:text-slate-400 resize-none" 
                                    ></textarea>
                                </div>
                                <div className="sm:col-span-2 pt-4">
                                    <button 
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="w-full bg-brand-orange text-white py-5 rounded-2xl font-black text-lg hover:bg-orange-600 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-orange-200 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {status === 'loading' ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                Enviar Mensaje
                                                <Send className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                    {status === 'error' && (
                                        <p className="text-rose-500 text-sm font-bold text-center mt-4">Hubo un error al enviar. Reinténtalo o contáctanos por WhatsApp.</p>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ModernContact;
