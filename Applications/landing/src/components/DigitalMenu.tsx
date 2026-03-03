import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './DigitalMenu.css';

export interface DigitalMenuItem {
    label: string;
    link: string;
}

export interface DigitalMenuProps {
    items?: DigitalMenuItem[];
    logoText?: string;
}

const DEFAULT_ITEMS: DigitalMenuItem[] = [
    { label: 'Inicio', link: '#hero' },
    { label: 'Proceso', link: '#roadmap' },
    { label: 'Servicios', link: '#servicios' },
    { label: 'Proyectos', link: '#proyectos' },
    { label: 'Nosotros', link: '#nosotros' },
    { label: 'Contacto', link: '#contacto' },
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
                    className="digital-toggle-refined"
                    onClick={toggleMenu}
                    aria-label="Toggle Menu"
                >
                    <div className="toggle-inner">
                        <span className="toggle-line line-1"></span>
                        <span className="toggle-line line-2"></span>
                        <span className="toggle-line line-3"></span>
                    </div>
                    <span className="toggle-text">{open ? 'EXIT' : 'MENU'}</span>
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
                                    <a href={item.link} onClick={toggleMenu} className="menu-link-lateral">
                                        <span className="item-number-lateral">0{i + 1}</span>
                                        <span className="item-label-lateral">{item.label}</span>
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
