import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './DigitalMenu.css';

// Animated Icons
import { MenuIcon } from './animated-icons/icons/lucide/menu-icon';
import type { MenuIconHandle } from './animated-icons/icons/lucide/menu-icon';
import { XIcon } from './animated-icons/icons/lucide/x-icon';
import type { XIconHandle } from './animated-icons/icons/lucide/x-icon';
import { ChevronLeftIcon } from './animated-icons/icons/lucide/chevron-left-icon';
import type { ChevronLeftIconHandle } from './animated-icons/icons/lucide/chevron-left-icon';
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
    Icon?: React.ElementType;
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
    const contentRef = useRef<HTMLDivElement>(null);
    const menuItemsRef = useRef<(HTMLLIElement | null)[]>([]);
    const busyRef = useRef(false);

    // Refs for header icons
    const chevronRef = useRef<ChevronLeftIconHandle>(null);
    const menuIconRef = useRef<MenuIconHandle>(null);
    const xIconRef = useRef<XIconHandle>(null);

    // Refs for lateral menu icons
    const lateralIconsRef = useRef<(any | null)[]>([]);

    const setBgThrottled = (t: boolean) => {
        if (typeof window !== 'undefined') (window as any).__STAGGERED_MENU_OPEN__ = t;
    };

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.set(contentRef.current, { xPercent: 100, visibility: 'hidden' });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const playOpen = useCallback(() => {
        if (busyRef.current) return;
        busyRef.current = true;
        setBgThrottled(true);
        gsap.timeline({ onComplete: () => { busyRef.current = false; setBgThrottled(false); } })
            .to(contentRef.current, { xPercent: 0, visibility: 'visible', duration: 0.7, ease: 'power4.out' })
            .fromTo(menuItemsRef.current,
                { opacity: 0, x: 24 },
                { opacity: 1, x: 0, duration: 0.5, stagger: 0.07, ease: 'power3.out' },
                '-=0.35'
            );
    }, []);

    const playClose = useCallback(() => {
        if (busyRef.current) return;
        busyRef.current = true;
        setBgThrottled(true);
        gsap.timeline({
            onComplete: () => { setBgThrottled(false); setOpen(false); busyRef.current = false; gsap.set(contentRef.current, { visibility: 'hidden' }); }
        })
            .to(menuItemsRef.current, { opacity: 0, x: 16, duration: 0.25, stagger: 0.03, ease: 'power2.in' })
            .to(contentRef.current, { xPercent: 100, duration: 0.5, ease: 'power3.in' }, '-=0.15');
    }, []);

    const toggleMenu = () => {
        const target = !openRef.current;
        openRef.current = target;
        if (target) { setOpen(true); playOpen(); }
        else { playClose(); }
    };

    // Hover triggers for the entire pill
    const handlePillEnter = () => {
        chevronRef.current?.startAnimation?.();
        menuIconRef.current?.startAnimation?.();
        xIconRef.current?.startAnimation?.();
    };

    const handlePillLeave = () => {
        chevronRef.current?.stopAnimation?.();
        menuIconRef.current?.stopAnimation?.();
        xIconRef.current?.stopAnimation?.();
    };

    // Lateral menu item handlers
    const handleLateralEnter = (index: number) => {
        lateralIconsRef.current[index]?.startAnimation?.();
    };

    const handleLateralLeave = (index: number) => {
        lateralIconsRef.current[index]?.stopAnimation?.();
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
                    onMouseEnter={handlePillEnter}
                    onMouseLeave={handlePillLeave}
                    aria-label="Abrir/Cerrar menú"
                >
                    {/* Text: full on tablet+, short on mobile */}
                    <span className="toggle-label toggle-label--full">
                        {open ? 'Cerrar menú' : 'Desplegar menú'}
                    </span>
                    <span className="toggle-label toggle-label--short">
                        {open ? 'Cerrar' : 'Menú'}
                    </span>

                    <span className={`toggle-arrow ${open ? 'is-open' : ''}`}>
                        <ChevronLeftIcon ref={chevronRef} size={14} isAnimated={false} />
                    </span>

                    <span className="toggle-icon">
                        {open ? (
                            <XIcon ref={xIconRef} size={22} isAnimated={false} />
                        ) : (
                            <MenuIcon ref={menuIconRef} size={22} isAnimated={false} />
                        )}
                    </span>
                </button>

            </header>

            {/* Lateral panel */}
            <div ref={contentRef} className="digital-menu-content-lateral">
                <div className="menu-inner-lateral">
                    <nav className="menu-nav-lateral">
                        <ul className="menu-list-lateral">
                            {items.map((item, i) => (
                                <li
                                    key={i}
                                    ref={el => { menuItemsRef.current[i] = el; }}
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
                                                    ref={(el: any) => { lateralIconsRef.current[i] = el; }}
                                                    size={28}
                                                    isAnimated={false}
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
                        <p className="copyright-lateral">© 2026 DIGITALIZA TODO · SOFTWARE FACTORY · CHILE</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default DigitalMenu;
