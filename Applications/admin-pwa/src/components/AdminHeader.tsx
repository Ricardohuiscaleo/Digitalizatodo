"use client";

import React from 'react';
import { ShieldCheck, Sun, Moon, LogOut } from 'lucide-react';
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  handleLogout: () => void;
  isScrolled: boolean;
}

export const AdminHeader = ({ isDarkMode, toggleTheme, handleLogout, isScrolled }: AdminHeaderProps) => {
  return (
    <header className={`fixed top-0 left-0 right-0 z-[60] md:hidden transition-all duration-500 ${isScrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border py-2' : 'bg-transparent py-4'}`}>
      <div className="px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.3)]">
            <ShieldCheck className="text-primary-foreground" size={20} />
          </div>
          <div className="leading-tight">
            <h2 className="font-black uppercase tracking-tighter text-[11px] text-foreground">Engine Admin</h2>
            <p className="text-[8px] text-primary font-black uppercase tracking-widest leading-none">Master Access</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="h-10 w-10 rounded-xl bg-muted/50 border border-border text-foreground"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            className="h-10 w-10 rounded-xl bg-muted/50 border border-border text-foreground"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </header>
  );
};
