"use client";

import React, { useState } from 'react';
import { Sparkles, ChevronRight, Loader2 } from 'lucide-react';

interface AppUpdatesAccordionProps {
    appUpdates: any[];
}

const AppUpdatesAccordion: React.FC<AppUpdatesAccordionProps> = ({ appUpdates }) => {
    const [updatesOpen, setUpdatesOpen] = useState(false);
    const [visible, setVisible] = useState(3);
    const [loading, setLoading] = useState(false);

    if (!appUpdates || appUpdates.length === 0) return null;

    const loadMore = () => {
        setLoading(true);
        setTimeout(() => {
            setVisible(v => v + 3);
            setLoading(false);
        }, 600);
    };

    return (
        <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
            <button 
                onClick={() => setUpdatesOpen(v => !v)} 
                className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-all active:bg-zinc-100"
            >
                <div className="flex items-center gap-3">
                    <Sparkles size={16} className="text-zinc-400" />
                    <span className="font-black text-sm text-zinc-700 uppercase tracking-tight">Actualizaciones</span>
                    <span className="text-[9px] font-black bg-zinc-900 text-white px-2 py-0.5 rounded-full">
                        {appUpdates.length}
                    </span>
                </div>
                <ChevronRight size={18} className={`text-zinc-300 transition-transform duration-300 ${updatesOpen ? 'rotate-90' : ''}`} />
            </button>
            
            {updatesOpen && (
                <div className="space-y-3 px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                    {appUpdates.slice(0, visible).map((u: any) => (
                        <div key={u.id} className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-black bg-zinc-900 text-white px-2 py-0.5 rounded-full">
                                    v{u.version}
                                </span>
                                <span className="text-[8px] font-bold text-zinc-300 uppercase">
                                    {u.published_at}
                                </span>
                            </div>
                            <h4 className="text-sm font-black text-zinc-800 tracking-tight">{u.title}</h4>
                            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed whitespace-pre-wrap">
                                {u.description}
                            </p>
                        </div>
                    ))}
                    {visible < appUpdates.length && (
                        <button
                            onClick={loadMore}
                            disabled={loading}
                            className="w-full py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                            {loading
                                ? <Loader2 size={14} className="animate-spin" />
                                : `Ver más (${appUpdates.length - visible} restantes)`
                            }
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default AppUpdatesAccordion;
