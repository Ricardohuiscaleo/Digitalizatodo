"use client";
import { useEffect, useState } from "react";
import { Bell, Calendar, CreditCard, Info, X } from "lucide-react";

interface ToastNotification {
  id: string;
  title: string;
  body: string;
  type: "attendance" | "payment" | "system" | "update";
}

interface Props {
  notification: ToastNotification | null;
  onDismiss: () => void;
  onNavigate?: (type: string) => void;
}

const typeIcons = { attendance: Calendar, payment: CreditCard, system: Info, update: Bell };
const typeColors = { attendance: "bg-green-500", payment: "bg-blue-500", system: "bg-zinc-500", update: "bg-purple-500" };

export default function NotificationToast({ notification, onDismiss, onNavigate }: Props) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      setExiting(false);
      try { new Audio('/notification.wav').play().catch(() => {}); } catch {}
      const timer = setTimeout(() => dismiss(), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => { setVisible(false); onDismiss(); }, 300);
  };

  if (!notification || !visible) return null;

  const Icon = typeIcons[notification.type] || Bell;
  const color = typeColors[notification.type] || "bg-zinc-500";

  return (
    <div className={`fixed top-4 left-4 right-4 z-[200] transition-all duration-300 ${exiting ? "opacity-0 -translate-y-4" : "opacity-100 translate-y-0"}`}>
      <div
        onClick={() => { onNavigate?.(notification.type); dismiss(); }}
        className="bg-white rounded-2xl shadow-2xl border border-zinc-100 p-4 flex items-start gap-3 cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-zinc-900 truncate">{notification.title}</p>
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{notification.body}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); dismiss(); }} className="w-6 h-6 flex items-center justify-center text-zinc-300 hover:text-zinc-500">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
