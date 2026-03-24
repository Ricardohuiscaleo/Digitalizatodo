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
  Activity,
  Sun,
  Moon
} from 'lucide-react';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { getAllTenants, updateTenant, createTenant, getAllUsers, resetTenantPassword } from '@/lib/api';

import { useRealtimeChannel } from '@/hooks/useRealtimeChannel';




const getIndustryLabels = (industry: string) => {
  switch (industry) {
    case 'school_treasury':
      return { staff: 'Staff', guardians: 'Apoderados', students: 'Alumnos' };
    case 'martial_arts':
      return { staff: 'Staff', guardians: 'Titulares', students: 'Alumnos' };

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
  const [view, setView] = useState<'tenants' | 'users'>('tenants');
  const [tenants, setTenants] = useState<any[]>([]);
  const [globalUsers, setGlobalUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);





  const handleLogout = () => {
    localStorage.removeItem('super_admin_token');
    localStorage.removeItem('admin_user');
    router.push('/login');
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('admin_theme', newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('admin_theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);


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
    console.log('Tenants received from API:', data);
    setTenants(data);
    setIsLoading(false);
  };

  const fetchGlobalUsers = async (token: string) => {
    setIsLoading(true);
    const data = await getAllUsers(token);
    if (data) setGlobalUsers(data);
    setIsLoading(false);
  };

  React.useEffect(() => {
    const token = localStorage.getItem('super_admin_token');
    if (token) {
        if (view === 'tenants') fetchTenants(token);
        if (view === 'users') fetchGlobalUsers(token);
    }
  }, [view]);

  React.useEffect(() => {
    // Wait for the container to be available after isAuthorized becomes true
    const interval = setInterval(() => {
      const container = scrollContainerRef.current;
      if (container) {
        const handleScroll = () => {
          setIsScrolled(container.scrollTop > 10);
        };
        container.addEventListener('scroll', handleScroll);
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isAuthorized]);




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
    { label: "Tenants", value: tenants.filter(t => t.active).length.toString(), icon: Globe, trend: "Live", color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Admins", value: tenants.reduce((acc, t) => acc + (t.users_count || 0), 0).toString(), icon: Users, trend: "Synced", color: "text-amber-500", bg: "bg-amber-500/10" },
    { 
      label: "T&C", 
      value: tenants.length > 0 ? Math.round((tenants.filter(t => !t.force_terms_acceptance).length / tenants.length) * 100) + "%" : "0%",
      icon: CheckCircle2, 
      trend: "Signed", 
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    { label: "Status", value: "OK", icon: Activity, trend: "Online", color: "text-rose-500", bg: "bg-rose-500/10" },
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
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans transition-colors duration-500">

        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>

        <div className="relative z-10 flex h-screen overflow-hidden">
          <aside className="w-72 border-r border-border bg-card backdrop-blur-xl hidden md:flex flex-col p-6 space-y-8">


            <div className="flex items-center gap-3 px-2">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                <ShieldCheck className="text-primary-foreground" size={24} />
              </div>
              <div>
                <h2 className="font-black uppercase tracking-tighter text-sm">Engine Admin</h2>

                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Control Center</p>
              </div>
            </div>

            <nav className="flex-1 space-y-1">
              <SidebarItem 
                icon={Globe} 
                label="Tenants" 
                active={view === 'tenants'} 
                onClick={() => setView('tenants')} 
              />
              <SidebarItem 
                icon={Users} 
                label="Usuarios" 
                active={view === 'users'} 
                onClick={() => setView('users')} 
              />

              <div className="pt-8 pb-4">
                <p className="px-4 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Preferencia</p>
              </div>
              <SidebarItem 
                icon={isDarkMode ? Sun : Moon} 
                label={isDarkMode ? "Modo Día" : "Modo Noche"} 
                onClick={toggleTheme} 
              />
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

          <main 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto custom-scrollbar relative pb-32 md:pb-10"
          >
            {view === 'tenants' ? (
              <div className="px-4 md:px-10 space-y-6 md:space-y-10">
                <div className={`sticky top-0 z-50 -mx-[14px] md:-mx-10 transition-all duration-500 ease-in-out ${isScrolled ? 'pt-0 mb-4' : 'mb-6 pt-0'}`}>
                  <Card className={`bg-blue-600 border-none shadow-2xl relative overflow-hidden group transition-all duration-700 ease-in-out ${isScrolled ? 'rounded-t-none rounded-b-2xl p-3 md:p-4' : 'rounded-t-none rounded-b-[40px] p-4 md:p-8 space-y-4 md:space-y-6 mt-0'}`}>
                    <div className={`absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-all duration-700 ${isScrolled ? 'scale-0' : ''}`}>
                      <ShieldCheck size={80} className="text-white" />
                    </div>
                    
                    <div className={`relative z-10 flex items-center justify-between gap-4 pt-[calc(var(--sat)+1.5rem)]`}>
                      <div className={`transition-all duration-500 ${isScrolled ? 'scale-100' : ''}`}>
                        <div className="space-y-0">
                          <h1 className={`font-black tracking-tighter uppercase italic text-white leading-none transition-all duration-500 ${isScrolled ? 'text-base md:text-lg' : 'text-xl md:text-3xl'}`}>
                            Gestión de Tenants
                          </h1>
                          {!isScrolled && (
                            <p className="text-blue-100 font-bold uppercase tracking-[0.4em] px-0.5 text-[8px] md:text-xs animate-in fade-in duration-500">
                              Operaciones de Infraestructura
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => setShowCreateModal(true)}
                        className={`bg-white text-blue-600 hover:bg-white/90 shadow-xl group border-none transition-all duration-500 flex items-center justify-center shrink-0 
                          ${isScrolled ? 'h-8 w-8 md:h-10 md:w-10 rounded-full p-0' : 'rounded-full md:rounded-xl h-10 w-10 md:h-auto md:w-auto p-0 md:px-4 md:py-6 md:font-black md:uppercase md:tracking-widest text-[9px] md:text-[11px]'}`}
                      >
                        <Plus className={`transition-transform duration-500 group-hover:rotate-90 ${isScrolled ? 'w-5 h-5' : 'w-5 h-5 md:w-4 md:h-4 md:mr-2'}`} />
                        {!isScrolled && <span className="hidden md:inline">Nueva Instancia</span>}
                      </Button>
                    </div>

                    {!isScrolled && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 relative z-10 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-1000">
                        {stats.map((stat, i) => (
                          <div key={i} className="flex items-center bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 md:px-4 md:py-3 gap-2 md:gap-3 group/pill hover:bg-white/10 transition-all">
                            <div className={`p-1.5 md:p-2 rounded-lg bg-white/10 ${stat.color}`}>
                              <stat.icon size={14} className="text-white md:w-4 md:h-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[7px] md:text-[8px] font-black uppercase text-blue-100 tracking-[0.1em] truncate">{stat.label}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm md:text-xl font-black text-white leading-none">{stat.value}</span>
                                <Badge className="bg-white/10 text-white hover:bg-white/10 border-none text-[6px] md:text-[8px] font-bold px-1 py-0 h-3 md:h-4">
                                  {stat.trend}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center justify-between gap-4 border-b border-border pb-4 px-1">
                    <div className="flex items-center bg-muted rounded-full p-1 border border-border">
                      <Button 
                        variant={filter === 'all' ? 'default' : 'ghost'} 
                        onClick={() => setFilter('all')}
                        className={`rounded-full uppercase tracking-tighter text-[10px] font-black ${filter === 'all' ? 'bg-white text-black shadow-sm' : 'text-zinc-500'}`}
                      >
                        Todos
                      </Button>
                      <Button 
                        variant={filter === 'pending' ? 'default' : 'ghost'} 
                        onClick={() => setFilter('pending')}
                        className={`rounded-full uppercase tracking-tighter text-[10px] font-black ${filter === 'pending' ? 'bg-amber-500 text-white' : 'text-zinc-500'}`}
                      >
                        Pendientes
                      </Button>
                      <div className="h-4 w-px bg-border mx-2" />
                      <Button 
                        variant={filter === 'pro' ? 'default' : 'ghost'} 
                        onClick={() => setFilter('pro')}
                        className={`rounded-full uppercase tracking-tighter text-[10px] font-black ${filter === 'pro' ? 'bg-indigo-500 text-white text-white' : 'text-muted-foreground'}`}
                      >
                        Pro
                      </Button>
                      <Button 
                        variant={filter === 'enterprise' ? 'default' : 'ghost'} 
                        onClick={() => setFilter('enterprise')}
                        className={`rounded-full uppercase tracking-tighter text-[10px] font-black ${filter === 'enterprise' ? 'bg-emerald-500 text-white text-white' : 'text-muted-foreground'}`}
                      >
                        Enterprise
                      </Button>
                    </div>

                  </div>

                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="h-64 flex flex-col items-center justify-center space-y-4 opacity-50">
                        <div className="h-12 w-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest italic text-foreground">Sincronizando Núcleo...</p>
                      </div>
                    ) : filteredTenants.length === 0 ? (
                      <div className="h-64 border-2 border-dashed border-border rounded-[40px] flex flex-col items-center justify-center space-y-4">
                        <Globe size={48} className="text-muted" />
                        <div className="text-center">
                          <p className="text-sm font-bold tracking-tight uppercase text-foreground">No se encontraron tenants</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Verifica la conexión con el servidor API</p>
                        </div>
                      </div>
                    ) : (
                      filteredTenants.map((t) => (
                        <div 
                          key={t.id} 
                          className={`group bg-card border border-border rounded-3xl p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-muted/50 transition-all backdrop-blur-sm ${!t.active ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-start md:items-center gap-4 md:gap-6">
                            <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-muted flex items-center justify-center border border-border group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                              {t.logo ? (
                                <img src={t.logo} alt={t.name} className="w-full h-full object-cover" />
                              ) : (
                                <Globe className={`group-hover:text-primary ${t.active ? 'text-muted-foreground' : 'text-zinc-600'}`} size={20} />
                              )}
                            </div>

                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                <h3 className="font-bold text-base md:text-lg tracking-tight truncate text-foreground">{t.name}</h3>
                                <Badge 
                                  onClick={() => handleToggleActive(t.id, t.active)}
                                  className={`cursor-pointer transition-all border-none text-[9px] px-2 py-0.5 ${t.active ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                                >
                                  {t.active ? 'ACTIVO' : 'INACTIVO'}
                                </Badge>
                                <Badge variant="outline" className="border-border text-muted-foreground uppercase text-[8px] md:text-[9px]">PLAN {t.saas_plan || 'FREE'}</Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 md:gap-x-4 gap-y-1">
                                <p className="text-[9px] md:text-[10px] font-medium text-muted-foreground uppercase tracking-widest">ID: {t.id} &bull; {t.industry || 'N/A'}</p>
                                
                                <div className="h-3 w-px bg-border hidden md:block" />

                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Users size={10} className="text-primary/50" />
                                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-tight">{t.users_count || 0} {getIndustryLabels(t.industry).staff}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <ShieldCheck size={10} className="text-primary/50" />
                                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-tight">{t.guardians_count || 0} {getIndustryLabels(t.industry).guardians}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Activity size={10} className="text-primary/50" />
                                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-tight">{t.students_count || 0} {getIndustryLabels(t.industry).students}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-row md:flex-row items-center justify-between md:justify-end gap-4 md:gap-12 pt-4 md:pt-0 border-t md:border-t-0 border-border md:border-none">
                            <div className="text-left md:text-right space-y-1">
                              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Guardia T&C</p>
                              <div className="flex items-center gap-3 md:gap-4 md:justify-end">
                                <span className={`text-[8px] md:text-[9px] font-black uppercase ${t.accepted_terms_at ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {t.accepted_terms_at ? 'Firmado' : 'Pendiente'}
                                </span>
                                <button 
                                  onClick={() => handleToggleForceTerms(t.id, t.force_terms_acceptance)}
                                  className={`h-8 w-14 md:h-11 md:w-20 rounded-full border relative transition-all duration-500 overflow-hidden ${t.force_terms_acceptance ? 'bg-primary/10 border-primary/50' : 'bg-muted border-border'}`}
                                >
                                  <div className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center h-6 w-6 md:h-8 md:w-8 rounded-full transition-all duration-500 ${t.force_terms_acceptance ? 'left-7 md:left-11 bg-primary' : 'left-1 bg-muted-foreground/50'}`}>
                                    {t.force_terms_acceptance ? <Lock size={12} className="text-primary-foreground" /> : <Unlock size={12} className="text-muted" />}
                                  </div>
                                </button>
                              </div>
                            </div>

                            <div className="flex gap-2 shrink-0">
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-border hover:bg-muted" onClick={() => window.open(`https://${t.id}.digitalizatodo.cl`, '_blank')}>
                                <ExternalLink size={16} className="text-muted-foreground" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 rounded-xl border border-border hover:bg-muted"
                                onClick={() => {
                                  setEditingTenant({...t});
                                  setShowEditModal(true);
                                }}
                              >
                                <Settings size={16} className="text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="space-y-1">
                    <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase italic text-foreground">
                      Administradores Globales
                    </h1>
                    <p className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase tracking-[0.3em]">
                      Control de Identidades SaaS
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleTheme}
                    className="rounded-2xl h-12 w-12 bg-card border border-border text-primary md:hidden"
                  >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </Button>
                </header>

                <Card className="bg-card border-border overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Administrador</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Organización</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {globalUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 border border-border" />
                                <span className="text-sm font-bold text-foreground">{user.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-primary">{user.tenant?.name}</span>
                                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">Slug: {user.tenant?.slug}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-muted-foreground font-medium">{user.email}</td>
                            <td className="px-6 py-4">
                              <Badge className={user.active ? 'bg-emerald-500/10 text-emerald-500 border-none px-2 py-0.5 text-[9px]' : 'bg-muted text-muted-foreground border-none px-2 py-0.5 text-[9px]'}>
                                {user.active ? 'DISPONIBLE' : 'SUSPENDIDO'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

          </main>
        </div>



      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/80" onClick={() => setShowCreateModal(false)} />
          <Card className="relative w-full max-w-lg bg-card border-border p-8 space-y-6 shadow-2xl overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
            
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tighter uppercase italic">Nueva Instancia</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Despliegue de Núcleo</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">ID / Slug</label>

                    <input 
                      required
                      placeholder="ej: mi-escuela"
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-all"
                      value={newTenant.id}
                      onChange={e => setNewTenant({...newTenant, id: e.target.value.toLowerCase().replace(/ /g, '-')})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Giro / Industria</label>
                    <select 
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-all appearance-none uppercase font-bold"
                      value={newTenant.industry}
                      onChange={e => setNewTenant({...newTenant, industry: e.target.value})}
                    >
                      <option value="martial_arts" className="text-black">Artes Marciales</option>
                      <option value="school_treasury" className="text-black">Colegio</option>
                      <option value="medical" className="text-black">Salud</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Nombre Comercial</label>
                  <input 
                    required
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-all"
                    value={newTenant.name}
                    onChange={e => setNewTenant({...newTenant, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border mt-4">
                  <div className="space-y-1.5">

                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Nombre Admin</label>
                    <input 
                      required
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-all"
                      value={newTenant.admin_name}
                      onChange={e => setNewTenant({...newTenant, admin_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Email Maestro</label>
                    <input 
                      required
                      type="email"
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-all"
                      value={newTenant.admin_email}
                      onChange={e => setNewTenant({...newTenant, admin_email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Clave de Acceso</label>
                  <input 
                    required
                    type="password"
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary/50 outline-none transition-all"
                    value={newTenant.admin_password}
                    onChange={e => setNewTenant({...newTenant, admin_password: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button type="button" variant="ghost" className="flex-1 rounded-xl" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest">
                  Crear Instancia
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}


      {showEditModal && editingTenant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md dark:bg-black/80" onClick={() => setShowEditModal(false)} />
          <Card className="relative w-full max-w-lg bg-card border-border p-8 space-y-6 shadow-2xl overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tighter uppercase italic text-foreground">Configurar Núcleo</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">ID: {editingTenant.id}</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre de la Empresa</label>
                  <input 
                    type="text" 
                    value={editingTenant.name}
                    onChange={(e) => setEditingTenant({...editingTenant, name: e.target.value})}
                    className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Giro / Industria</label>

                    <select 
                      value={editingTenant.industry}
                      onChange={(e) => setEditingTenant({...editingTenant, industry: e.target.value})}
                      className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3 text-sm appearance-none outline-none font-bold"
                    >
                      <option value="martial_arts" className="text-black">Artes Marciales</option>
                      <option value="school_treasury" className="text-black">Colegio / Instituto</option>
                      <option value="medical" className="text-black">Salud / Clínica</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Plan SaaS</label>
                    <select 
                      value={editingTenant.saas_plan}
                      onChange={(e) => setEditingTenant({...editingTenant, saas_plan: e.target.value})}
                      className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3 text-sm appearance-none outline-none font-bold"
                    >
                      <option value="starter" className="text-black">Starter</option>
                      <option value="pro" className="text-black">Pro</option>
                      <option value="enterprise" className="text-black">Enterprise</option>
                    </select>
                  </div>
                </div>

                {/* Admin Owner Section */}
                <div className="pt-4 border-t border-border space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Identidad del Dueño</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 opacity-70">
                      <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Administrador</label>

                      <div className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-xs">
                        {editingTenant.users?.[0]?.name || 'No asignado'}
                      </div>
                    </div>
                    <div className="space-y-1.5 opacity-70">
                      <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Email Maestro</label>
                      <div className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-xs truncate">
                        {editingTenant.users?.[0]?.email || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="button"
                    onClick={async () => {
                      const token = localStorage.getItem('super_admin_token');
                      if (!token) return;
                      if (confirm('¿Emitir nueva clave segura para este tenant?')) {
                        const res = await resetTenantPassword(token, editingTenant.id);
                        if (res?.new_password) {
                          alert(`NUEVA CLAVE GENERADA:\n\n${res.new_password}\n\nCópiala ahora, no se volverá a mostrar.`);
                        }
                      }
                    }}
                    className="w-full bg-muted hover:bg-muted/80 text-[10px] font-black uppercase tracking-widest rounded-xl py-6 border border-border"
                  >
                    <Lock size={14} className="mr-2 text-primary" /> Generar Nueva Clave DT_
                  </Button>
                </div>
              </div>


              <div className="pt-4 flex gap-3">
                <Button type="button" variant="ghost" className="flex-1 rounded-2xl border border-border uppercase text-[10px] font-black tracking-widest" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:opacity-90 rounded-2xl shadow-lg uppercase text-[10px] font-black tracking-widest">
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Bottom Navigation - Mobile Only */}
      <div className="fixed bottom-0 inset-x-0 z-[100] pb-[calc(1.5rem+var(--sab))] px-6 pointer-events-none md:hidden transition-all duration-500">
        <nav 
          style={{ height: 'calc(5rem + var(--sab))' }}
          className="mx-auto w-full max-w-[400px] bg-card/80 backdrop-blur-xl border border-border rounded-[2.5rem] shadow-2xl flex items-center justify-around px-2 pointer-events-auto"
        >
          <button 
            onClick={() => setView('tenants')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 h-16 rounded-3xl transition-all ${view === 'tenants' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Globe size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Tenants</span>
          </button>
          <button 
            onClick={() => setView('users')}
            className={`flex flex-col items-center justify-center gap-1.5 w-16 h-16 rounded-3xl transition-all ${view === 'users' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Users size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Global</span>
          </button>
          <div className="w-16 h-16 flex items-center justify-center">
            <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center text-primary animate-pulse border border-border">
              <Activity size={18} />
            </div>
          </div>
          <button className="flex flex-col items-center justify-center gap-1.5 w-16 h-16 rounded-3xl text-muted-foreground hover:bg-muted">
            <Settings size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Panel</span>
          </button>
        </nav>
      </div>

      </div>
    </>
  );
}



function SidebarItem({ icon: Icon, label, active = false, badge = null, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>
      <div className="flex items-center gap-4">
        <Icon size={18} className={active ? 'text-primary' : 'group-hover:text-primary'} />
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      {badge && (
        <span className="h-5 min-w-[20px] px-1 bg-primary text-primary-foreground text-[10px] font-black rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

