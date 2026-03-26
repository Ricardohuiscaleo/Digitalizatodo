"use client";
/* id: 881 */
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRegistrationPage } from "@/lib/api";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";

export default function TermsPage() {
  const { code } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await getRegistrationPage(code as string);
      setData(res);
      setLoading(false);
    }
    load();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#c9a84c]" size={32} />
      </div>
    );
  }

  const isDarkMode = true; // Forzamos estética premium oscura

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-[#c9a84c]/30">
      {/* HEADER ELEGANTE */}
      <div className="fixed top-0 left-0 right-0 h-20 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 z-50 flex items-center justify-between px-6">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors group"
        >
          <ArrowLeft size={18} className="text-zinc-500 group-hover:text-white transition-colors" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#c9a84c]">Términos y Condiciones</span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">{data?.name}</span>
        </div>
        <div className="w-10 h-10" /> {/* Spacer */}
      </div>

      <main className="max-w-3xl mx-auto pt-32 pb-20 px-6">
        <div className="flex items-center gap-4 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="w-12 h-12 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center">
              <ShieldCheck className="text-[#c9a84c]" size={24} />
           </div>
           <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">Aspectos Legales</h1>
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Última actualización: Marzo 2026</p>
           </div>
        </div>

        <div className="prose prose-invert prose-zinc max-w-none animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
          {data?.terms ? (
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400 font-medium">
              {data.terms}
            </div>
          ) : (
             <div className="p-8 rounded-[2.5rem] bg-zinc-900/50 border border-zinc-800 text-center">
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest leading-loose">
                   Los términos y condiciones específicos para esta academia aún no han sido configurados públicamente. 
                   Por favor, contacta directamente con {data?.name} para obtener más información sobre sus políticas.
                </p>
             </div>
          )}
        </div>

        <div className="mt-20 pt-10 border-t border-zinc-900 flex flex-col items-center gap-6 animate-in fade-in duration-1000 delay-500">
           <button 
             onClick={() => router.back()}
             className="px-8 h-12 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all active:scale-95"
           >
             Entendido, Volver al Registro
           </button>
           <p className="text-[8px] font-black text-zinc-800 uppercase tracking-[0.4em]">Digitaliza Todo &bull; 2026</p>
        </div>
      </main>
    </div>
  );
}
