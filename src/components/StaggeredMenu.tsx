import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GradualBlur from './GradualBlur';
import './StaggeredMenu.css';

export interface StaggeredMenuItem {
  label: string;
  ariaLabel: string;
  link: string;
}

export interface StaggeredMenuSocialItem {
  label: string;
  link: string;
}

export interface StaggeredMenuProps {
  position?: 'left' | 'right';
  colors?: string[];
  items?: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  className?: string;
  logoUrl?: string;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  changeMenuColorOnOpen?: boolean;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  isFixed?: boolean;
}

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = 'right',
  colors = ['#B19EEF', '#5227FF'],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logoUrl = '/src/assets/logos/reactbits-gh-white.svg',
  menuButtonColor = '#fff',
  openMenuButtonColor = '#000',
  changeMenuColorOnOpen = true,
  accentColor = '#5227FF',
  isFixed = false,
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  const resolvedColors = colors && colors.length ? colors.slice(0, 6) : ['#1e1e22', '#35353c'];
  let arr = [...resolvedColors];

  const toggleMenu = () => {
    const newState = !open;
    setOpen(newState);
    if (newState) onMenuOpen?.();
    else onMenuClose?.();
  };

  const closeMenu = () => {
    if (open) {
      setOpen(false);
      onMenuClose?.();
    }
  };

  useEffect(() => {
    if (!closeOnClickAway || !open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeOnClickAway, open]);

  // Framer Motion Variants - Using spring for that "rebote" feel
  const isLeft = position === 'left';
  const offscreenX = isLeft ? '-100%' : '100%';

  const springConfig = { type: "spring" as const, stiffness: 450, damping: 35, mass: 1 };
  const bounceConfig = { type: "spring" as const, stiffness: 500, damping: 28, mass: 1 };

  const layerVariants = {
    closed: { x: offscreenX, transition: { duration: 0.25, ease: [0.42, 0, 1, 1] as const } },
    open: (i: number) => ({
      x: 0,
      transition: { ...springConfig, delay: i * 0.03 }
    })
  };

  const panelVariants = {
    closed: { x: offscreenX, transition: { duration: 0.25, ease: [0.42, 0, 1, 1] as const } },
    open: {
      x: 0,
      transition: { ...springConfig, delay: (arr.length - 1) * 0.03 }
    }
  };

  const staggerList = {
    closed: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
    open: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } }
  };

  const itemVariants = {
    closed: { y: "110%", rotate: 5, opacity: 0, transition: { duration: 0.3 } },
    open: {
      y: "0%",
      rotate: 0,
      opacity: 1,
      transition: { ...bounceConfig }
    }
  };

  const socialVariants = {
    closed: { y: 20, opacity: 0, transition: { duration: 0.2 } },
    open: { y: 0, opacity: 1, transition: { ...springConfig } }
  };

  const numVariants = {
    closed: { opacity: 0, x: 10 },
    open: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0, 0, 0.58, 1] as const } }
  };

  const textVariants = {
    initial: { y: "100%", opacity: 0 },
    animate: { y: "0%", opacity: 1, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
    exit: { y: "-100%", opacity: 0, transition: { duration: 0.2 } }
  };

  const currentToggleColor = changeMenuColorOnOpen && open ? openMenuButtonColor : menuButtonColor;

  return (
    <div
      className={`${className ? className + ' ' : ''}staggered-menu-wrapper${isFixed ? ' fixed-wrapper' : ''}`}
      style={accentColor ? { ['--sm-accent' as any]: accentColor } : undefined}
      data-position={position}
      data-open={open || undefined}
    >
      <div className="sm-prelayers" aria-hidden="true">
        {arr.map((c, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={layerVariants}
            initial="closed"
            animate={open ? "open" : "closed"}
            className="sm-prelayer"
            style={{ background: c, visibility: 'visible' }}
          />
        ))}
      </div>

      <GradualBlur
        position="top"
        target="parent"
        height="120px"
        strength={4}
        divCount={6}
        curve="ease-in"
        exponential={true}
        zIndex={10}
        className="pointer-events-none !fixed !top-0 !left-0 !w-full !m-0 !p-0"
      />

      <header className="staggered-menu-header" aria-label="Main navigation header">
        <div className="sm-logo" aria-label="Logo">
          <img
            src={logoUrl || '/src/assets/logos/reactbits-gh-white.svg'}
            alt="Logo"
            className="sm-logo-img"
            draggable={false}
            width={110}
            height={24}
          />
        </div>
        <motion.button
          ref={toggleBtnRef}
          className="sm-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={toggleMenu}
          type="button"
          animate={{ color: currentToggleColor }}
          transition={{ duration: 0.3 }}
        >
          <span className="sm-toggle-textWrap relative inline-flex overflow-hidden h-[1em]" style={{ minWidth: '40px', justifyContent: 'center' }}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={open ? 'close' : 'menu'}
                variants={textVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {open ? 'Close' : 'Menu'}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="sm-icon" aria-hidden="true">
            <motion.span
              className="sm-icon-line"
              animate={{ rotate: open ? 225 : 0 }}
              transition={{ duration: open ? 0.8 : 0.35, ease: open ? [0.16, 1, 0.3, 1] as const : "easeInOut" }}
            />
            <motion.span
              className="sm-icon-line sm-icon-line-v"
              animate={{ rotate: open ? 225 + 90 : 90 }}
              transition={{ duration: open ? 0.8 : 0.35, ease: open ? [0.16, 1, 0.3, 1] as const : "easeInOut" }}
            />
          </span>
        </motion.button>
      </header>

      <motion.aside
        ref={wrapperRef as any}
        className="staggered-menu-panel"
        variants={panelVariants}
        initial="closed"
        animate={open ? "open" : "closed"}
        aria-hidden={!open}
        style={{ visibility: open ? 'visible' : 'hidden' }}
      >
        <div className="sm-panel-inner">
          <motion.ul
            className="sm-panel-list relative"
            role="list"
            variants={staggerList}
            initial="closed"
            animate={open ? "open" : "closed"}
          >
            {items && items.length ? (
              items.map((it, idx) => (
                <li className="sm-panel-itemWrap" key={it.label + idx}>
                  <a className="sm-panel-item block pr-14 relative group" href={it.link} aria-label={it.ariaLabel} onClick={closeMenu}>
                    <motion.span className="sm-panel-itemLabel inline-block origin-bottom-left" variants={itemVariants}>
                      {it.label}
                    </motion.span>
                    {displayItemNumbering && (
                      <motion.span
                        className="absolute right-0 top-1 text-lg font-normal text-[var(--sm-accent,#5227ff)] pointer-events-none select-none group-hover:opacity-100"
                        variants={numVariants}
                      >
                        {(idx + 1).toString().padStart(2, '0')}
                      </motion.span>
                    )}
                  </a>
                </li>
              ))
            ) : (
              <li className="sm-panel-itemWrap" aria-hidden="true">
                <span className="sm-panel-item">
                  <span className="sm-panel-itemLabel">No items</span>
                </span>
              </li>
            )}
          </motion.ul>

          {displaySocials && socialItems && socialItems.length > 0 && (
            <motion.div
              className="sm-socials"
              aria-label="Social links"
              variants={staggerList}
              initial="closed"
              animate={open ? "open" : "closed"}
            >
              <motion.h3 className="sm-socials-title" variants={socialVariants}>Socials</motion.h3>
              <ul className="sm-socials-list" role="list">
                {socialItems.map((s, i) => (
                  <motion.li key={s.label + i} className="sm-socials-item" variants={socialVariants}>
                    <a href={s.link} target="_blank" rel="noopener noreferrer" className="sm-socials-link">
                      {s.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </motion.aside>
    </div>
  );
};

export default StaggeredMenu;
