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
    { label: 'Inicio', link: '#inicio' },
    { label: 'Servicios', link: '#servicios' },
    { label: 'Portafolio', link: '#portafolio' },
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
    const revealLineRef = useRef<HTMLDivElement>(null);
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
            // Set initial state
            gsap.set(contentRef.current, { yPercent: -100, visibility: 'hidden' });
            gsap.set(revealLineRef.current, { scaleX: 0, opacity: 0 });
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

        tl.to(revealLineRef.current, {
            scaleX: 1,
            opacity: 1,
            duration: 0.4,
            ease: 'power2.inOut'
        })
            .to(revealLineRef.current, {
                top: '100%',
                duration: 0.6,
                ease: 'power3.inOut'
            }, '-=0.1')
            .to(contentRef.current, {
                yPercent: 0,
                visibility: 'visible',
                duration: 0.6,
                ease: 'power3.inOut'
            }, '<')
            .fromTo(menuItemsRef.current,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: 'back.out(1.7)'
                },
                '-=0.2'
            )
            .to(revealLineRef.current, {
                opacity: 0,
                duration: 0.3
            });
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
            y: -20,
            duration: 0.3,
            stagger: 0.05,
            ease: 'power2.in'
        })
            .to(contentRef.current, {
                yPercent: -100,
                duration: 0.5,
                ease: 'power3.inOut'
            });
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
                <div className="digital-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <span className="logo-text">{logoText}</span>
                    <span className="logo-dot"></span>
                </div>

                <button
                    className="digital-toggle"
                    onClick={toggleMenu}
                    aria-label="Toggle Menu"
                >
                    <div className="toggle-box">
                        <span className="line top"></span>
                        <span className="line mid"></span>
                        <span className="line bot"></span>
                    </div>
                    <span className="toggle-label">{open ? 'CERRAR' : 'MENU'}</span>
                </button>
            </header>

            {/* Reveal Line Effect */}
            <div ref={revealLineRef} className="digital-reveal-line" />

            {/* Menu Content */}
            <div ref={contentRef} className="digital-menu-content">
                <div className="menu-inner">
                    <nav className="menu-nav">
                        <ul className="menu-list">
                            {items.map((item, i) => (
                                <li
                                    key={i}
                                    ref={el => { menuItemsRef.current[i] = el; }}
                                    className="menu-item"
                                >
                                    <a href={item.link} onClick={toggleMenu} className="menu-link">
                                        <span className="item-number">0{i + 1}</span>
                                        <span className="item-label">{item.label}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="menu-footer">
                        <p className="copyright">© 2026 DIGITALIZA TODO. SOLUTIONS FOR THE FUTURE.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DigitalMenu;
