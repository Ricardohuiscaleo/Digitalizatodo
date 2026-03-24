"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  ShieldCheck, 
  Globe, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  Unlock,
  ExternalLink,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { getAllTenants, updateTenant, createTenant } from '@/lib/api';



export default function DeepAdminDashboard() {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem('super_admin_token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthorized(true);
      fetchTenants(token);
    }
  }, [router]);

  const fetchTenants = async (token: string) => {
    const data = await getAllTenants(token);
    setTenants(data);
    setIsLoading(false);
  };

  const handleToggleActive = async (tenantId: string | number, currentStatus: boolean) => {
    const token = localStorage.getItem('super_admin_token');
    if (!token) return;

    // Optimistic update
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, active: !currentStatus } : t));

    const result = await updateTenant(token, tenantId, { active: !currentStatus });
    if (!result) {
      // Rollback on error
      fetchTenants(token);
    }
  };

  const handleToggleForceTerms = async (tenantId: string | number, current: boolean) => {
    const token = localStorage.getItem('super_admin_token');
    if (!token) return;

    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, force_terms_acceptance: !current } : t));

    const result = await updateTenant(token, tenantId, { force_terms_acceptance: !current });
    if (!result) {
      fetchTenants(token);
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenant, setNewTenant] = useState({
    id: '', name: '', industry: 'martial_arts', 
    admin_name: '', admin_email: '', admin_password: ''
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('super_admin_token');
    if (!token) return;

    const result = await createTenant(token, newTenant);
    if (result?.tenant) {
      setShowCreateModal(false);
      fetchTenants(token);
      setNewTenant({ id: '', name: '', industry: 'martial_arts', admin_name: '', admin_email: '', admin_password: '' });
    } else {
      alert("Error al crear tenant: " + (result?.error || "Verifique los datos"));
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: "Tenants Activos", value: tenants.filter(t => t.active).length.toString(), icon: Globe, trend: "Tiempo real", color: "text-cyan-400" },
    { label: "Usuarios Globales", value: tenants.reduce((acc, t) => acc + (t.users_count || 0), 0).toString(), icon: Users, trend: "Synced", color: "text-blue-400" },
    { label: "Aceptación T&C", value: "TBD", icon: ShieldCheck, trend: "Nivel óptimo", color: "text-emerald-400" },
    { label: "Status Sistema", value: "Estable", icon: Activity, trend: "99.9% Uptime", color: "text-amber-400" },
  ];


  const filteredTenants = tenants.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !t.active;
    if (filter === 'pro') return t.saas_plan === 'pro';
    if (filter === 'enterprise') return t.saas_plan === 'enterprise';
    return true;
  });

  return (

    <>
      <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 font-sans">

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="relative z-10 flex h-screen overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-72 border-r border-white/5 bg-zinc-900/50 backdrop-blur-xl flex flex-col p-6 space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-xl bg-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              <ShieldCheck className="text-black" size={24} />
            </div>
            <div>
              <h2 className="font-black uppercase tracking-tighter text-sm">Engine Admin</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Control Center</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <SidebarItem icon={Globe} label="Tenants" active />
            <SidebarItem icon={Users} label="Usuarios" />
            <SidebarItem icon={Bell} label="Notificaciones" badge="3" />
            <SidebarItem icon={TrendingUp} label="Analíticas" />
            <div className="pt-8 pb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-4">Nucleo Config</p>
            </div>
            <SidebarItem icon={Settings} label="Configuración" />
            <SidebarItem icon={ShieldCheck} label="Seguridad" />
          </nav>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-white/10" />
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">Ricardo H.</p>
                <p className="text-[10px] text-cyan-500 font-black uppercase tracking-tighter">Master Access</p>
              </div>
            </div>
            <button className="w-full flex items-center justify-between p-2 text-zinc-400 hover:text-white transition-colors group">
              <span className="text-[10px] font-black uppercase tracking-widest">Desconectar</span>
              <LogOut size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          
          {/* Header */}
          <header className="h-20 border-b border-white/5 bg-black/50 backdrop-blur-md flex items-center justify-between px-10">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-black uppercase tracking-tighter">Gestión de <span className="text-cyan-400">Tenants</span></h1>
              <div className="h-10 w-96 bg-white/5 rounded-full border border-white/5 flex items-center px-4 group focus-within:border-cyan-500/50 transition-all">
                <Search size={18} className="text-zinc-500" />
                <input 
                  placeholder="Buscar instancia por nombre o ID..." 
                  className="bg-transparent border-none outline-none flex-1 px-3 text-sm font-medium placeholder:text-zinc-600"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="h-10 w-10 rounded-full border border-white/5 flex items-center justify-center hover:bg-white/5 transition-colors relative">
                <Bell size={18} className="text-zinc-400" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-cyan-500 rounded-full border-2 border-black" />
              </button>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="rounded-full bg-white text-black font-black uppercase tracking-widest text-[10px] px-6 hover:bg-cyan-400 transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]"
              >
                <Plus size={16} className="mr-2" /> Nuevo Tenant
              </Button>

            </div>
          </header>

          {/* Scroll Area */}
          <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Conectando con el Núcleo...</p>
              </div>
            ) : tenants.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4 border border-white/5 rounded-3xl bg-zinc-900/20">
                    <Globe className="text-zinc-700" size={48} />
                    <div className="text-center">
                        <p className="text-sm font-bold uppercase tracking-tighter">No se encontraron tenants</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-1">Verifica la conexión con el servidor API</p>
                    </div>
                    <Button variant="outline" className="rounded-full text-[10px] border-white/10" onClick={() => fetchTenants(localStorage.getItem('super_admin_token') || '')}>
                        Reintentar
                    </Button>
                </div>
            ) : (
                <>
                {/* Stats Grid */}

            <div className="grid grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <Card key={i} className="bg-zinc-900/40 border-white/5 p-6 space-y-4 hover:border-cyan-500/30 transition-all group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl rounded-full group-hover:bg-cyan-500/10 transition-all" />
                  <div className="flex items-center justify-between">
                    <stat.icon className={`${stat.color} opacity-80`} size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-white/5 px-2 py-1 rounded-md">{stat.trend}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{stat.label}</p>
                    <p className="text-3xl font-black tracking-tighter mt-1">{stat.value}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Content Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button 
                    variant={filter === 'all' ? 'default' : 'ghost'} 
                    onClick={() => setFilter('all')}
                    className={`rounded-full uppercase tracking-tighter text-[10px] font-black ${filter === 'all' ? 'bg-cyan-500' : 'text-zinc-500'}`}
                  >
                    Todos
                  </Button>
                  <Button 
                    variant={filter === 'pending' ? 'default' : 'ghost'} 
                    onClick={() => setFilter('pending')}
                    className={`rounded-full uppercase tracking-tighter text-[10px] font-black ${filter === 'pending' ? 'bg-amber-500' : 'text-zinc-500'}`}
                  >
                    Pendientes
                  </Button>
                  <div className="h-4 w-px bg-white/10 mx-2" />
                  <Button 
                    variant={filter === 'pro' ? 'default' : 'ghost'} 
                    onClick={() => setFilter('pro')}
                    className={`rounded-full uppercase tracking-tighter text-[10px] font-black ${filter === 'pro' ? 'bg-indigo-500' : 'text-zinc-500'}`}
                  >
                    Pro
                  </Button>
                  <Button 
                    variant={filter === 'enterprise' ? 'default' : 'ghost'} 
                    onClick={() => setFilter('enterprise')}
                    className={`rounded-full uppercase tracking-tighter text-[10px] font-black ${filter === 'enterprise' ? 'bg-emerald-500' : 'text-zinc-500'}`}
                  >
                    Enterprise
                  </Button>
                </div>

                <Button variant="ghost" className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                  <Filter size={14} className="mr-2" /> Ver Más Filtros
                </Button>
              </div>

              {/* Tenant Rows */}
              <div className="space-y-4">
                {filteredTenants.map((t) => (

                  <div 
                    key={t.id} 
                    className={`group bg-zinc-900/20 border border-white/5 rounded-3xl p-6 flex items-center justify-between hover:bg-zinc-900/50 hover:border-white/10 transition-all backdrop-blur-sm ${!t.active ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform">
                        <Globe className={`group-hover:text-cyan-400 ${t.active ? 'text-zinc-400' : 'text-zinc-600'}`} size={24} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-lg tracking-tight">{t.name}</h3>
                          <Badge 
                            onClick={() => handleToggleActive(t.id, t.active)}
                            className={`cursor-pointer transition-all border-none ${t.active ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                          >
                            {t.active ? 'ACTIVO' : 'INACTIVO'}
                          </Badge>
                          <Badge variant="outline" className="border-white/5 text-zinc-500 uppercase text-[9px]">PLAN {t.saas_plan || 'FREE'}</Badge>
                        </div>
                        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">ID: {t.id} &bull; Industria: {t.industry || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-12">
                      <div className="text-right space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Guardia T&C</p>
                        <div className="flex items-center gap-4 justify-end">
                          <div className="flex flex-col items-end">
                            <span className={`text-[9px] font-black uppercase ${t.accepted_terms_at ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {t.accepted_terms_at ? 'Firmado' : 'Pendiente'}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleToggleForceTerms(t.id, t.force_terms_acceptance)}
                            className={`h-11 w-20 rounded-full border relative transition-all duration-500 overflow-hidden ${t.force_terms_acceptance ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-zinc-800 border-zinc-700'}`}
                          >
                            <div className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-full transition-all duration-500 ${t.force_terms_acceptance ? 'left-11 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'left-1 bg-zinc-600'}`}>
                              {t.force_terms_acceptance ? <Lock size={14} className="text-black" /> : <Unlock size={14} className="text-zinc-300" />}
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                         <Button variant="ghost" size="icon" className="rounded-2xl border border-white/5 hover:bg-white/5" onClick={() => window.open(`http://${t.id}.localhost:3000`, '_blank')}>
                            <ExternalLink size={18} className="text-zinc-400" />
                         </Button>
                         <Button variant="ghost" size="icon" className="rounded-2xl border border-white/5 hover:bg-white/5">
                            <Settings size={18} className="text-zinc-400" />
                         </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  </div>
</div>


    {/* Create Tenant Modal */}
    {showCreateModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCreateModal(false)} />
        <Card className="relative w-full max-w-lg bg-zinc-900 border-white/10 p-8 space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-right from-cyan-500 to-blue-600" />
          
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tighter uppercase">Nuevo Nucleo</h2>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Instanciar nueva organización SaaS</p>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">ID / SLUG</label>
                <input 
                  required
                  placeholder="ej: academia-oro"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none transition-all placeholder:text-zinc-700"
                  value={newTenant.id}
                  onChange={e => setNewTenant({...newTenant, id: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Giro / Industria</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none transition-all"
                  value={newTenant.industry}
                  onChange={e => setNewTenant({...newTenant, industry: e.target.value})}
                >
                  <option value="martial_arts" className="bg-zinc-900">Artes Marciales (Gimbox)</option>
                  <option value="school_treasury" className="bg-zinc-900">Tesorería Escolar (Colify)</option>
                  <option value="fitness" className="bg-zinc-900">Gimnasios / Fitness</option>
                  <option value="dance" className="bg-zinc-900">Danza / Academias</option>
                  <option value="clinic" className="bg-zinc-900">Salud / Clínicas</option>
                  <option value="education" className="bg-zinc-900">Educación / Talleres</option>
                  <option value="default" className="bg-zinc-900">Otro Giro</option>

                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Nombre Comercial</label>
              <input 
                required
                placeholder="Nombre de la institución"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none transition-all placeholder:text-zinc-700"
                value={newTenant.name}
                onChange={e => setNewTenant({...newTenant, name: e.target.value})}
              />
            </div>

            <div className="pt-4 border-t border-white/5 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500">Credenciales Dueño Principal</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Nombre Admin</label>
                  <input 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none transition-all"
                    value={newTenant.admin_name}
                    onChange={e => setNewTenant({...newTenant, admin_name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Email Maestro</label>
                  <input 
                    required
                    type="email"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none transition-all"
                    value={newTenant.admin_email}
                    onChange={e => setNewTenant({...newTenant, admin_email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Clave de Acceso</label>
                <input 
                  required
                  type="password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none transition-all"
                  value={newTenant.admin_password}
                  onChange={e => setNewTenant({...newTenant, admin_password: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button type="button" variant="ghost" className="flex-1 rounded-xl" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1 rounded-xl bg-cyan-500 text-black font-black uppercase tracking-widest">
                Crear Instancia
              </Button>
            </div>
          </form>
        </Card>
      </div>
    )}
    </>
  );
}



function SidebarItem({ icon: Icon, label, active = false, badge = null }: any) {
  return (
    <button className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${active ? 'bg-white/10 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}`}>
      <div className="flex items-center gap-4">
        <Icon size={18} className={active ? 'text-cyan-400' : 'group-hover:text-zinc-400'} />
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      {badge && (
        <span className="h-5 min-w-[20px] px-1 bg-cyan-500 text-black text-[10px] font-black rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}
