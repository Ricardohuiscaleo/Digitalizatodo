import { useEffect, useRef, useState } from 'react';

export const useLazyReveal = (threshold = 0.15) => {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
            { threshold }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return { ref, visible };
};

export const revealClass = (visible: boolean) =>
    `transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`;

export const revealStyle = (delay: number) => ({ transitionDelay: `${delay}ms` });
