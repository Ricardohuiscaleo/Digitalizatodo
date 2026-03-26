"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRegistrationPage } from "@/lib/api";
import { Loader2, ArrowLeft, ShieldCheck, FileText, BadgeCheck, Fingerprint, Calendar, Sun, Moon } from "lucide-react";

export default function TermsPage() {
  const { code } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getRegistrationPage(code as string);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [code]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-700 ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}>
        <Loader2 className={`animate-spin ${isDarkMode ? 'text-[#c9a84c]' : 'text-amber-600'}`} size={32} />
      </div>
    );
  }

  const termsData = data?.terms;
  let parsedTerms: any[] = [];
  
  if (termsData?.content) {
    try {
      parsedTerms = typeof termsData.content === 'string' ? JSON.parse(termsData.content) : termsData.content;
    } catch (e) {
      console.error("Error parsing terms:", e);
    }
  }

  const formatMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, `<strong class="${isDarkMode ? 'text-white' : 'text-black'} font-black">$1</strong>`)
      .replace(/\*(.*?)\*/g, `<em class="${isDarkMode ? 'text-[#c9a84c]/80' : 'text-amber-700/80'} italic">$1</em>`);
  };

  return (
    <div className={`min-h-screen transition-colors duration-700 font-sans ${isDarkMode ? 'bg-black text-white selection:bg-[#c9a84c]/30' : 'bg-zinc-50 text-zinc-900 selection:bg-amber-200'}`}>
      
      {/* HEADER PREMIUM */}
      <div className={`fixed top-0 left-0 right-0 h-20 backdrop-blur-xl border-b z-50 flex items-center justify-between px-6 transition-all duration-700 ${isDarkMode ? 'bg-black/80 border-white/5' : 'bg-white/80 border-zinc-200 shadow-sm'}`}>
        <button 
          onClick={() => router.back()}
          className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all hover:scale-105 active:scale-95 group ${isDarkMode ? 'bg-zinc-900 border-white/5 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-zinc-50 shadow-sm'}`}
        >
          <ArrowLeft size={20} className={`${isDarkMode ? 'text-zinc-500 group-hover:text-white' : 'text-zinc-400 group-hover:text-zinc-900'} transition-colors`} />
        </button>

        <div className="flex flex-col items-center">
          <span className={`text-[9px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-[#c9a84c]' : 'text-amber-600'}`}>Centro de Transparencia</span>
          <span className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? 'text-[#c9a84c]/50' : 'text-amber-600/50'}`}>{data?.name}</span>
        </div>

        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all hover:scale-105 active:scale-95 relative overflow-hidden group ${isDarkMode ? 'bg-zinc-900 border-white/5 hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:bg-zinc-50 shadow-sm'}`}
        >
          <div className={`absolute inset-0 transition-all duration-700 flex items-center justify-center ${isDarkMode ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
            <Moon size={20} className="text-[#c9a84c]" />
          </div>
          <div className={`absolute inset-0 transition-all duration-700 flex items-center justify-center ${isDarkMode ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
            <Sun size={20} className="text-amber-500" />
          </div>
        </button>
      </div>

      <main className="max-w-3xl mx-auto pt-32 pb-32 px-6">
        {/* TITULO DE SECCION */}
        <div className="flex items-center gap-6 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
           <div className={`w-16 h-16 rounded-3xl border flex items-center justify-center transition-all duration-700 ${isDarkMode ? 'bg-[#c9a84c]/10 border-[#c9a84c]/20 shadow-[0_0_30px_rgba(201,168,76,0.1)]' : 'bg-amber-50 border-amber-100 shadow-sm'}`}>
              <ShieldCheck className={isDarkMode ? 'text-[#c9a84c]' : 'text-amber-600'} size={32} />
           </div>
           <div>
              <h1 className={`text-3xl font-black uppercase tracking-tighter leading-none mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Aspectos Legales</h1>
              <div className="flex items-center gap-3">
                <p className={`text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  <Calendar size={12} className={isDarkMode ? 'text-zinc-700' : 'text-zinc-300'} />
                  Actualizado: {termsData?.updated_at ? new Date(termsData.updated_at).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }).toUpperCase() : 'MARZO 2026'}
                </p>
                <div className={`w-1 h-1 rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                <p className={`text-[10px] uppercase font-black tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>VERSIÓN {termsData?.version || '3.5'}</p>
              </div>
           </div>
        </div>

        {/* CONTENIDO FORMATEADO */}
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
          {parsedTerms.length > 0 ? (
            parsedTerms.map((section: any, i: number) => (
              <div key={i} className="group transition-all">
                {section.title && section.title !== "ENCABEZADO / VERSIÓN" && (
                   <h2 className={`text-[11px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-3 ${isDarkMode ? 'text-[#c9a84c]' : 'text-amber-700'}`}>
                      <div className={`w-6 h-[1px] ${isDarkMode ? 'bg-[#c9a84c]/30' : 'bg-amber-200'}`} />
                      {section.title}
                   </h2>
                )}
                <div className={`text-[13px] leading-relaxed font-medium whitespace-pre-wrap transition-all duration-700 ${
                  section.title === "ENCABEZADO / VERSIÓN" 
                    ? (isDarkMode ? 'text-zinc-200 text-sm font-bold bg-zinc-900/30 p-8 rounded-[2rem] border border-white/5' : 'text-zinc-700 text-sm font-bold bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm') 
                    : (isDarkMode ? 'text-zinc-400' : 'text-zinc-600')
                }`}>
                  {section.content.split('\n').map((line: string, li: number) => {
                    if (line.trim() === '') return <div key={li} className="h-4" />;
                    return (
                      <p 
                        key={li} 
                        className={line.startsWith('#') ? (isDarkMode ? 'text-xl font-black text-white mb-2' : 'text-xl font-black text-zinc-950 mb-2') : 'mb-3'}
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(line.replace(/^#\s*/, '')) }}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
             <div className={`p-12 rounded-[3rem] border text-center space-y-4 transition-all duration-700 ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800/50' : 'bg-white border-zinc-100 shadow-sm'}`}>
                <FileText size={40} className={`mx-auto ${isDarkMode ? 'text-zinc-800' : 'text-zinc-200'}`} />
                <p className={`text-xs font-bold uppercase tracking-widest leading-relaxed max-w-sm mx-auto ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                   Los términos y condiciones específicos para esta academia aún no han sido configurados públicamente. 
                   Por favor, contacta directamente con <span className={isDarkMode ? 'text-[#c9a84c]' : 'text-amber-600'}>{data?.name}</span> para obtener más información.
                </p>
             </div>
          )}
        </div>

        {/* CERTIFICADO DE INTEGRIDAD (Firma Hash) */}
        {termsData?.hash && (
          <div className={`mt-24 p-10 rounded-[3rem] border relative overflow-hidden group animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 transition-all duration-700 ${isDarkMode ? 'bg-gradient-to-b from-zinc-900/50 to-black border-white/5' : 'bg-white border-zinc-100 shadow-xl'}`}>
            <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-all duration-1000 ${isDarkMode ? 'bg-[#c9a84c]/5 group-hover:bg-[#c9a84c]/10' : 'bg-amber-100/30 group-hover:bg-amber-100/50'}`} />
            
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className={`w-20 h-20 rounded-[2rem] border flex items-center justify-center transition-all duration-700 ${isDarkMode ? 'bg-zinc-950 border-white/10 shadow-2xl' : 'bg-white border-amber-50 shadow-lg'}`}>
                <Fingerprint size={32} className={isDarkMode ? 'text-[#c9a84c]' : 'text-amber-600'} />
              </div>
              
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <BadgeCheck size={16} className="text-emerald-500" />
                  <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Certificación Digitaliza Todo</span>
                </div>
                
                <div className="space-y-3">
                  <p className={`text-[9px] font-bold uppercase tracking-widest leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Este documento está firmado electrónicamente y cuenta con un hash de integridad único que garantiza que el texto no ha sido modificado.</p>
                  <div className={`p-4 rounded-xl border font-mono text-[9px] break-all tracking-tight transition-all duration-700 ${isDarkMode ? 'bg-black/50 border-white/5 text-[#c9a84c]' : 'bg-zinc-50 border-zinc-100 text-amber-700'}`}>
                    SHA-256: {termsData.hash}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-20 flex flex-col items-center gap-8 animate-in fade-in duration-1000 delay-700">
           <button 
             onClick={() => router.back()}
             className={`w-full sm:w-auto px-12 h-14 rounded-[1.5rem] text-[12px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${isDarkMode ? 'bg-white text-black hover:bg-zinc-200 shadow-[0_20px_40px_rgba(255,255,255,0.1)]' : 'bg-black text-white hover:bg-zinc-800 shadow-xl'}`}
           >
             Entendido, Volver al Registro
           </button>
           <div className="flex items-center gap-3">
              <div className={`h-[1px] w-8 ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
              <p className={`text-[9px] font-black uppercase tracking-[0.5em] ${isDarkMode ? 'text-zinc-800' : 'text-zinc-300'}`}>Digitaliza Todo &bull; 2026</p>
              <div className={`h-[1px] w-8 ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
           </div>
        </div>
      </main>
    </div>
  );
}
