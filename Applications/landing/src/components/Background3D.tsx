import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';


function Stars(props: any) {
    const ref = useRef<any>(null);
    const count = props.count || 1000;

    const sphere = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const radius = 1.5;
        for (let i = 0; i < count; i++) {
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            const r = radius * Math.cbrt(Math.random());

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        return positions;
    }, [count]);

    useFrame(() => {
        if (ref.current) {
            const scrollPos = typeof window !== 'undefined' ? window.scrollY : 0;
            ref.current.rotation.x = scrollPos * 0.0005;
            ref.current.rotation.y = scrollPos * 0.0003;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#00FF7F"
                    size={0.005}
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={0.8}
                />
            </Points>
        </group>
    );
}

export function Background3D() {
    const [particleCount, setParticleCount] = useState<number | null>(null);

    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        const isLowEnd = navigator.hardwareConcurrency <= 4;
        if (isMobile) {
            setParticleCount(0); // Still disabled on mobile
        } else if (isLowEnd) {
            setParticleCount(250); // Lowered even more
        } else {
            setParticleCount(350); // Lowered for maximum fluidity
        }
    }, []);

    if (particleCount === null || particleCount === 0) return null;

    return (
        <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none opacity-80">
            <Canvas
                camera={{ position: [0, 0, 1] }}
                gl={{
                    antialias: false,
                    powerPreference: "high-performance",
                    alpha: true,
                    stencil: false,
                    depth: false
                }}
                dpr={1} // Force 1:1 pixel ratio for max fluidity
            >
                <Stars count={particleCount} />
            </Canvas>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black/90 pointer-events-none z-10"></div>
        </div>
    );
}
