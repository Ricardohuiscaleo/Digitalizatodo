"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRegistrationPage } from "@/lib/api";
import { Loader2, ArrowLeft, ShieldCheck, FileText, BadgeCheck, Fingerprint, Calendar } from "lucide-react";

export default function TermsPage() {
  const { code } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-[#c9a84c]" size={32} />
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
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-white opacity-80 italic">$1</em>');
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#c9a84c]/30 font-sans">
      {/* HEADER PREMIUM */}
      <div className="fixed top-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-6">
        <button 
          onClick={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95 group"
        >
          <ArrowLeft size={20} className="text-zinc-500 group-hover:text-white transition-colors" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#c9a84c]">Centro de Transparencia</span>
          <span className="text-[11px] font-black uppercase tracking-widest text-[#c9a84c]/50">{data?.name}</span>
        </div>
        <div className="w-12 h-12" />
      </div>

      <main className="max-w-3xl mx-auto pt-32 pb-32 px-6">
        {/* TITULO DE SECCION */}
        <div className="flex items-center gap-6 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
           <div className="w-16 h-16 rounded-3xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center shadow-[0_0_30px_rgba(201,168,76,0.1)]">
              <ShieldCheck className="text-[#c9a84c]" size={32} />
           </div>
           <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">Aspectos Legales</h1>
              <div className="flex items-center gap-3">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest flex items-center gap-1.5">
                  <Calendar size={12} className="text-zinc-700" />
                  Actualizado: {termsData?.updated_at ? new Date(termsData.updated_at).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }).toUpperCase() : 'MARZO 2026'}
                </p>
                <div className="w-1 h-1 rounded-full bg-zinc-800" />
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">VERSIÓN {termsData?.version || '3.5'}</p>
              </div>
           </div>
        </div>

        {/* CONTENIDO FORMATEADO */}
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
          {parsedTerms.length > 0 ? (
            parsedTerms.map((section: any, i: number) => (
              <div key={i} className="group transition-all">
                {section.title && section.title !== "ENCABEZADO / VERSIÓN" && (
                   <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#c9a84c] mb-4 flex items-center gap-3">
                      <div className="w-6 h-[1px] bg-[#c9a84c]/30" />
                      {section.title}
                   </h2>
                )}
                <div className={`text-[13px] leading-relaxed text-zinc-400 font-medium whitespace-pre-wrap ${section.title === "ENCABEZADO / VERSIÓN" ? 'text-zinc-200 text-sm font-bold bg-zinc-900/30 p-8 rounded-[2rem] border border-white/5' : ''}`}>
                  {section.content.split('\n').map((line: string, li: number) => {
                    if (line.trim() === '') return <div key={li} className="h-4" />;
                    return (
                      <p 
                        key={li} 
                        className={line.startsWith('#') ? 'text-xl font-black text-white mb-2' : 'mb-3'}
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(line.replace(/^#\s*/, '')) }}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
             <div className="p-12 rounded-[3rem] bg-zinc-900/30 border border-zinc-800/50 text-center space-y-4">
                <FileText size={40} className="mx-auto text-zinc-800" />
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
                   Los términos y condiciones específicos para esta academia aún no han sido configurados públicamente. 
                   Por favor, contacta directamente con <span className="text-[#c9a84c]">{data?.name}</span> para obtener más información.
                </p>
             </div>
          )}
        </div>

        {/* CERTIFICADO DE INTEGRIDAD (Firma Hash) */}
        {termsData?.hash && (
          <div className="mt-24 p-10 rounded-[3rem] bg-gradient-to-b from-zinc-900/50 to-black border border-white/5 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#c9a84c]/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-[#c9a84c]/10 transition-colors" />
            
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="w-20 h-20 rounded-[2rem] bg-zinc-950 border border-white/10 flex items-center justify-center shadow-2xl">
                <Fingerprint size={32} className="text-[#c9a84c]" />
              </div>
              
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <BadgeCheck size={16} className="text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Certificación Digitaliza Todo</span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Este documento está firmado electrónicamente y cuenta con un hash de integridad único que garantiza que el texto no ha sido modificado.</p>
                  <div className="bg-black/50 p-4 rounded-xl border border-white/5 font-mono text-[9px] break-all text-[#c9a84c] tracking-tight">
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
             className="w-full sm:w-auto px-12 h-14 rounded-[1.5rem] bg-white text-black text-[12px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
           >
             Entendido, Volver al Registro
           </button>
           <div className="flex items-center gap-3">
              <div className="h-[1px] w-8 bg-zinc-900" />
              <p className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.5em]">Digitaliza Todo &bull; 2026</p>
              <div className="h-[1px] w-8 bg-zinc-900" />
           </div>
        </div>
      </main>
    </div>
  );
}
