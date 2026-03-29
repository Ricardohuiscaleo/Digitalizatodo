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
  RefreshCcw,
  Zap,
  Target,
  User,
  Mail,
  Shield,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Sun,
  Moon,
  CreditCard,
  ChevronRight,
  Loader2,
  Trash2,
  Edit2
} from 'lucide-react';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { getAllTenants, updateTenant, createTenant, getAllUsers, resetTenantPassword, getAllSaasPlans, updateSaasPlan, syncSaasPlanWithMP } from '@/lib/api';
import { Toaster, toast } from "sonner";
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
  const [view, setView] = useState<'tenants' | 'users' | 'plans'>('tenants');
  const [tenants, setTenants] = useState<any[]>([]);
  const [globalUsers, setGlobalUsers] = useState<any[]>([]);
  const [saasPlans, setSaasPlans] = useState<any[]>([]);
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

  const fetchSaasPlans = async (token: string) => {
    setIsLoading(true);
    console.log('--- fetchSaasPlans triggered ---');
    try {
      const { getAllSaasPlans } = await import('@/lib/api');
      const data = await getAllSaasPlans(token);
      if (data) setSaasPlans(data);
    } catch (err) {
      console.error('Failed to import or fetch SaaS plans:', err);
    }
    setIsLoading(false);
  };

  React.useEffect(() => {
    const token = localStorage.getItem('super_admin_token');
    if (token && isAuthorized) {
        // Fetch essential data for components
        fetchSaasPlans(token);
        
        if (view === 'tenants') fetchTenants(token);
        if (view === 'users') fetchGlobalUsers(token);
    }
  }, [view, isAuthorized]);

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
    admin_name: '', admin_email: '', admin_password: '',
    saas_plan_id: '', saas_plan: '', billing_interval: 'monthly'
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('super_admin_token');
    if (!token) return;

    const result = await createTenant(token, newTenant);
    if (result?.tenant) {
      setShowCreateModal(false);
      fetchTenants(token);
      setNewTenant({ 
        id: '', name: '', industry: 'martial_arts', 
        admin_name: '', admin_email: '', admin_password: '',
        saas_plan_id: '', saas_plan: '', billing_interval: 'monthly'
      });
    } else {
      alert("Error al crear tenant: " + (result?.error || "Verifique los datos"));
    }
  };

  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [newTenantUser, setNewTenantUser] = useState({
    name: '', email: '', password: '', role: 'admin'
  });
  const [isEditingUser, setIsEditingUser] = useState<string | number | null>(null);

  const loadTenantUsers = async (tenantId: string | number) => {
    const token = localStorage.getItem('super_admin_token');
    if (!token) return;
    setIsUsersLoading(true);
    const { getTenantUsers } = await import('@/lib/api');
    const users = await getTenantUsers(token, tenantId);
    setTenantUsers(users);
    setIsUsersLoading(false);
  };

  const handleAddTenantUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('super_admin_token');
    if (!token || !editingTenant) return;

    if (isEditingUser) {
      const { updateTenantUser } = await import('@/lib/api');
      const result = await updateTenantUser(token, editingTenant.id, isEditingUser, {
        name: newTenantUser.name,
        role: newTenantUser.role,
        password: newTenantUser.password || undefined
      });

      if (result?.user) {
        toast.success("Usuario actualizado");
        setIsEditingUser(null);
        setNewTenantUser({ name: '', email: '', password: '', role: 'admin' });
        loadTenantUsers(editingTenant.id);
      } else {
        toast.error(result?.message || "Error al actualizar");
      }
    } else {
      const { addTenantUser } = await import('@/lib/api');
      const result = await addTenantUser(token, editingTenant.id, newTenantUser);
      
      if (result?.user) {
        toast.success("Usuario creado e invitado");
        setNewTenantUser({ name: '', email: '', password: '', role: 'admin' });
        loadTenantUsers(editingTenant.id);
      } else {
        toast.error(result?.message || "Error al crear usuario");
      }
    }
  };

  const handleRemoveTenantUser = async (userId: string | number) => {
    const token = localStorage.getItem('super_admin_token');
    if (!token || !editingTenant) return;
    if (!confirm("¿Seguro de remover este usuario de la academia?")) return;

    const { removeTenantUser } = await import('@/lib/api');
    await removeTenantUser(token, editingTenant.id, userId);
    loadTenantUsers(editingTenant.id);
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
    { label: "Activos", value: tenants.filter(t => t.active).length.toString(), icon: Globe, trend: "Live", color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Pendientes", value: tenants.filter(t => !t.active).length.toString(), icon: Clock, trend: "Review", color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Usuarios", value: tenants.reduce((acc, t) => acc + (t.users_count || 0), 0).toString(), icon: Users, trend: "Synced", color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "Status", value: "OK", icon: Activity, trend: "Online", color: "text-rose-500", bg: "bg-rose-500/10" },
  ];


  const token = typeof window !== 'undefined' ? localStorage.getItem('super_admin_token') : null;

  const handleSyncPlan = async (planId: number | string, interval: 'months' | 'years' = 'months') => {
    if (!token) return;
    const loadingToast = toast.loading(`Sincronizando plan ${interval}...`);
    try {
      const res = await syncSaasPlanWithMP(token, planId, interval);
      toast.dismiss(loadingToast);
      if (res?.mp_id) {
        toast.success(`Plan sincronizado: ${res.mp_id}`, {
          description: "ID de Mercado Pago actualizado exitosamente."
        });
        const updatedPlans = await getAllSaasPlans(token);
        if (updatedPlans) setSaasPlans(updatedPlans);
      } else {
        toast.error("Error de sincronización", {
          description: res?.error || "Verifica las credenciales de Mercado Pago."
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Fallo de red", { description: "No se pudo comunicar con el servidor." });
    }
  };

  const filteredTenants = tenants.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !t.active;
    const matchingPlan = saasPlans.find(p => p.slug === filter);
    if (matchingPlan) return t.saas_plan_id == matchingPlan.id;
    return true;
  });

  return (
    <>
      <Toaster position="top-right" theme={isDarkMode ? 'dark' : 'light'} />
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
              <SidebarItem 
                icon={CreditCard} 
                label="Planes SaaS" 
                active={view === 'plans'} 
                onClick={() => setView('plans')} 
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
            {view === 'tenants' && (
              <div className="px-4 md:px-10 space-y-6 md:space-y-10">
                <div className={`sticky top-0 z-50 -mx-4 md:-mx-10 transition-all duration-500 ease-in-out ${isScrolled ? 'mb-4 bg-background/95 backdrop-blur-md shadow-xl border-b border-border pb-2' : 'mb-6 bg-transparent'}`}>
                  <Card className={`bg-blue-600 border-none shadow-2xl relative overflow-hidden group transition-all duration-700 ease-in-out rounded-t-none ${isScrolled ? 'rounded-b-2xl p-3 md:p-3' : 'rounded-b-[40px] p-4 md:p-8 space-y-4 md:space-y-6 mt-0'}`}>
                    <div className={`absolute top-0 right-10 p-6 opacity-10 group-hover:scale-110 transition-all duration-700 ${isScrolled ? 'hidden' : 'block'}`}>
                      <ShieldCheck size={80} className="text-white" />
                    </div>
                    
                    <div className={`relative z-10 flex items-center justify-between gap-4 transition-all duration-500 ${isScrolled ? 'pt-[calc(var(--sat)+0.5rem)]' : 'pt-[calc(var(--sat)+1.5rem)]'}`}>
                      <div className={`transition-all duration-500 origin-left ${isScrolled ? 'scale-90 translate-y-1' : 'scale-100'}`}>
                        <div className="space-y-0.5">
                          <h1 className={`font-black tracking-tighter uppercase italic text-white leading-none transition-all duration-500 ${isScrolled ? 'text-sm md:text-lg' : 'text-xl md:text-[28px]'}`}>
                            Gestión de Tenants
                          </h1>
                          <p className={`text-blue-100 font-bold uppercase transition-all duration-500 ${isScrolled ? 'text-[7px] md:text-[8px] tracking-[0.2em] opacity-80' : 'text-[8px] md:text-xs tracking-[0.4em] opacity-100'}`}>
                            Operaciones de Infraestructura
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => setShowCreateModal(true)}
                        className={`bg-white text-blue-600 hover:bg-white/90 shadow-xl group border-none transition-all duration-500 flex items-center justify-center shrink-0 
                          ${isScrolled ? 'h-10 w-10 rounded-2xl p-0' : 'rounded-full md:rounded-xl h-10 w-10 md:h-[52px] md:w-[52px] md:px-0 text-[11px]'}`}
                      >
                        <Plus className={`transition-transform duration-500 group-hover:rotate-90 ${isScrolled ? 'w-5 h-5' : 'w-6 h-6'}`} />
                      </Button>
                    </div>

                    {!isScrolled && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 relative z-10 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-1000">
                        {stats.map((stat, i) => (
                          <div key={i} className="flex items-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-3 py-2 md:px-4 md:py-3 gap-2 md:gap-3 group/pill hover:bg-white/10 transition-all">
                            <div className="flex flex-col min-w-0">
                                <span className="text-[7px] md:text-[8px] font-black uppercase text-blue-100 tracking-[0.2em] truncate">{stat.label}</span>
                                <div className="flex items-center gap-1.5 leading-none">
                                  <span className="text-sm md:text-xl font-black text-white">{stat.value}</span>
                                  <span className="text-[6px] md:text-[9px] font-black uppercase text-white/60 tracking-tighter self-end mb-0.5">{stat.trend}</span>
                                </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Smart Filters - Integrated in Sticky for better UX */}
                  <div className={`mt-2 md:mt-4 transition-all duration-500 delay-75 ${isScrolled ? 'px-1' : 'px-4 md:px-0'}`}>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 hide-scrollbar">
                      <Button 
                        variant="ghost" 
                        onClick={() => setFilter('all')}
                        className={`rounded-2xl h-10 px-4 md:px-6 flex items-center gap-2 border transition-all shrink-0 ${filter === 'all' ? 'bg-primary/20 text-primary border-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]' : 'bg-card border-border text-muted-foreground'}`}
                      >
                        <Globe size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">Todos</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        onClick={() => setFilter('pending')}
                        className={`rounded-2xl h-10 px-4 md:px-6 flex items-center gap-2 border transition-all shrink-0 ${filter === 'pending' ? 'bg-amber-500/20 text-amber-500 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'bg-card border-border text-muted-foreground'}`}
                      >
                        <Clock size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">Pendientes</span>
                      </Button>

                      <div className="w-px h-6 bg-border mx-1 shrink-0 self-center" />

                      {saasPlans.map(p => (
                        <Button 
                          key={p.id}
                          variant="ghost" 
                          onClick={() => setFilter(p.slug)}
                          className={`rounded-2xl h-10 px-4 md:px-6 flex items-center gap-2 border transition-all shrink-0 ${filter === p.slug ? 'bg-indigo-500/20 text-indigo-500 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'bg-card border-border text-muted-foreground'}`}
                        >
                          <CreditCard size={12} />
                          <span className="text-[9px] font-black uppercase tracking-widest leading-none">{p.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">

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
                          className={`group bg-zinc-900/80 border-none shadow-xl rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:translate-y-[-2px] transition-all duration-300 ${!t.active ? 'opacity-60 bg-zinc-950/40' : ''}`}
                        >
                          <div className="flex items-start md:items-center gap-4 md:gap-6">
                            <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-black flex items-center justify-center border-none shadow-inner group-hover:scale-105 transition-transform overflow-hidden shrink-0">
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
                                  loadTenantUsers(t.id);
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
            )}

            {view === 'users' && (
              <div className="px-4 md:px-10 space-y-6 md:space-y-10">
                <div className={`sticky top-0 z-50 -mx-4 md:-mx-10 transition-all duration-500 ease-in-out ${isScrolled ? 'mb-4 bg-background/95 backdrop-blur-md shadow-xl border-b border-border pb-2' : 'mb-6 bg-transparent'}`}>
                  <Card className={`bg-blue-600 border-none shadow-2xl relative overflow-hidden group transition-all duration-700 ease-in-out rounded-t-none ${isScrolled ? 'rounded-b-2xl p-3 md:p-3' : 'rounded-b-[40px] p-4 md:p-8 space-y-4 md:space-y-6 mt-0'}`}>
                    <div className={`absolute top-0 right-10 p-6 opacity-10 group-hover:scale-110 transition-all duration-700 ${isScrolled ? 'hidden' : 'block'}`}>
                      <ShieldCheck size={80} className="text-white" />
                    </div>
                    <div className={`relative z-10 flex items-center justify-between gap-4 transition-all duration-500 ${isScrolled ? 'pt-[calc(var(--sat)+0.5rem)]' : 'pt-[calc(var(--sat)+1.5rem)]'}`}>
                      <div className={`transition-all duration-500 origin-left ${isScrolled ? 'scale-90 translate-y-0.5' : 'scale-100'}`}>
                        <div className="space-y-0">
                          <h1 className={`font-black tracking-tighter uppercase italic text-white leading-none transition-all duration-500 ${isScrolled ? 'text-base md:text-lg' : 'text-xl md:text-3xl'}`}>
                            Administradores
                          </h1>
                          {!isScrolled && (
                            <p className="text-blue-100 font-bold uppercase tracking-[0.4em] px-0.5 text-[8px] md:text-xs animate-in fade-in duration-500">
                              Gestión Global de Identidades
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Mobile Card List */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {globalUsers.map((user) => (
                    <div key={user.id} className="bg-zinc-900/80 border-none shadow-xl p-5 rounded-[2.5rem] space-y-4 hover:translate-y-[-2px] transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border" />
                          <div>
                            <p className="text-sm font-bold text-foreground">{user.name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{user.email}</p>
                          </div>
                        </div>
                        <Badge className={user.active ? 'bg-emerald-500/10 text-emerald-500 border-none px-2 py-0.5 text-[8px] font-black' : 'bg-muted text-muted-foreground border-none px-2 py-0.5 text-[8px] font-black'}>
                          {user.active ? 'ACTIVO' : 'SUSPENDIDO'}
                        </Badge>
                      </div>
                      <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Organización</p>
                          <p className="text-[10px] font-black text-primary">{user.tenant?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Slug</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{user.tenant?.slug}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <Card className="bg-card border-border overflow-hidden shadow-xl rounded-[40px] hidden md:block">
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
                            <td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar className="h-8 w-8 border border-border" /><span className="text-sm font-bold text-foreground">{user.name}</span></div></td>
                            <td className="px-6 py-4"><div className="flex flex-col"><span className="text-xs font-bold text-primary">{user.tenant?.name}</span><span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">Slug: {user.tenant?.slug}</span></div></td>
                            <td className="px-6 py-4 text-xs text-muted-foreground font-medium">{user.email}</td>
                            <td className="px-6 py-4"><Badge className={user.active ? 'bg-emerald-500/10 text-emerald-500 border-none px-2 py-0.5 text-[9px]' : 'bg-muted text-muted-foreground border-none px-2 py-0.5 text-[9px]'}>{user.active ? 'ACTIVO' : 'SUSPENDIDO'}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {view === 'plans' && (
              <div className="px-4 md:px-10 space-y-6 md:space-y-10">
                <div className={`sticky top-0 z-50 -mx-4 md:-mx-10 transition-all duration-500 ease-in-out ${isScrolled ? 'mb-4 bg-background/95 backdrop-blur-md shadow-xl border-b border-border pb-2' : 'mb-6 bg-transparent'}`}>
                  <Card className={`bg-blue-600 border-none shadow-2xl relative overflow-hidden group transition-all duration-700 ease-in-out rounded-t-none ${isScrolled ? 'rounded-b-2xl p-3 md:p-3' : 'rounded-b-[40px] p-4 md:p-8 space-y-4 md:space-y-6 mt-0'}`}>
                    <div className={`absolute top-0 right-10 p-6 opacity-10 group-hover:scale-110 transition-all duration-700 ${isScrolled ? 'hidden' : 'block'}`}>
                      <ShieldCheck size={80} className="text-white" />
                    </div>
                    <div className={`relative z-10 flex items-center justify-between gap-4 transition-all duration-500 ${isScrolled ? 'pt-[calc(var(--sat)+0.5rem)]' : 'pt-[calc(var(--sat)+1.5rem)]'}`}>
                      <div className={`transition-all duration-500 origin-left ${isScrolled ? 'scale-90 translate-y-0.5' : 'scale-100'}`}>
                        <div className="space-y-0">
                          <h1 className={`font-black tracking-tighter uppercase italic text-white leading-none transition-all duration-500 ${isScrolled ? 'text-base md:text-lg' : 'text-xl md:text-3xl'}`}>
                            Planes SaaS
                          </h1>
                          {!isScrolled && (
                            <p className="text-blue-100 font-bold uppercase tracking-[0.4em] px-0.5 text-[8px] md:text-xs animate-in fade-in duration-500">
                              Configuración de Suscripciones
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {saasPlans.map((plan) => (
                    <div key={plan.id} className="bg-zinc-900/80 border-none shadow-xl p-8 space-y-8 relative overflow-hidden group rounded-[3rem] hover:translate-y-[-4px] transition-all duration-500">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-all duration-700">
                        <CreditCard size={80} className="text-primary" />
                      </div>
                      <div className="space-y-2 relative z-10">
                        <h3 className="text-2xl font-black uppercase tracking-tight italic text-foreground">{plan.name}</h3>
                        <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black tracking-widest uppercase px-3 py-1">{plan.slug}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="space-y-1 p-4 rounded-[2rem] bg-black shadow-inner border border-white/5">
                          <p className="text-[9px] font-black uppercase text-zinc-500">Mensual</p>
                          <p className="text-2xl font-black tracking-tighter text-foreground">${parseInt(plan.price_monthly).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1 p-4 rounded-[2rem] bg-black shadow-inner border border-white/5">
                          <p className="text-[9px] font-black uppercase text-zinc-500">Anual</p>
                          <p className="text-2xl font-black tracking-tighter text-foreground">${parseInt(plan.price_yearly).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/10 space-y-6 relative z-10">
                        <div className="space-y-2">
                          <p className="text-[9px] font-black uppercase text-primary px-1 tracking-widest">Plan ID Mercado Pago</p>
                          <div className="text-[11px] font-mono font-bold truncate bg-black p-4 rounded-[1.5rem] border border-white/5 text-zinc-400 group-hover:text-foreground transition-colors">
                            {plan.mercadopago_plan_id || 'SIN VINCULAR'}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <Button 
                            onClick={() => handleSyncPlan(plan.id, 'months')}
                            className="bg-zinc-800 text-white hover:bg-blue-600 border-none text-[9px] font-black uppercase tracking-widest rounded-2xl py-6 transition-all shadow-lg"
                          >
                             Sync Mensual
                          </Button>
                          <Button 
                            onClick={() => handleSyncPlan(plan.id, 'years')}
                            className="bg-zinc-800 text-white hover:bg-emerald-600 border-none text-[9px] font-black uppercase tracking-widest rounded-2xl py-6 transition-all shadow-lg"
                          >
                             Sync Anual
                          </Button>
                        </div>
                        
                        <p className="text-[8px] font-bold text-center text-zinc-600 uppercase tracking-tighter">
                          * Sincronizar creará el preapproval_plan en tu cuenta de Mercado Pago
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[999] flex flex-col md:items-center md:justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCreateModal(false)} />
          
          <div className="relative w-full max-w-lg bg-zinc-950 md:bg-card border-t md:border border-border p-6 md:p-8 space-y-6 shadow-2xl overflow-hidden rounded-t-[3rem] md:rounded-[3rem] mt-auto md:mt-0 animate-in slide-in-from-bottom-10 duration-500 max-h-[92vh] flex flex-col">
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-2 md:hidden shrink-0" />
            
            <div className="flex items-center gap-4 shrink-0 pb-2">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Zap className="text-primary" size={24} />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-2xl font-black tracking-tighter uppercase italic text-white leading-tight">Nueva Instancia</h2>
                <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-none">Despliegue de Núcleo DT_</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pr-1 pb-6">
                {/* Sección 1: Identidad Digital */}
                <div className="space-y-5 p-5 rounded-[2.5rem] bg-black shadow-inner border border-white/5">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Target size={12} className="text-primary" />
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Configuración de Dominio</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] px-1">Nombre Público de la Empresa</label>
                      <input 
                        required
                        placeholder="Nombre del Negocio"
                        className="w-full bg-zinc-900 border border-border rounded-2xl px-5 h-16 text-sm focus:border-primary outline-none transition-all text-white font-bold uppercase"
                        value={newTenant.name}
                        onChange={e => {
                          const name = e.target.value;
                          setNewTenant({
                            ...newTenant, 
                            name, 
                            id: name.toLowerCase()
                              .trim()
                              .replace(/[^\w\s-]/g, '')
                              .replace(/[\s_-]+/g, '-')
                              .replace(/^-+|-+$/g, '')
                          });
                        }}
                      />
                    </div>

                      <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] px-1">Planificación Comercial</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] px-1 text-[8px]">Nivel de Plan</label>
                        <select 
                          className="w-full bg-zinc-900 border border-border rounded-2xl px-5 h-16 text-sm focus:border-primary outline-none transition-all appearance-none uppercase font-black text-white"
                          value={newTenant.saas_plan_id || ''}
                          onChange={e => setNewTenant({
                            ...newTenant, 
                            saas_plan_id: e.target.value, 
                            saas_plan: saasPlans.find(p => p.id === e.target.value)?.slug || null
                          })}
                        >
                          <option value="">Plan Gratuito / Base</option>
                          {saasPlans.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] px-1 text-[8px]">Frecuencia</label>
                        <select 
                          className="w-full bg-zinc-900 border border-border rounded-2xl px-5 h-16 text-sm focus:border-primary outline-none transition-all appearance-none uppercase font-black text-white"
                          value={newTenant.billing_interval}
                          onChange={e => setNewTenant({...newTenant, billing_interval: e.target.value})}
                        >
                          <option value="monthly">Mensual</option>
                          <option value="yearly">Anual</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] px-1">Sector Industrial</label>
                    <select 
                      className="w-full bg-zinc-900 border border-border rounded-2xl px-5 h-16 text-sm focus:border-primary outline-none transition-all appearance-none uppercase font-black text-white"
                      value={newTenant.industry}
                      onChange={e => setNewTenant({...newTenant, industry: e.target.value})}
                    >
                      <option value="martial_arts">Artes Marciales</option>
                      <option value="school_treasury">Colegio / Instituto</option>
                      <option value="medical">Salud / Estética</option>
                    </select>
                  </div>
                </div>
              
                {/* Sección 2: Identidad del Dueño */}
                <div className="space-y-5 p-5 rounded-[2.5rem] bg-black shadow-inner border border-white/5">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <User size={12} className="text-primary" />
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Administrador Maestro</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] px-1">Nombre Completo</label>
                      <div className="relative">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                        <input 
                          required
                          className="w-full bg-zinc-900 border border-border rounded-2xl pl-12 pr-5 h-16 text-sm focus:border-primary outline-none transition-all text-white font-bold"
                          value={newTenant.admin_name}
                          onChange={e => setNewTenant({...newTenant, admin_name: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] px-1">E-Mail de Acceso</label>
                      <div className="relative">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                        <input 
                          required
                          type="email"
                          className="w-full bg-zinc-900 border border-border rounded-2xl pl-12 pr-5 h-16 text-sm focus:border-primary outline-none transition-all text-white font-bold"
                          value={newTenant.admin_email}
                          onChange={e => setNewTenant({...newTenant, admin_email: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] px-1">Clave Maestra DT_</label>
                      <div className="relative">
                        <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                        <input 
                          required
                          type="password"
                          className="w-full bg-zinc-900 border border-border rounded-2xl pl-12 pr-5 h-16 text-sm focus:border-primary outline-none transition-all text-white font-bold"
                          value={newTenant.admin_password}
                          onChange={e => setNewTenant({...newTenant, admin_password: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5 pb-[env(safe-area-inset-bottom,1rem)] bg-zinc-950 md:bg-card shrink-0">
                <Button type="button" variant="ghost" className="rounded-2xl border border-border h-16 uppercase text-[10px] font-black tracking-widest text-zinc-500 hover:text-white" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
                <Button type="submit" className="rounded-2xl bg-primary text-primary-foreground h-16 font-black uppercase tracking-widest shadow-2xl shadow-primary/20">
                  Activar Núcleo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}


      {showEditModal && editingTenant && (
        <div className="fixed inset-0 z-[999] flex flex-col md:items-center md:justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowEditModal(false)} />
          
          <div className="relative w-full max-w-lg bg-zinc-950 md:bg-card border-t md:border border-border p-6 md:p-8 space-y-6 shadow-2xl overflow-hidden rounded-t-[2.5rem] md:rounded-[2.5rem] mt-auto md:mt-0 animate-in slide-in-from-bottom-10 duration-500 max-h-[90vh] flex flex-col">
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-2 md:hidden shrink-0" />
            <div className="absolute top-0 inset-x-0 h-1 bg-primary hidden md:block" />
            
            <div className="space-y-1 shrink-0">
              <h2 className="text-2xl font-black tracking-tighter uppercase italic text-white leading-tight">Configurar Núcleo</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none">Identidad: {editingTenant.id}</p>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pr-1 pb-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Nombre Comercial</label>
                    <input 
                      type="text" 
                      value={editingTenant.name}
                      onChange={(e) => setEditingTenant({...editingTenant, name: e.target.value})}
                      className="w-full bg-zinc-900 border border-border rounded-2xl px-4 py-4 text-sm focus:border-primary/50 outline-none transition-all text-white font-bold uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Giro / Industria</label>
                      <select 
                        value={editingTenant.industry}
                        onChange={(e) => setEditingTenant({...editingTenant, industry: e.target.value})}
                        className="w-full bg-zinc-900 border border-border rounded-2xl px-4 py-4 text-sm appearance-none outline-none font-black text-white uppercase"
                      >
                        <option value="martial_arts">Artes Marciales</option>
                        <option value="school_treasury">Colegio / Instituto</option>
                        <option value="medical">Salud / Clínica</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Plan SaaS</label>
                      <select 
                        value={editingTenant.saas_plan_id || ''}
                        onChange={(e) => setEditingTenant({
                          ...editingTenant, 
                          saas_plan_id: e.target.value, 
                          saas_plan: saasPlans.find(p => p.id === e.target.value)?.slug || null
                        })}
                        className="w-full bg-zinc-900 border border-border rounded-2xl px-4 py-4 text-sm appearance-none outline-none font-black text-white uppercase"
                      >
                        <option value="">Plan Gratuito / Base</option>
                        {saasPlans.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Ciclo de Facturación</label>
                    <select 
                      value={editingTenant.billing_interval || 'monthly'}
                      onChange={(e) => setEditingTenant({...editingTenant, billing_interval: e.target.value})}
                      className="w-full bg-zinc-900 border border-border rounded-2xl px-4 py-4 text-sm appearance-none outline-none font-black text-white uppercase"
                    >
                      <option value="monthly">Mensual</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>

                  <div className="pt-6 border-t border-border space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Control de Accesos (RBAC)</p>
                      <p className="text-[8px] text-muted-foreground uppercase tracking-widest px-1 mb-2">Habilite módulos por rol (Owner tiene acceso total)</p>
                    </div>
                    
                    {(['admin', 'coach', 'receptionist', 'instructor'] as const).map(role => {
                      const rolePermissions = editingTenant.role_permissions?.[role] || [];
                      const modules = [
                        'attendance', 'students', 'payments', 'expenses', 'reports', 'settings',
                        'settings.plans', 'settings.schedules', 'settings.payments', 'settings.terms', 'settings.checkin', 'settings.registration'
                      ];
                      const roleLabels: Record<string, string> = { admin: 'Administrador', coach: 'Coach / Sensei', receptionist: 'Recepcionista', instructor: 'Instructor' };
                      
                      return (
                        <div key={role} className="bg-zinc-900 border border-border rounded-2xl p-4 space-y-3">
                          <p className="text-[10px] font-black uppercase text-white tracking-widest">{roleLabels[role]}</p>
                          <div className="flex flex-wrap gap-2">
                            {modules.map(mod => {
                              const isGranted = rolePermissions.includes(mod) || rolePermissions.includes('*');
                              const modLabels: Record<string, string> = { 
                                attendance: 'Asistencia', 
                                students: 'Directorio', 
                                payments: 'Pagos', 
                                expenses: 'Gastos', 
                                reports: 'Reportes', 
                                settings: 'Ajustes (Gral)',
                                'settings.plans': 'Planes',
                                'settings.schedules': 'Horarios',
                                'settings.payments': 'Datos Pago',
                                'settings.terms': 'Términos',
                                'settings.checkin': 'Marcación',
                                'settings.registration': 'Pág. Registro'
                              };
                              return (
                                <button
                                  key={mod}
                                  type="button"
                                  onClick={() => {
                                    const currentRolePerms = [...rolePermissions];
                                    if (isGranted) {
                                      const idx = currentRolePerms.indexOf(mod);
                                      if (idx > -1) currentRolePerms.splice(idx, 1);
                                      // Remove * if resolving individually
                                      const starIdx = currentRolePerms.indexOf('*');
                                      if (starIdx > -1) currentRolePerms.splice(starIdx, 1);
                                    } else {
                                      currentRolePerms.push(mod);
                                    }
                                    setEditingTenant({
                                      ...editingTenant,
                                      role_permissions: {
                                        ...(editingTenant.role_permissions || {}),
                                        [role]: currentRolePerms
                                      }
                                    });
                                  }}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${isGranted ? 'bg-primary/20 text-primary border-primary/50' : 'bg-zinc-950 text-zinc-500 border-border hover:border-zinc-700'}`}
                                >
                                  {isGranted ? '✓' : ''} {modLabels[mod]}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-6 border-t border-border space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Usuarios de la Academia</p>
                        <Users size={14} className="text-zinc-500" />
                      </div>

                      {/* Lista de Usuarios */}
                      <div className="space-y-2">
                        {isUsersLoading ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="animate-spin text-zinc-500" size={16} />
                          </div>
                        ) : tenantUsers.length === 0 ? (
                          <p className="text-[10px] text-zinc-500 text-center py-2 uppercase font-bold italic">Sin usuarios adicionales</p>
                        ) : (
                          tenantUsers.map((u: any) => (
                            <div key={u.id} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950 border border-zinc-900 group">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-[10px] font-black uppercase text-zinc-400 border border-zinc-800">
                                  {u.name?.[0] || 'U'}
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-zinc-100 uppercase tracking-tighter leading-none">{u.name}</p>
                                  <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{u.email} • {u.role}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setIsEditingUser(u.id);
                                    setNewTenantUser({ name: u.name, email: u.email, password: '', role: u.role });
                                  }}
                                  className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-lg transition-all"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleRemoveTenantUser(u.id)}
                                  className="p-2 hover:bg-rose-500/10 text-rose-500/50 hover:text-rose-500 rounded-lg transition-all"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Formulario Añadir/Editar Usuario */}
                      {(() => {
                        return (
                          <div className="bg-zinc-950/50 rounded-3xl p-4 border border-zinc-900 space-y-4">
                            <div className="flex items-center justify-between px-1">
                              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                {isEditingUser ? 'Editar Usuario' : 'Invitar Usuario Nuevo'}
                              </p>
                              {isEditingUser && (
                                <button 
                                  onClick={() => {
                                    setIsEditingUser(null);
                                    setNewTenantUser({ name: '', email: '', password: '', role: 'admin' });
                                  }}
                                  className="text-[8px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <input 
                                type="text" 
                                placeholder="NOMBRE"
                                value={newTenantUser.name}
                                onChange={e => setNewTenantUser({...newTenantUser, name: e.target.value})}
                                className="bg-black border border-zinc-800 rounded-xl px-3 py-2 text-[10px] font-bold text-zinc-300 placeholder:text-zinc-600 focus:border-primary outline-none transition-colors"
                              />
                              <input 
                                type="email" 
                                placeholder="EMAIL"
                                disabled={!!isEditingUser}
                                value={newTenantUser.email}
                                onChange={e => setNewTenantUser({...newTenantUser, email: e.target.value})}
                                className={`bg-black border border-zinc-800 rounded-xl px-3 py-2 text-[10px] font-bold text-zinc-300 placeholder:text-zinc-600 focus:border-primary outline-none transition-colors ${isEditingUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                              />
                              <div className="relative flex items-center col-span-2">
                                <input 
                                  type="text" 
                                  placeholder={isEditingUser ? "NUEVA CLAVE (OPCIONAL)" : "CLAVE"}
                                  value={newTenantUser.password}
                                  onChange={e => setNewTenantUser({...newTenantUser, password: e.target.value})}
                                  className="w-full bg-black border border-zinc-800 rounded-xl pl-3 pr-12 py-2.5 text-[10px] font-bold text-zinc-300 placeholder:text-zinc-600 focus:border-primary outline-none transition-colors"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                                    const gen = (len: number) => {
                                      const array = new Uint8Array(len);
                                      window.crypto.getRandomValues(array);
                                      return Array.from(array, (byte) => chars[byte % chars.length]).join('');
                                    };
                                    const pass = `${gen(6)}-${gen(6)}-${gen(6)}`;
                                    setNewTenantUser(prev => ({ ...prev, password: pass }));
                                  }}
                                  className="absolute right-1.5 w-8 h-8 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-black flex items-center justify-center transition-all border border-primary/20"
                                  title="Sugerir Clave Segura"
                                >
                                  <Zap size={14} className="fill-current" />
                                </button>
                              </div>
                              <select 
                                value={newTenantUser.role}
                                onChange={e => setNewTenantUser({...newTenantUser, role: e.target.value})}
                                className="col-span-2 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-[10px] font-bold text-zinc-300 focus:border-primary outline-none transition-colors appearance-none"
                              >
                                <option value="owner">Dueño</option>
                                <option value="admin">Administrador</option>
                                <option value="coach">Coach / Instructor</option>
                                <option value="instructor">Instructor</option>
                                <option value="receptionist">Recepcionista</option>
                              </select>
                            </div>
                            <Button 
                              type="button"
                              onClick={handleAddTenantUser}
                              disabled={!newTenantUser.name || (!isEditingUser && (!newTenantUser.email || !newTenantUser.password))}
                              className="w-full h-10 rounded-2xl text-[9px] font-black uppercase tracking-widest"
                            >
                              {isEditingUser ? 'Guardar Cambios' : 'Crear e Invitar'}
                            </Button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border space-y-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Acciones Críticas</p>
                      <Button 
                        onClick={async () => {
                          const token = localStorage.getItem('super_admin_token');
                          if (!token || !editingTenant) return;
                          if (!confirm('¿Estás seguro de resetear la clave?')) return;
                          const data = await resetTenantPassword(token, editingTenant.id);
                          if (data?.new_password) {
                            alert(`Nueva clave: ${data.new_password}`);
                          }
                        }}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl py-7 border border-white/5 shadow-lg"
                      >
                        <Lock size={14} className="mr-2 text-primary" /> Generar Nueva Clave DT_
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5 pb-[env(safe-area-inset-bottom,1rem)] bg-zinc-950 md:bg-card shrink-0">
                <Button type="button" variant="ghost" className="rounded-2xl border border-border h-14 uppercase text-[10px] font-black tracking-widest text-zinc-400" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground h-14 font-black uppercase tracking-widest rounded-2xl shadow-xl">
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Mobile Only */}
      <div 
        className={`fixed bottom-0 inset-x-0 z-[100] px-6 pointer-events-none md:hidden transition-all duration-500 ${showCreateModal || showEditModal ? 'opacity-0 translate-y-20' : 'opacity-100 translate-y-0'}`}
        style={{ paddingBottom: 'max(1.2rem, env(safe-area-inset-bottom, 1.2rem))' }}
      >
        <nav 
          style={{ height: '3.5rem' }}
          className="mx-auto w-full max-w-[400px] bg-card/80 backdrop-blur-xl border border-border rounded-full shadow-2xl flex items-center justify-around px-2 pointer-events-auto"
        >
          <button 
            onClick={() => setView('tenants')}
            className={`flex flex-col items-center justify-center gap-0.5 w-12 h-10 rounded-2xl transition-all ${view === 'tenants' ? 'bg-muted/80 text-foreground ring-1 ring-border shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            <Globe size={16} />
            <span className="text-[7px] font-black uppercase tracking-widest">Tenants</span>
          </button>
          
          <button 
            onClick={() => setView('users')}
            className={`flex flex-col items-center justify-center gap-0.5 w-12 h-10 rounded-2xl transition-all ${view === 'users' ? 'bg-muted/80 text-foreground ring-1 ring-border shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            <Users size={16} />
            <span className="text-[7px] font-black uppercase tracking-widest">Usuarios</span>
          </button>

          <button 
            onClick={() => setView('plans')}
            className={`flex flex-col items-center justify-center gap-0.5 w-12 h-10 rounded-2xl transition-all ${view === 'plans' ? 'bg-muted/80 text-foreground ring-1 ring-border shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            <CreditCard size={16} />
            <span className="text-[7px] font-black uppercase tracking-widest">Planes</span>
          </button>

          <button 
            onClick={toggleTheme}
            className={`flex flex-col items-center justify-center gap-0.5 w-12 h-10 rounded-2xl transition-all text-muted-foreground hover:bg-muted/50`}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            <span className="text-[7px] font-black uppercase tracking-widest">{isDarkMode ? 'Día' : 'Noche'}</span>
          </button>
        </nav>
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

