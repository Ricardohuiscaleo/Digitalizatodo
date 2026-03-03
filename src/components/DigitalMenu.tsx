import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './DigitalMenu.css';

// Animated Icons from animateicons repo
import { MenuIcon } from './animated-icons/icons/lucide/menu-icon';
import { XIcon } from './animated-icons/icons/lucide/x-icon';
import { ChevronRightIcon } from './animated-icons/icons/lucide/chevron-right-icon';
import { HouseIcon } from './animated-icons/icons/lucide/house-icon';
import { ActivityIcon } from './animated-icons/icons/lucide/activity-icon';
import { BlocksIcon } from './animated-icons/icons/lucide/blocks-icon';
import { LayoutGridIcon } from './animated-icons/icons/lucide/layout-grid-icon';
import { UsersRoundIcon } from './animated-icons/icons/lucide/users-round-icon';
import { MessageCircleIcon } from './animated-icons/icons/lucide/message-circle-icon';

export interface DigitalMenuItem {
    label: string;
    link: string;
    icon?: React.ReactNode;
}

export interface DigitalMenuProps {
    items?: DigitalMenuItem[];
    logoText?: string;
}

const DEFAULT_ITEMS: DigitalMenuItem[] = [
    { label: 'Inicio', link: '#hero', icon: <HouseIcon size={28} /> },
    { label: 'Proceso', link: '#roadmap', icon: <ActivityIcon size={28} /> },
    { label: 'Servicios', link: '#servicios', icon: <BlocksIcon size={28} /> },
    { label: 'Proyectos', link: '#proyectos', icon: <LayoutGridIcon size={28} /> },
    { label: 'Nosotros', link: '#nosotros', icon: <UsersRoundIcon size={28} /> },
    { label: 'Contacto', link: '#contacto', icon: <MessageCircleIcon size={28} /> },
];

export const DigitalMenu: React.FC<DigitalMenuProps> = ({
    items = DEFAULT_ITEMS,
    logoText = 'DIGITALIZA TODO',
}) => {
    const [open, setOpen] = useState(false);
    const openRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const menuItemsRef = useRef<(HTMLLIElement | null)[]>([]);
    const busyRef = useRef(false);

    const setBgThrottled = (t: boolean) => {
        if (typeof window !== 'undefined') (window as any).__STAGGERED_MENU_OPEN__ = t;
    };

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.set(contentRef.current, { xPercent: -100, visibility: 'hidden' });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const playOpen = useCallback(() => {
        if (busyRef.current) return;
        busyRef.current = true;
        setBgThrottled(true);

        gsap.timeline({ onComplete: () => { busyRef.current = false; setBgThrottled(false); } })
            .to(contentRef.current, { xPercent: 0, visibility: 'visible', duration: 0.8, ease: 'power4.out' })
            .fromTo(menuItemsRef.current,
                { opacity: 0, x: -30 },
                { opacity: 1, x: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' },
                '-=0.4'
            );
    }, []);

    const playClose = useCallback(() => {
        if (busyRef.current) return;
        busyRef.current = true;
        setBgThrottled(true);

        gsap.timeline({
            onComplete: () => { setBgThrottled(false); setOpen(false); busyRef.current = false; gsap.set(contentRef.current, { visibility: 'hidden' }); }
        })
            .to(menuItemsRef.current, { opacity: 0, x: -20, duration: 0.3, stagger: 0.04, ease: 'power2.in' })
            .to(contentRef.current, { xPercent: -100, duration: 0.6, ease: 'power3.in' }, '-=0.2');
    }, []);

    const toggleMenu = () => {
        const target = !openRef.current;
        openRef.current = target;
        if (target) { setOpen(true); playOpen(); }
        else { playClose(); }
    };

    return (
        <div ref={containerRef} className="digital-menu-container" data-open={open}>

            {/* ─── Header ─── */}
            <header className={`digital-header ${open ? 'menu-open' : ''}`}>

                {/* LEFT: Logo + Brand text */}
                <div className="digital-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <div className="logo-icon-wrapper">
                        <img src="/DLogo-v2.webp" alt="Digitaliza Todo" className="logo-icon" draggable={false} />
                    </div>
                    <div className="brand-text-block">
                        <span className="logo-text">{logoText}</span>
                        <div className="status-indicator">
                            <span className="status-dot"></span>
                            <span className="status-label">SOFTWARE FACTORY</span>
                        </div>
                    </div>
                </div>

                {/* CENTER: "Desplegar menú" label — same row as brand, right of DIGITALIZA TODO */}
                <button className="menu-label-btn group" onClick={toggleMenu} aria-label="Toggle Menu">
                    {/* Top row: same height as "DIGITALIZA TODO" */}
                    <div className="menu-label-top">
                        <span className="menu-label-text">{open ? 'Cerrar menú' : 'Desplegar menú'}</span>
                        <div className={`menu-label-arrow transition-transform duration-500 ${open ? 'rotate-180' : 'rotate-0'}`}>
                            <ChevronRightIcon size={16} className="neon-icon" />
                        </div>
                    </div>
                    {/* Bottom row: toggle icon, same height as "SOFTWARE FACTORY" */}
                    <div className="menu-label-bottom">
                        <div className="toggle-icon-inner">
                            {open
                                ? <XIcon size={18} className="neon-icon" />
                                : <MenuIcon size={18} className="white-icon group-hover:text-yellow-400 transition-colors" />
                            }
                        </div>
                    </div>
                </button>

            </header>

            {/* ─── Lateral Panel ─── */}
            <div ref={contentRef} className="digital-menu-content-lateral">
                <div className="menu-inner-lateral">
                    <nav className="menu-nav-lateral">
                        <ul className="menu-list-lateral">
                            {items.map((item, i) => (
                                <li key={i} ref={el => { menuItemsRef.current[i] = el; }} className="menu-item-lateral">
                                    <a href={item.link} onClick={toggleMenu} className="menu-link-lateral group">
                                        <div className="item-icon-wrapper">
                                            {item.icon}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="item-number-lateral">0{i + 1}</span>
                                            <span className="item-label-lateral">{item.label}</span>
                                        </div>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="menu-footer-lateral">
                        <div className="footer-line"></div>
                        <p className="copyright-lateral">© 2026 DIGITALIZA TODO · SOFTWARE FACTORY · CHILE</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default DigitalMenu;
