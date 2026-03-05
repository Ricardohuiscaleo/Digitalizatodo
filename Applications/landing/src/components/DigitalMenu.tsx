import React, { useEffect, useRef, useState } from 'react';
import './DigitalMenu.css';

import { Menu, X, ChevronLeft } from 'lucide-react';

// Lateral Menu Icons
import { HouseIcon } from './animated-icons/icons/lucide/house-icon';
import type { HouseHandle } from './animated-icons/icons/lucide/house-icon';
import { ActivityIcon } from './animated-icons/icons/lucide/activity-icon';
import type { ActivityIconHandle } from './animated-icons/icons/lucide/activity-icon';
import { BlocksIcon } from './animated-icons/icons/lucide/blocks-icon';
import type { BlocksIconHandle } from './animated-icons/icons/lucide/blocks-icon';
import { LayoutGridIcon } from './animated-icons/icons/lucide/layout-grid-icon';
import type { LayoutGridHandle } from './animated-icons/icons/lucide/layout-grid-icon';
import { UsersRoundIcon } from './animated-icons/icons/lucide/users-round-icon';
import type { UsersRoundHandle } from './animated-icons/icons/lucide/users-round-icon';
import { MessageCircleIcon } from './animated-icons/icons/lucide/message-circle-icon';
import type { MessageCircleIconHandle } from './animated-icons/icons/lucide/message-circle-icon';

export interface DigitalMenuItem {
    label: string;
    link: string;
    Icon?: any;
}
export interface DigitalMenuProps {
    items?: DigitalMenuItem[];
    logoText?: string;
}

const DEFAULT_ITEMS: DigitalMenuItem[] = [
    { label: 'Inicio', link: '#hero', Icon: HouseIcon },
    { label: 'Proceso', link: '#roadmap', Icon: ActivityIcon },
    { label: 'Servicios', link: '#servicios', Icon: BlocksIcon },
    { label: 'Proyectos', link: '#proyectos', Icon: LayoutGridIcon },
    { label: 'Nosotros', link: '#nosotros', Icon: UsersRoundIcon },
    { label: 'Contacto', link: '#contacto', Icon: MessageCircleIcon },
];

export const DigitalMenu: React.FC<DigitalMenuProps> = ({
    items = DEFAULT_ITEMS,
    logoText = 'DIGITALIZA TODO',
}) => {
    const [open, setOpen] = useState(false);
    const openRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const setBgThrottled = (t: boolean) => {
        if (typeof window !== 'undefined') (window as any).__STAGGERED_MENU_OPEN__ = t;
    };

    const toggleMenu = () => {
        const target = !openRef.current;
        openRef.current = target;
        setOpen(target);
        setBgThrottled(target);
    };

    // Close on click outside and escape key
    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (e: MouseEvent) => {
            const content = containerRef.current?.querySelector('.digital-menu-content-lateral');
            const target = e.target as Node;

            if (openRef.current && content && !content.contains(target)) {
                // Ignore clicks on the toggle button itself to avoid double-toggling
                const btn = containerRef.current?.querySelector('.digital-toggle-btn');
                if (btn && btn.contains(target)) return;

                openRef.current = false;
                setOpen(false);
                setBgThrottled(false);
            }
        };

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                openRef.current = false;
                setOpen(false);
                setBgThrottled(false);
            }
        };

        // mousedown is more reliable than click for 'outside' detection
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [open]);

    // Lateral menu item handlers
    const handleLateralEnter = (index: number) => {
        // Now using CSS
    };

    const handleLateralLeave = (index: number) => {
        // Now using CSS
    };

    return (
        <div ref={containerRef} className="digital-menu-container" data-open={open}>

            <header className={`digital-header ${open ? 'menu-open' : ''}`}>

                {/* Brand */}
                <div
                    className="digital-brand"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    role="button"
                    tabIndex={0}
                    aria-label="Ir al inicio"
                >
                    <div className="logo-icon-wrapper">
                        <img src="/DLogo-v2.webp" alt="Digitaliza Todo" className="logo-icon" draggable={false} />
                    </div>
                    <div className="brand-text-block">
                        <span className="logo-text">{logoText}</span>
                        <div className="status-indicator">
                            <span className="status-dot" />
                            <span className="status-label">SOFTWARE FACTORY</span>
                        </div>
                    </div>
                </div>

                {/* Toggle pill */}
                <button
                    className="digital-toggle-btn group"
                    onClick={toggleMenu}
                    aria-label="Abrir/Cerrar menú"
                >
                    <div className="toggle-content-wrapper">
                        {/* Text: full on tablet+, short on mobile */}
                        <div className="toggle-text-stack">
                            <span className="toggle-label toggle-label--full">
                                {open ? 'Cerrar menú' : 'Desplegar menú'}
                            </span>
                            <span className="toggle-label toggle-label--short">
                                {open ? 'Cerrar' : 'Menú'}
                            </span>
                            {!open && <span className="toggle-subtitle-neon">Acceso Clientes</span>}
                        </div>

                        <span className={`toggle-arrow ${open ? 'is-open' : ''}`}>
                            <ChevronLeft size={14} />
                        </span>

                        <span className="toggle-icon">
                            {open ? (
                                <X size={22} />
                            ) : (
                                <Menu size={22} />
                            )}
                        </span>
                    </div>
                </button>

            </header>

            {/* Lateral panel */}
            <div className={`digital-menu-content-lateral ${open ? 'is-open' : ''}`}>
                <div className="menu-inner-lateral">
                    <nav className="menu-nav-lateral">
                        <ul className="menu-list-lateral">
                            {/* Cliente Login Section */}
                            <li className="menu-item-lateral client-access-item">
                                <a
                                    href="https://admin.digitalizatodo.cl/admin/login"
                                    className="menu-link-lateral client-login-link"
                                >
                                    <div className="item-icon-wrapper">
                                        <div className="client-login-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                                        </div>
                                    </div>
                                    <div className="item-text-block">
                                        <span className="item-number-lateral">VIP</span>
                                        <span className="item-label-lateral">ACCESO CLIENTES</span>
                                    </div>
                                </a>
                            </li>

                            <div className="menu-separator-green" />

                            {items.map((item, i) => (
                                <li
                                    key={i}
                                    className="menu-item-lateral"
                                >
                                    <a
                                        href={item.link}
                                        onClick={toggleMenu}
                                        className="menu-link-lateral"
                                        onMouseEnter={() => handleLateralEnter(i)}
                                        onMouseLeave={() => handleLateralLeave(i)}
                                    >
                                        <div className="item-icon-wrapper">
                                            {item.Icon && (
                                                <item.Icon
                                                    size={28}
                                                />
                                            )}
                                        </div>
                                        <div className="item-text-block">
                                            <span className="item-number-lateral">0{i + 1}</span>
                                            <span className="item-label-lateral">{item.label}</span>
                                        </div>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    <div className="menu-footer-lateral">
                        <div className="footer-line" />
                        <div className="support-badge">
                            <span className="support-dot" />
                            <span className="support-text">SOPORTE CLIENTES 24/7 · ACTIVO</span>
                        </div>
                        <p className="copyright-lateral">© 2026 DIGITALIZA TODO · SOFTWARE FACTORY · CHILE</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default DigitalMenu;
