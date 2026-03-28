import React from "react";
import { X, Loader2 } from "lucide-react";

const CAT_COLORS: Record<string, string> = {
    alimentacion:    "bg-orange-100 text-orange-700",
    materiales:      "bg-blue-100 text-blue-700",
    infraestructura: "bg-slate-100 text-slate-700",
    actividades:     "bg-purple-100 text-purple-700",
    administrativo:  "bg-zinc-100 text-zinc-700",
    insumos:         "bg-green-100 text-green-700",
    otros:           "bg-rose-100 text-rose-700",
};

interface SchoolExpenseCardProps {
    exp: any;
    onLightbox: (url: string) => void;
    onDelete?: () => void;
    deleting?: boolean;
    formatCLP: (n: number) => string;
}

export function SchoolExpenseCard({ exp, onLightbox, onDelete, deleting, formatCLP }: SchoolExpenseCardProps) {
    const photos = [];
    if (exp.receipt_photo) photos.push({ url: exp.receipt_photo, label: "Boleta" });
    if (exp.product_photo) photos.push({ url: exp.product_photo, label: "Producto" });

    // Format date if needed (assuming YYYY-MM-DD)
    const fmtShortDate = (d: string) => {
        if (!d) return "";
        const [y, m, day] = d.split("-");
        return `${day}/${m}`;
    };

    return (
        <div className="bg-white rounded-[28px] border border-zinc-100 shadow-sm overflow-hidden p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${CAT_COLORS[exp.category] || "bg-zinc-100 text-zinc-600"}`}>
                            {exp.category}
                        </span>
                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{fmtShortDate(exp.expense_date)}</span>
                    </div>
                    <h3 className="text-sm font-black text-zinc-900 leading-tight">{exp.title}</h3>
                    {exp.description && (
                        <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">{exp.description}</p>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-base font-black text-zinc-950 tracking-tighter">{formatCLP(exp.amount)}</p>
                    {onDelete && (
                        <button onClick={onDelete} disabled={deleting} 
                            className="mt-1 text-zinc-200 hover:text-rose-500 transition-colors p-1">
                            {deleting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} strokeWidth={3} />}
                        </button>
                    )}
                </div>
            </div>

            {photos.length > 0 && (
                <div className={`grid ${photos.length === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                    {photos.map((p, i) => (
                        <button key={i} onClick={() => onLightbox(p.url)} 
                            className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-100 group">
                            <img src={p.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-lg text-[7px] font-black text-white uppercase tracking-widest">
                                {p.label}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
