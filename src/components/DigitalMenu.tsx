import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './DigitalMenu.css';

// Animated Icons
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

    // Background Throttling
    const setBgThrottled = (throttled: boolean) => {
        if (typeof window !== 'undefined') {
            (window as any).__STAGGERED_MENU_OPEN__ = throttled;
        }
    };

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // Set initial state: Content hidden off-screen to the left
            gsap.set(contentRef.current, { xPercent: -100, visibility: 'hidden' });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const playOpen = useCallback(() => {
        if (busyRef.current) return;
        busyRef.current = true;
        setBgThrottled(true);

        const tl = gsap.timeline({
            onComplete: () => {
                busyRef.current = false;
                setBgThrottled(false);
            }
        });

        tl.to(contentRef.current, {
            xPercent: 0,
            visibility: 'visible',
            duration: 0.8,
            ease: 'power4.out'
        })
            .fromTo(menuItemsRef.current,
                { opacity: 0, x: -30 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.6,
                    stagger: 0.08,
                    ease: 'power3.out'
                },
                '-=0.4'
            );
    }, []);

    const playClose = useCallback(() => {
        if (busyRef.current) return;
        busyRef.current = true;
        setBgThrottled(true);

        const tl = gsap.timeline({
            onComplete: () => {
                setBgThrottled(false);
                setOpen(false);
                busyRef.current = false;
                gsap.set(contentRef.current, { visibility: 'hidden' });
            }
        });

        tl.to(menuItemsRef.current, {
            opacity: 0,
            x: -20,
            duration: 0.3,
            stagger: 0.04,
            ease: 'power2.in'
        })
            .to(contentRef.current, {
                xPercent: -100,
                duration: 0.6,
                ease: 'power3.in'
            }, '-=0.2');
    }, []);

    const toggleMenu = () => {
        const target = !openRef.current;
        openRef.current = target;
        if (target) {
            setOpen(true);
            playOpen();
        } else {
            playClose();
        }
    };

    return (
        <div ref={containerRef} className="digital-menu-container" data-open={open}>
            {/* Dynamic Header */}
            <header className={`digital-header ${open ? 'menu-open' : ''}`}>
                <div className="digital-brand gap-3" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <div className="logo-icon-wrapper">
                        <img src="/DLogo-v2.webp" alt="Digitaliza Todo" className="logo-icon" draggable={false} />
                    </div>
                    <div className="flex flex-col">
                        <span className="logo-text">{logoText}</span>
                        <div className="status-indicator">
                            <span className="status-dot"></span>
                            <span className="status-label">SYSTEM ACTIVE</span>
                        </div>
                    </div>
                </div>

                <button
                    className="digital-toggle-refined group"
                    onClick={toggleMenu}
                    aria-label="Toggle Menu"
                >
                    <div className="toggle-content flex flex-col items-center gap-1">
                        <div className="toggle-icons flex items-center gap-3">
                            <div className="icon-main relative flex items-center justify-center w-8 h-8">
                                {open ? (
                                    <XIcon size={24} className="text-white group-hover:text-digital-neon transition-colors" />
                                ) : (
                                    <MenuIcon size={24} className="text-white group-hover:text-digital-neon transition-colors" />
                                )}
                            </div>
                            <div className={`icon-arrow transition-transform duration-500 ${open ? 'rotate-180' : 'rotate-0'}`}>
                                <ChevronRightIcon size={20} className="text-digital-neon" />
                            </div>
                        </div>
                        <span className="toggle-label-dynamic text-[10px] font-black uppercase tracking-[0.1em] text-white/70 group-hover:text-digital-neon transition-colors">
                            {open ? 'Cerrar menú' : 'Desplegar menú'}
                        </span>
                    </div>
                </button>
            </header>

            {/* Menu Content Overlay (Slides from left) */}
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
                                    <a href={item.link} onClick={toggleMenu} className="menu-link-lateral group">
                                        <div className="item-icon-wrapper transition-transform group-hover:scale-110 group-hover:text-digital-neon mr-4">
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
                        <p className="copyright-lateral">© 2026 DIGITALIZA TODO. EST. CHILE. ALL RIGHTS RESERVED.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DigitalMenu;
