// src/components/landing/LandingBackground.jsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Droplets, Activity } from 'lucide-react';
import { useStore } from '../../store/useStore';

const RISING_BUBBLES = [
    { left: '8%', size: 8, duration: '11s', delay: '0s' },
    { left: '16%', size: 12, duration: '14s', delay: '2.5s' },
    { left: '27%', size: 6, duration: '9.5s', delay: '1.2s' },
    { left: '38%', size: 10, duration: '13s', delay: '4s' },
    { left: '49%', size: 14, duration: '15s', delay: '0.8s' },
    { left: '58%', size: 7, duration: '10.5s', delay: '3.2s' },
    { left: '69%', size: 11, duration: '12.5s', delay: '1.8s' },
    { left: '78%', size: 8, duration: '11.5s', delay: '5s' },
    { left: '87%', size: 13, duration: '14.5s', delay: '2.1s' },
    { left: '94%', size: 7, duration: '10s', delay: '3.8s' }
];

export default function LandingBackground({ tilt = { x: 0, y: 0 } }) {
    const webglMountRef = useRef(null);
    const darkMode = useStore((s) => s.darkMode);

    // Subtle WebGL 3D Floating Water Droplet & Caustic Particle Field
    useEffect(() => {
        const mount = webglMountRef.current;
        if (!mount || typeof window === 'undefined') return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        camera.position.z = 12;

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'low-power'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setSize(window.innerWidth, window.innerHeight);
        mount.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0xffffff, darkMode ? 1.1 : 1.5);
        scene.add(ambient);

        const keyLight = new THREE.PointLight(0x38bdf8, darkMode ? 5 : 3.5, 40);
        keyLight.position.set(-6, 5, 8);
        scene.add(keyLight);

        const limeLight = new THREE.PointLight(0x8db600, darkMode ? 4.5 : 3.2, 40);
        limeLight.position.set(6, -4, 8);
        scene.add(limeLight);

        // 3D Teardrop Geometry
        const dropGeo = new THREE.SphereGeometry(0.32, 20, 20);
        const pos = dropGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const y = pos.getY(i);
            if (y > 0) {
                const taper = Math.max(0.12, 1 - (y / 0.32) * 0.65);
                pos.setX(i, pos.getX(i) * taper);
                pos.setZ(i, pos.getZ(i) * taper);
                pos.setY(i, y * 1.42);
            }
        }
        dropGeo.computeVertexNormals();

        const dropMat = new THREE.MeshPhysicalMaterial({
            color: darkMode ? 0x38bdf8 : 0x7dd3fc,
            emissive: 0x8db600,
            emissiveIntensity: darkMode ? 0.18 : 0.1,
            transparent: true,
            opacity: darkMode ? 0.45 : 0.55,
            roughness: 0.06,
            clearcoat: 1.0
        });

        const drops = Array.from({ length: 14 }, (_, idx) => {
            const mesh = new THREE.Mesh(dropGeo, dropMat);
            const x = ((idx * 37) % 100) / 100 * 18 - 9;
            const y = ((idx * 53) % 100) / 100 * 11 - 5.5;
            const z = ((idx * 29) % 100) / 100 * 5 - 3.5;
            const scale = 0.4 + (idx % 4) * 0.28;
            mesh.position.set(x, y, z);
            mesh.scale.setScalar(scale);
            scene.add(mesh);
            return {
                mesh,
                baseY: y,
                baseX: x,
                speed: 0.45 + (idx % 5) * 0.14,
                phase: idx * 0.9
            };
        });

        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onResize);

        let frameId;
        const clock = new THREE.Clock();

        const animate = () => {
            const t = clock.getElapsedTime();
            drops.forEach((d) => {
                d.mesh.position.y = d.baseY + Math.sin(t * d.speed + d.phase) * 0.45;
                d.mesh.position.x = d.baseX + Math.cos(t * d.speed * 0.7 + d.phase) * 0.25;
                d.mesh.rotation.z = Math.sin(t * 0.9 + d.phase) * 0.15;
                d.mesh.rotation.y = t * 0.35 + d.phase;
            });
            renderer.render(scene, camera);
            frameId = requestAnimationFrame(animate);
        };
        frameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', onResize);
            dropGeo.dispose();
            dropMat.dispose();
            renderer.dispose();
            if (renderer.domElement && mount.contains(renderer.domElement)) {
                mount.removeChild(renderer.domElement);
            }
        };
    }, [darkMode]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {/* Ambient Purified Water & Lime Caustic Glows */}
            <div className="absolute top-[6%] left-[3%] w-[42vw] h-[42vw] max-w-[540px] max-h-[540px] bg-[#8DB600]/22 dark:bg-[#8DB600]/18 rounded-full blur-[130px] animate-blob" />
            <div className="absolute bottom-[6%] right-[6%] w-[38vw] h-[38vw] max-w-[480px] max-h-[480px] bg-cyan-400/25 dark:bg-cyan-500/20 rounded-full blur-[115px] animate-blob animation-delay-2000" />
            <div className="absolute top-[42%] right-[32%] w-[24vw] h-[24vw] max-w-[320px] max-h-[320px] bg-emerald-300/25 dark:bg-emerald-500/15 rounded-full blur-[95px] animate-blob animation-delay-4000" />

            {/* Live Three.js WebGL 3D Floating Droplets Layer */}
            <div ref={webglMountRef} className="absolute inset-0 opacity-85" />

            {/* Realistic 3D Refractive Water Droplets (CSS Depth Layer) */}
            <div
                className="water-droplet-3d absolute top-[15%] right-[9%] w-24 h-28 sm:w-28 sm:h-32 animate-float-slow"
                style={{ transform: `translate3d(${tilt.y * -1.5}px, ${tilt.x * 1.5}px, 0)` }}
            />
            <div
                className="water-droplet-3d water-droplet-lime absolute bottom-[16%] left-[11%] w-28 h-32 sm:w-32 sm:h-36 animate-float-medium"
                style={{ transform: `translate3d(${tilt.y * 1.3}px, ${tilt.x * -1.3}px, 0)` }}
            />
            <div
                className="water-droplet-3d absolute top-[44%] left-[44%] w-14 h-16 sm:w-16 sm:h-20 animate-float-fast opacity-85"
                style={{ transform: `translate3d(${tilt.y * -2}px, ${tilt.x * 2}px, 0)` }}
            />
            <div
                className="hidden md:block water-droplet-3d water-droplet-lime absolute bottom-[12%] right-[38%] w-12 h-14 animate-float-slow opacity-75"
                style={{ transform: `translate3d(${tilt.y * 1.6}px, ${tilt.x * 1.2}px, 0)` }}
            />

            {/* Peripheral Floating 3D Glass Station Telemetry Pills */}
            <div
                className="hidden xl:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/60 dark:bg-slate-900/45 backdrop-blur-md border border-white/80 dark:border-cyan-400/20 shadow-[0_12px_30px_rgba(6,182,212,0.12)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.45)] absolute top-[21%] left-[41%] animate-float-medium opacity-75"
                style={{ transform: `translate3d(${tilt.y * -1.1}px, ${tilt.x * 1.1}px, 0)` }}
            >
                <div className="w-6 h-6 rounded-lg bg-cyan-500/15 dark:bg-cyan-400/15 flex items-center justify-center text-cyan-600 dark:text-cyan-300">
                    <Droplets className="w-3.5 h-3.5" />
                </div>
                <div className="leading-tight">
                    <span className="block text-[9px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                        21-Stage RO Filtration
                    </span>
                    <span className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        99.9% Purified Water
                    </span>
                </div>
            </div>

            <div
                className="hidden xl:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/60 dark:bg-slate-900/45 backdrop-blur-md border border-white/80 dark:border-[#8DB600]/25 shadow-[0_12px_30px_rgba(141,182,0,0.12)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.45)] absolute bottom-[22%] right-[6%] animate-float-slow opacity-75"
                style={{ transform: `translate3d(${tilt.y * 1.2}px, ${tilt.x * -1.2}px, 0)` }}
            >
                <div className="w-6 h-6 rounded-lg bg-[#8DB600]/15 flex items-center justify-center text-[#5f7d00] dark:text-[#a3d100]">
                    <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="leading-tight">
                    <span className="block text-[9px] font-black uppercase tracking-wider text-[#5f7d00] dark:text-[#a3d100]">
                        Station Live Sync
                    </span>
                    <span className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        POS • Refills • Delivery
                    </span>
                </div>
            </div>

            {/* Effervescent Rising Purified Water Micro-Bubbles */}
            {RISING_BUBBLES.map((b, idx) => (
                <span
                    key={idx}
                    className="water-micro-bubble"
                    style={{
                        left: b.left,
                        width: `${b.size}px`,
                        height: `${b.size}px`,
                        animationDuration: b.duration,
                        animationDelay: b.delay
                    }}
                />
            ))}

            {/* Subtle Undulating Coastal Water Waves along Bottom Horizon */}
            <div className="absolute bottom-0 inset-x-0 h-28 sm:h-36 overflow-hidden opacity-45 dark:opacity-25">
                <svg
                    className="w-[200%] h-full seaside-wave-slow"
                    viewBox="0 0 1440 160"
                    preserveAspectRatio="none"
                >
                    <path
                        fill="url(#seaside-wave-grad-1)"
                        d="M0,96 C240,144 480,48 720,96 C960,144 1200,48 1440,96 L1440,160 L0,160 Z"
                    />
                    <defs>
                        <linearGradient id="seaside-wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8DB600" stopOpacity="0.28" />
                            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.32" />
                            <stop offset="100%" stopColor="#8DB600" stopOpacity="0.28" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </div>
    );
}