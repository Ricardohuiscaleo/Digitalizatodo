import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, MessageCircle, Linkedin } from "lucide-react";

export function ContactForm() {
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");

    const handleWhatsApp = () => {
        if (!name || !message) {
            alert("Por favor completa todos los campos");
            return;
        }
        const text = `Hola, soy ${name}. ${message}`;
        window.open(`https://wa.me/56945392581?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleEmail = () => {
        if (!name || !message) {
            alert("Por favor completa todos los campos");
            return;
        }
        const subject = `Cotización desde la web - ${name}`;
        const body = `Hola, soy ${name}.\n\n${message}`;
        window.open(`mailto:info@digitalizatodo.cl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    };

    return (
        <section id="contacto" className="py-28 px-4 relative z-10 border-t border-white/5">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-slate-200 via-slate-400 to-slate-800 drop-shadow-sm">
                            Mesa de Ayuda & Cotizaciones
                        </span>
                    </h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">Completa la ficha técnica de tu proyecto o ponte en contacto directo.</p>
                </div>

                <Card className="border border-white/10 shadow-2xl shadow-indigo-900/20 bg-slate-950/60 backdrop-blur-2xl text-white">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl">Cuéntanos sobre tu idea</CardTitle>
                        <CardDescription>Te responderemos lo antes posible con una propuesta.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 md:p-10 space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="contactName" className="text-xs font-bold uppercase text-slate-500 tracking-wider">Cliente / Empresa</Label>
                            <Input
                                id="contactName"
                                placeholder="Nombre completo"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-14 px-4 rounded-xl border border-white/10 bg-white/5 focus-visible:ring-indigo-500 text-white text-base"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="contactMessage" className="text-xs font-bold uppercase text-slate-500 tracking-wider">Requerimiento</Label>
                            <Textarea
                                id="contactMessage"
                                rows={5}
                                placeholder="Detalles del sistema o sitio web a desarrollar..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="p-4 rounded-xl resize-none border border-white/10 bg-white/5 focus-visible:ring-indigo-500 text-white text-base"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button
                                onClick={handleEmail}
                                className="group flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200/50 dark:shadow-none transition-all gap-2 text-base"
                            >
                                <div className="transition-transform group-hover:-translate-y-1">
                                    <Mail className="w-5 h-5" />
                                </div>
                                Enviar por Email
                            </Button>
                            <Button
                                onClick={handleWhatsApp}
                                className="group flex-1 h-14 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200/50 dark:shadow-none transition-all gap-2 text-base"
                            >
                                <div className="transition-transform group-hover:scale-110">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                Enviar por WhatsApp
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-16 flex justify-center gap-8">
                    <a href="https://www.linkedin.com/in/rhuiscaleo/" target="_blank" rel="noreferrer" className="p-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-sm hover:shadow-md hover:text-indigo-400 text-slate-400 transition-all">
                        <Linkedin className="w-6 h-6" />
                    </a>
                    <a href="https://wa.me/56945392581" target="_blank" rel="noreferrer" className="p-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-sm hover:shadow-md hover:text-green-400 text-slate-400 transition-all">
                        <MessageCircle className="w-6 h-6" />
                    </a>
                    <a href="mailto:info@digitalizatodo.cl" className="p-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-sm hover:shadow-md hover:text-indigo-400 text-slate-400 transition-all">
                        <Mail className="w-6 h-6" />
                    </a>
                </div>

                <div className="text-center mt-12 text-sm font-mono font-medium text-slate-400 dark:text-slate-500">
                    © {new Date().getFullYear()} DIGITALIZA TODO SPA • RM, CHILE
                </div>
            </div>
        </section>
    );
}
