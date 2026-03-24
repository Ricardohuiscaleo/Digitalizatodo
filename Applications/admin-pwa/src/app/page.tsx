"use client";

import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, 
    Users, 
    Database, 
    ShieldCheck, 
    Bell, 
    Settings, 
    Search, 
    Plus, 
    Globe, 
    TrendingUp, 
    Activity,
    Lock,
    LogOut
} from 'lucide-react';

export default function AdminDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [stats, setStats] = useState({
        totalTenants: 12,
        activeTenants: 10,
        totalUsers: 1450,
        pendingApprovals: 3
    });

    const [tenants, setTenants] = useState([
        { id: 1, name: "Dojo Master Arica", slug: "dojo-arica", industry: "martial_arts", accepted_terms: "2026-03-20 10:45", status: "active", force_terms_acceptance: true },
        { id: 2, name: "Escuela San Luis", slug: "san-luis", industry: "school_treasury", accepted_terms: null, status: "pending_terms", force_terms_acceptance: false },
        { id: 3, name: "Gym Pro", slug: "gym-pro", industry: "martial_arts", accepted_terms: "2026-03-21 15:20", status: "active", force_terms_acceptance: true },
    ]);

    useEffect(() => {
        const token = localStorage.getItem('super_admin_token');
        if (!token) {
            window.location.href = "/login";
        } else {
            // Simular carga de datos
            setTimeout(() => setIsLoading(false), 800);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('super_admin_token');
        window.location.href = "/login";
    };

    const filteredTenants = tenants.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'pending') return !t.accepted_terms;
        if (filter === 'active') return !!t.accepted_terms;
        return true;
    });

    if (isLoading) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 bg-zinc-950 rounded-3xl animate-bounce flex items-center justify-center shadow-2xl">
                <ShieldCheck className="text-white" size={32} />
            </div>
            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 animate-pulse">Iniciando Núcleo...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950">
            {/* Header */}
            <header className="bg-white border-b border-zinc-100 px-8 py-6 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center shadow-lg">
                        <ShieldCheck className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tighter leading-none">Super Admin</h1>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Digitaliza Todo Platform</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="relative p-2 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors">
                        <Bell size={20} className="text-zinc-600" />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                    </button>
                    <div className="h-10 w-[1px] bg-zinc-100 mx-2" />
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 group hover:bg-zinc-50 p-2 rounded-2xl transition-all"
                    >
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 leading-none">Ricardo H.</p>
                            <p className="text-[8px] font-bold text-zinc-400 mt-1 uppercase group-hover:text-rose-600 transition-colors">Cerrar Sesión</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 font-black text-xs group-hover:bg-rose-100 group-hover:border-rose-200 group-hover:text-rose-600 transition-all">RH</div>
                    </button>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r border-zinc-100 h-[calc(100vh-88px)] p-6 sticky top-[88px]">
                    <nav className="space-y-2">
                        <NavItem icon={LayoutDashboard} label="Resumen" active />
                        <NavItem icon={Globe} label="Ecosistemas" />
                        <NavItem icon={Users} label="Usuarios Globales" />
                        <NavItem icon={Database} label="Base de Datos" />
                        <NavItem icon={TrendingUp} label="Métricas" />
                    </nav>

                    <div className="mt-12 pt-12 border-t border-zinc-50">
                        <h3 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest px-4 mb-4">Administración</h3>
                        <nav className="space-y-2">
                            <NavItem icon={Bell} label="Notificaciones Push" />
                            <NavItem icon={Settings} label="Configuración SaaS" />
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-10 space-y-8 max-w-7xl mx-auto">
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-6">
                        <StatCard icon={Globe} label="Tenants Totales" value={stats.totalTenants} color="zinc" />
                        <StatCard icon={Activity} label="Active Users" value={stats.totalUsers} color="indigo" />
                        <StatCard icon={ShieldCheck} label="T&C Aceptados" value="92%" color="emerald" />
                        <StatCard icon={Lock} label="Alertas Seguridad" value="0" color="rose" />
                    </div>

                    {/* Content Area */}
                    <div className="grid grid-cols-3 gap-8">
                        {/* Tenant Table */}
                        <div className="col-span-2 bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm p-8 space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter">Ecosistemas Registrados</h2>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Gestión Global de Clientes</p>
                                </div>
                                <div className="flex gap-2">
                                    <select 
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                        className="h-10 bg-zinc-50 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest outline-none border-none focus:ring-2 ring-zinc-100 transition-all cursor-pointer"
                                    >
                                        <option value="all">Todos</option>
                                        <option value="pending">Pendientes T&C</option>
                                        <option value="active">Activos</option>
                                    </select>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" size={14} />
                                        <input 
                                            placeholder="Buscar tenant..." 
                                            className="h-10 bg-zinc-50 rounded-xl pl-9 pr-4 text-[10px] font-bold outline-none focus:ring-2 ring-zinc-100 w-32 transition-all"
                                        />
                                    </div>
                                    <button className="h-10 bg-zinc-950 text-white rounded-xl px-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">
                                        <Plus size={14} /> Nuevo
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-zinc-50">
                                            <th className="text-left py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] pl-2">Empresa</th>
                                            <th className="text-left py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Industria</th>
                                            <th className="text-left py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">T&C Aceptado</th>
                                            <th className="text-right py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] pr-2">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {filteredTenants.map(tenant => (
                                            <tr key={tenant.id} className="group hover:bg-zinc-50/50 transition-colors">
                                                <td className="py-5 pl-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-100 flex items-center justify-center font-black text-xs text-zinc-400">{tenant.name[0]}</div>
                                                        <div>
                                                            <p className="text-sm font-black text-zinc-900 leading-none">{tenant.name}</p>
                                                            <p className="text-[10px] font-bold text-zinc-400 mt-1">{tenant.slug}.digitalizatodo.cl</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5">
                                                    <span className="text-[10px] font-black uppercase bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded-full">{tenant.industry}</span>
                                                </td>
                                                <td className="py-5">
                                                    <div className="flex items-center gap-4">
                                                        {tenant.accepted_terms ? (
                                                            <div className="flex items-center gap-2 text-emerald-600">
                                                                <ShieldCheck size={14} />
                                                                <span className="text-[10px] font-bold">{tenant.accepted_terms}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-rose-500">
                                                                <ShieldCheck size={14} className="opacity-30" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest italic">Pendiente</span>
                                                            </div>
                                                        )}
                                                        
                                                        <button 
                                                            title={tenant.force_terms_acceptance ? "Guardia Activa" : "Guardia Desactivada"}
                                                            className={`p-1.5 rounded-lg transition-all ${tenant.force_terms_acceptance ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200' : 'bg-zinc-100 text-zinc-400 opacity-50'}`}
                                                            onClick={() => {
                                                                setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, force_terms_acceptance: !t.force_terms_acceptance } : t));
                                                            }}
                                                        >
                                                            <Lock size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-5 text-right pr-2">
                                                    <button className="text-zinc-300 hover:text-zinc-600 transition-colors">
                                                        <Settings size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Alerts */}
                        <div className="space-y-6">
                            <div className="bg-zinc-950 rounded-[2.5rem] p-8 text-white space-y-6 shadow-xl shadow-zinc-200">
                                <h2 className="text-lg font-black uppercase tracking-tighter italic">Salud del Sistema</h2>
                                <div className="space-y-4">
                                    <HealthItem label="API Status" status="online" />
                                    <HealthItem label="Storage" status="84%" />
                                    <HealthItem label="Backup" status="completed" />
                                </div>
                                <div className="pt-4">
                                    <button className="w-full h-12 bg-white/10 hover:bg-white/20 transition-all rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">Database Mirror</button>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm p-8 space-y-6">
                                <h2 className="text-lg font-black uppercase tracking-tighter">Eventos Recientes</h2>
                                <div className="space-y-4">
                                    <EventItem label="Nuevo Registro" time="2 min ago" />
                                    <EventItem label="Pago Verificado" time="15 min ago" />
                                    <EventItem label="T&C Aceptado" time="1h ago" />
                                </div>
                            </div>
                        </div>

                    </div>

                </main>
            </div>
        </div>
    );
}

function NavItem({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
    return (
        <button className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
            active ? 'bg-zinc-950 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'
        }`}>
            <Icon size={18} className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: any, color: string }) {
    const colors: any = {
        zinc: "bg-zinc-950 text-white",
        indigo: "bg-indigo-600 text-white",
        emerald: "bg-emerald-500 text-white",
        rose: "bg-rose-500 text-white"
    };
    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm space-y-4 relative overflow-hidden group hover:shadow-md transition-all">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${colors[color] || colors.zinc}`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</p>
                <p className="text-3xl font-black uppercase tracking-tighter mt-1">{value}</p>
            </div>
        </div>
    );
}

function HealthItem({ label, status }: { label: string, status: string }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${
                status === 'online' ? 'text-emerald-400' : status === 'completed' ? 'text-emerald-400' : 'text-white'
            }`}>{status}</span>
        </div>
    );
}

function EventItem({ label, time }: { label: string, time: string }) {
    return (
        <div className="flex items-start gap-4 py-2 border-b border-zinc-50 last:border-0">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 mt-1.5" />
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 leading-none">{label}</p>
                <p className="text-[8px] font-bold text-zinc-300 mt-1">{time}</p>
            </div>
        </div>
    );
}
