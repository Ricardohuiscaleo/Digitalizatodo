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
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel';




const getIndustryLabels = (industry: string) => {
  switch (industry) {
    case 'school_treasury':
      return { staff: 'Staff', guardians: 'Apoderados', students: 'Alumnos' };
    case 'martial_arts':
      return { staff: 'Staff', guardians: 'Clientes', students: 'Alumnos' };
    case 'health':
    case 'medical':
      return { staff: 'Staff', guardians: 'Pacientes', students: 'Consultas' };
    default:
      return { staff: 'Staff', guardians: 'Titulares', students: 'Estudiantes' };
  }
};


export default function DeepAdminDashboard() {

  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);


  const handleLogout = () => {
    localStorage.removeItem('super_admin_token');
    localStorage.removeItem('admin_user');
    router.push('/login');
  };

  React.useEffect(() => {
    const token = localStorage.getItem('super_admin_token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthorized(true);
      fetchTenants(token);
    }
  }, [router]);

  useRealtimeChannel('admin.global', {
    'tenant.updated': () => {
      const token = localStorage.getItem('super_admin_token');
      if (token) fetchTenants(token);
    }
  }, isAuthorized);



  const fetchTenants = async (token: string) => {
    const data = await getAllTenants(token);
    if (data === null) {
      // Auth Error
      handleLogout();
      return;
    }
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('super_admin_token');
    if (!token || !editingTenant) return;

    const result = await updateTenant(token, editingTenant.id, editingTenant);
    if (result) {
      setShowEditModal(false);
      fetchTenants(token);
    } else {
      alert("Error al actualizar tenant");
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
    { 
      label: "Aceptación T&C", 
      value: tenants.length > 0 ? Math.round((tenants.filter(t => !t.force_terms_acceptance).length / tenants.length) * 100) + "%" : "0%",
      icon: CheckCircle2, 
      trend: "Contratos Firmados", 
      color: "text-emerald-400" 
    },
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
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>

        <div className="relative z-10 flex h-screen overflow-hidden">
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
                <p className="px-4 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">Núcleo Config</p>
              </div>
              <SidebarItem icon={Settings} label="Configuración" />
              <ShieldCheck size={18} className="text-zinc-500 ml-4 inline-block mr-4" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Seguridad</span>
            </nav>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-white/10" />
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate">
                    {typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('admin_user') || '{}')?.name || 'Administrador') : 'Administrador'}
                  </p>
                  <p className="text-[10px] text-cyan-500 font-black uppercase tracking-tighter">Master Access</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-2 text-zinc-400 hover:text-white transition-colors group"
              >
                <span className="text-[10px] font-black uppercase tracking-widest">Desconectar</span>
                <LogOut size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar relative">
            <header className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-4xl font-black tracking-tighter uppercase italic">Gestión de Tenants</h1>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.3em]">Operaciones de Infraestructura</p>
              </div>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-white text-black hover:bg-zinc-200 rounded-2xl px-8 font-black uppercase tracking-widest text-[11px] shadow-[0_0_30px_rgba(255,255,255,0.1)] group"
              >
                <Plus size={16} className="mr-2 group-hover:rotate-90 transition-transform" /> Nueva Instancia
              </Button>
            </header>

            <div className="grid grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <Card key={i} className="bg-zinc-900/40 border-white/5 p-6 space-y-4 relative overflow-hidden group hover:border-white/10 transition-colors">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <stat.icon size={48} className={stat.color} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-4xl font-black tracking-tighter italic">{stat.value}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{stat.trend}</span>
                  </div>
                </Card>
              ))}
            </div>

            <div className="space-y-8">
              <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center bg-zinc-900/50 rounded-full p-1 border border-white/5">
                  <Button 
                    variant={filter === 'all' ? 'default' : 'ghost'} 
                    onClick={() => setFilter('all')}
                    className={`rounded-full uppercase tracking-tighter text-[10px] font-black ${filter === 'all' ? 'bg-white text-black' : 'text-zinc-500'}`}
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
              </div>

              <div className="space-y-4">
                {isLoading ? (
                  <div className="h-64 flex flex-col items-center justify-center space-y-4 grayscale opacity-50">
                    <div className="h-12 w-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest italic">Sincronizando Núcleo...</p>
                  </div>
                ) : filteredTenants.length === 0 ? (
                  <div className="h-64 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center space-y-4">
                    <Globe size={48} className="text-zinc-800" />
                    <div className="text-center">
                      <p className="text-sm font-bold tracking-tight uppercase">No se encontraron tenants</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Verifica la conexión con el servidor API</p>
                    </div>
                  </div>
                ) : (
                  filteredTenants.map((t) => (
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
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">ID: {t.id} &bull; {t.industry || 'N/A'}</p>
                            
                            <div className="h-3 w-px bg-white/10 hidden md:block" />

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-zinc-400">
                                <Users size={10} className="text-blue-400/50" />
                                <span className="text-[9px] font-bold uppercase tracking-tight">
                                  {t.users_count || 0} {getIndustryLabels(t.industry).staff}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-zinc-400">
                                <ShieldCheck size={10} className="text-cyan-400/50" />
                                <span className="text-[9px] font-bold uppercase tracking-tight">
                                  {t.guardians_count || 0} {getIndustryLabels(t.industry).guardians}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-zinc-400">
                                <Activity size={10} className="text-emerald-400/50" />
                                <span className="text-[9px] font-bold uppercase tracking-tight">
                                  {t.students_count || 0} {getIndustryLabels(t.industry).students}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-12">

                        <div className="text-right space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Guardia T&C</p>
                          <div className="flex items-center gap-4 justify-end">
                            <span className={`text-[9px] font-black uppercase ${t.accepted_terms_at ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {t.accepted_terms_at ? 'Firmado' : 'Pendiente'}
                            </span>
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
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-2xl border border-white/5 hover:bg-white/5"
                            onClick={() => {
                              setEditingTenant({...t});
                              setShowEditModal(true);
                            }}
                          >
                            <Settings size={18} className="text-zinc-400" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCreateModal(false)} />
          <Card className="relative w-full max-w-lg bg-zinc-900 border-white/10 p-8 space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
            
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tighter uppercase italic">Nueva Instancia</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Despliegue de Núcleo</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">ID / Slug</label>
                    <input 
                      required
                      placeholder="ej: mi-escuela"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none transition-all"
                      value={newTenant.id}
                      onChange={e => setNewTenant({...newTenant, id: e.target.value.toLowerCase().replace(/ /g, '-')})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Giro / Industria</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none transition-all appearance-none uppercase font-bold"
                      value={newTenant.industry}
                      onChange={e => setNewTenant({...newTenant, industry: e.target.value})}
                    >
                      <option value="martial_arts text-black">Artes Marciales</option>
                      <option value="school_treasury text-black">Colegio</option>
                      <option value="medical text-black">Salud</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Nombre Comercial</label>
                  <input 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none transition-all"
                    value={newTenant.name}
                    onChange={e => setNewTenant({...newTenant, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 mt-4">
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

      {/* Edit Tenant Modal */}
      {showEditModal && editingTenant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowEditModal(false)} />
          <Card className="relative w-full max-w-lg bg-zinc-900 border-white/10 p-8 space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tighter uppercase italic">Configurar Núcleo</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">ID: {editingTenant.id}</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Nombre de la Empresa</label>
                  <input 
                    type="text" 
                    value={editingTenant.name}
                    onChange={(e) => setEditingTenant({...editingTenant, name: e.target.value})}
                    className="w-full bg-black/50 border border-white/5 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-all outline-none"
                    placeholder="Nombre de la empresa"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Industria</label>
                    <select 
                      value={editingTenant.industry}
                      onChange={(e) => setEditingTenant({...editingTenant, industry: e.target.value})}
                      className="w-full bg-black/50 border border-white/5 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-all appearance-none outline-none"
                    >
                      <option value="martial_arts">Artes Marciales</option>
                      <option value="school_treasury">Colegio / Instituto</option>
                      <option value="medical">Clínica / Salud</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Plan SaaS</label>
                    <select 
                      value={editingTenant.saas_plan}
                      onChange={(e) => setEditingTenant({...editingTenant, saas_plan: e.target.value})}
                      className="w-full bg-black/50 border border-white/5 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-all appearance-none outline-none"
                    >
                      <option value="free">Free</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button type="button" variant="ghost" className="flex-1 rounded-2xl border border-white/5 uppercase text-[10px] font-black tracking-widest" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.3)] uppercase text-[10px] font-black tracking-widest text-white">
                  Guardar Cambios
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
