import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
// @ts-ignore
import * as random from 'maath/random/dist/maath-random.esm';

function Stars(props: any) {
    const ref = useRef<any>(null);

    // Generar posiciones aleatorias para las partículas
    const sphere = useMemo(() => {
        return random.inSphere(new Float32Array(3000), { radius: 1.5 });
    }, []);

    useFrame((state) => {
        if (ref.current) {
            // Rotación base muy lenta + reacción al scroll
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
                    color="#00FF7F" /* Accent color from original theme */
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
    return (
        <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none opacity-80">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <Stars />
            </Canvas>
            {/* Overlay gradiente radial subtil y semi-transparente para dar profundidad sin tapar la animación */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black/90 pointer-events-none z-10"></div>
        </div>
    );
}
