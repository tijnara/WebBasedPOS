// src/components/landing/RefillSimulatorGame.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
    Droplets,
    Sparkles,
    ShieldCheck,
    RotateCcw,
    Trophy,
    Maximize2,
    Minimize2,
    Volume2,
    VolumeX,
    CheckCircle2,
    AlertTriangle,
    Shuffle,
    CloudCheck,
    X
} from 'lucide-react';
import { isWebGLAvailable } from '../SafeWebGL';
import { buildRoundCarboy3D, buildSlimContainer3D } from './WaterStation3DModel';
import { waterSoundEngine } from '../../utils/waterSoundEngine';
import {
    useRefillGamePlayer,
    useRefillGameLeaderboard,
    useRecordRefillRun
} from '../../hooks/useRefillGame';

function RefillBay2DFallback({ jugType, phase, sanitizePct, liters, darkMode, stationName }) {
    const fillRatio = Math.min(1, Math.max(0, liters / 20));
    const isOverflow = liters > 20.08;
    const waterHeight = Math.round(fillRatio * 88);
    const waterY = 148 - waterHeight;

    return (
        <div className="w-full h-full flex items-center justify-center relative select-none">
            <svg className="w-44 h-44 sm:w-48 sm:h-48 drop-shadow-md" viewBox="0 0 180 180" fill="none">
                {/* Overhead Dispensing Nozzle */}
                <rect x="82" y="6" width="16" height="18" rx="3" fill="#64748b" />
                <rect x="76" y="22" width="28" height="7" rx="3" fill="#94a3b8" />
                <rect x="86" y="29" width="8" height="10" rx="2" fill="#cbd5e1" />

                {/* Ozone Sanitize Cone */}
                {phase === 'sanitize' && sanitizePct > 0 && sanitizePct < 100 && (
                    <polygon
                        points="86,39 94,39 124,148 56,148"
                        fill="#38bdf8"
                        fillOpacity="0.22"
                    />
                )}

                {/* Pouring Water Stream */}
                {phase === 'fill' && liters > 0 && !isOverflow && (
                    <rect
                        x="87"
                        y="39"
                        width="6"
                        height={Math.max(12, waterY - 37)}
                        fill="#38bdf8"
                        fillOpacity="0.85"
                    />
                )}

                {jugType === 'round' ? (
                    <>
                        {/* Round 20L Carboy */}
                        <path
                            d="M78 44H102C102 52 124 57 124 70V142C124 150 118 156 110 156H70C62 156 56 150 56 142V70C56 57 78 52 78 44Z"
                            fill={darkMode ? 'rgba(56,189,248,0.18)' : 'rgba(186,230,253,0.45)'}
                            stroke="#0284c7"
                            strokeWidth="2.5"
                        />
                        {fillRatio > 0.01 && (
                            <rect
                                x="58"
                                y={waterY}
                                width="64"
                                height={waterHeight + 6}
                                rx="6"
                                fill={isOverflow ? '#ef4444' : '#38bdf8'}
                                fillOpacity="0.8"
                            />
                        )}
                        {/* Sweet-Spot 20.0L Ring */}
                        <line
                            x1="52"
                            y1="62"
                            x2="128"
                            y2="62"
                            stroke={isOverflow ? '#ef4444' : '#8DB600'}
                            strokeWidth="2"
                            strokeDasharray="4 3"
                        />
                        {/* Cap */}
                        {(phase === 'cap' || phase === 'result') && (
                            <rect
                                x="76"
                                y={phase === 'result' ? '36' : '28'}
                                width="28"
                                height="9"
                                rx="3"
                                fill="#f8fafc"
                                stroke="#94a3b8"
                            />
                        )}
                    </>
                ) : (
                    <>
                        {/* Slim 20L Container */}
                        <rect x="60" y="46" width="60" height="110" rx="12" fill="#8DB600" />
                        <rect x="66" y="64" width="8" height="84" rx="4" fill="#0f172a" fillOpacity="0.45" />
                        {fillRatio > 0.01 && (
                            <rect
                                x="67"
                                y={Math.max(66, 146 - Math.round(fillRatio * 80))}
                                width="6"
                                height={Math.min(80, Math.round(fillRatio * 80))}
                                rx="3"
                                fill={isOverflow ? '#ef4444' : '#38bdf8'}
                            />
                        )}
                        <rect x="78" y="68" width="34" height="44" rx="5" fill="#ffffff" />
                        <text x="95" y="92" textAnchor="middle" fill="#0369a1" fontSize="7.5" fontWeight="900">
                            {stationName.slice(0, 8).toUpperCase()}
                        </text>
                        <line
                            x1="54"
                            y1="66"
                            x2="126"
                            y2="66"
                            stroke={isOverflow ? '#ef4444' : '#a3e635'}
                            strokeWidth="2"
                            strokeDasharray="4 3"
                        />
                        {(phase === 'cap' || phase === 'result') && (
                            <rect
                                x="78"
                                y={phase === 'result' ? '38' : '30'}
                                width="24"
                                height="9"
                                rx="3"
                                fill="#0265d2"
                            />
                        )}
                    </>
                )}

                {/* Stainless Drip Tray */}
                <rect x="34" y="157" width="112" height="10" rx="4" fill="#64748b" />
            </svg>
        </div>
    );
}

export default function RefillSimulatorGame({
                                                darkMode = false,
                                                stationName = 'SEASIDE',
                                                tdsLabel = 'TDS: 002 PPM'
                                            }) {
    const inlineMountRef = useRef(null);
    const expandedMountRef = useRef(null);

    // Database Player Identity (Auto-generated random name for guests; zero input required)
    const { identity, savedPlayer, rerollGuestName } = useRefillGamePlayer();
    const { data: leaderboard = [], isLoading: isLoadingBoard } = useRefillGameLeaderboard(8);
    const recordRun = useRecordRefillRun();

    const [jugType, setJugType] = useState('round'); // 'round' | 'slim'
    const [phase, setPhase] = useState('sanitize'); // 'sanitize' | 'fill' | 'cap' | 'result'
    const [sanitizePct, setSanitizePct] = useState(0);
    const [liters, setLiters] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [jugsCompleted, setJugsCompleted] = useState(0);
    const [lastResult, setLastResult] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [hasHydratedStats, setHasHydratedStats] = useState(false);
    const [webglUnavailable, setWebglUnavailable] = useState(false);

    // Hydrate cumulative score & completed jugs from Supabase once loaded
    useEffect(() => {
        if (savedPlayer && !hasHydratedStats) {
            setScore(savedPlayer.total_score || 0);
            setJugsCompleted(savedPlayer.jugs_completed || 0);
            setHasHydratedStats(true);
        }
    }, [savedPlayer, hasHydratedStats]);

    // Sync sound toggle with realistic water sound engine
    useEffect(() => {
        waterSoundEngine.setEnabled(soundEnabled);
    }, [soundEnabled]);

    // Stop any looping water/spray sound on unmount
    useEffect(() => {
        return () => {
            waterSoundEngine.stopAll();
        };
    }, []);

    // Live simulation state ref read at 60fps by the animation loop
    const simRef = useRef({
        jugType: 'round',
        phase: 'sanitize',
        sanitizePct: 0,
        liters: 0,
        isHolding: false,
        capAnim: 0,
        lastHudSync: 0,
        rotY: -0.15
    });

    simRef.current.jugType = jugType;
    simRef.current.phase = phase;

    const startNextJug = useCallback((nextType) => {
        waterSoundEngine.stopAll();
        const chosen = nextType || simRef.current.jugType;
        if (nextType) setJugType(nextType);
        simRef.current.jugType = chosen;
        simRef.current.phase = 'sanitize';
        simRef.current.sanitizePct = 0;
        simRef.current.liters = 0;
        simRef.current.isHolding = false;
        simRef.current.capAnim = 0;
        simRef.current.rotY = chosen === 'slim' ? -0.28 : -0.14;

        setSanitizePct(0);
        setLiters(0);
        setLastResult(null);
        setPhase('sanitize');
    }, []);

    const finalizeFillAndSeal = useCallback(
        (finalLiters, isOverflow = false) => {
            waterSoundEngine.stopAll();
            simRef.current.isHolding = false;
            simRef.current.phase = 'result';
            simRef.current.capAnim = isOverflow ? 0 : 0.01;
            setPhase('result');
            setLiters(finalLiters);

            if (isOverflow || finalLiters > 20.08) {
                waterSoundEngine.playOverflowSlosh();
                setStreak(0);
                setLastResult({
                    grade: 'OVERFLOW',
                    liters: finalLiters.toFixed(2),
                    points: 0,
                    message: 'Spilled over 20.00 L! Release valve inside the green ring.'
                });

                if (identity) {
                    recordRun.mutate({
                        identity,
                        jugType: simRef.current.jugType,
                        litersFilled: finalLiters,
                        grade: 'OVERFLOW',
                        pointsEarned: 0,
                        streakCount: 0,
                        newTotalScore: score,
                        newJugsCompleted: jugsCompleted,
                        isPerfectSeal: false
                    });
                }
                return;
            }

            waterSoundEngine.playCapSnap();
            const diff = Math.abs(20.0 - finalLiters);
            const isPerfect = finalLiters >= 19.82 && finalLiters <= 20.05;
            const isGood = finalLiters >= 19.45 && finalLiters < 19.82;

            const nextStreak = isPerfect || isGood ? streak + 1 : 0;
            const earned = isPerfect
                ? 150 + nextStreak * 25
                : isGood
                    ? 100 + nextStreak * 10
                    : Math.max(25, Math.round((finalLiters / 20) * 70));

            if (isPerfect) {
                setTimeout(() => waterSoundEngine.playPerfectSeal(), 100);
            }

            const nextTotalScore = score + earned;
            const nextJugsCount = jugsCompleted + 1;
            const grade = isPerfect ? 'PERFECT SEAL' : isGood ? 'GOOD FILL' : 'UNDERFILLED';

            setScore(nextTotalScore);
            setStreak(nextStreak);
            setJugsCompleted(nextJugsCount);

            setLastResult({
                grade,
                liters: finalLiters.toFixed(2),
                points: earned,
                message: isPerfect
                    ? `Spot-on ${finalLiters.toFixed(2)} L! 3D sanitary cap locked.`
                    : isGood
                        ? `Clean ${finalLiters.toFixed(2)} L fill & seal! (${diff.toFixed(2)} L from 20.00 L)`
                        : `Sealed at ${finalLiters.toFixed(2)} L. Aim for 19.82–20.00 L for bonus points!`
            });

            if (identity) {
                recordRun.mutate({
                    identity,
                    jugType: simRef.current.jugType,
                    litersFilled: finalLiters,
                    grade,
                    pointsEarned: earned,
                    streakCount: nextStreak,
                    newTotalScore: nextTotalScore,
                    newJugsCompleted: nextJugsCount,
                    isPerfectSeal: isPerfect
                });
            }
        },
        [identity, jugsCompleted, recordRun, score, streak]
    );

    // Keep latest finalizeFillAndSeal in a ref so the loop never restarts mid-game
    const finalizeRef = useRef(finalizeFillAndSeal);
    finalizeRef.current = finalizeFillAndSeal;

    const handleHoldStart = useCallback(() => {
        const curPhase = simRef.current.phase;
        if (curPhase === 'sanitize') {
            simRef.current.isHolding = true;
            waterSoundEngine.startSanitizeSpray();
        } else if (curPhase === 'fill') {
            simRef.current.isHolding = true;
            waterSoundEngine.startWaterFlow(simRef.current.liters);
        } else if (curPhase === 'cap') {
            finalizeRef.current(simRef.current.liters, false);
        }
    }, []);

    const handleHoldEnd = useCallback(() => {
        if (!simRef.current.isHolding) return;
        simRef.current.isHolding = false;
        waterSoundEngine.stopAll();

        if (simRef.current.phase === 'sanitize') {
            setSanitizePct(Math.round(simRef.current.sanitizePct));
        } else if (simRef.current.phase === 'fill') {
            const currentL = simRef.current.liters;
            setLiters(Number(currentL.toFixed(2)));
            if (currentL >= 19.5 && currentL <= 20.08) {
                simRef.current.phase = 'cap';
                setPhase('cap');
            }
        }
    }, []);

    // Global pointerup / pointercancel + Spacebar support
    useEffect(() => {
        const onGlobalPointerRelease = () => {
            if (simRef.current.isHolding) {
                handleHoldEnd();
            }
        };

        const onKeyDown = (e) => {
            if (
                e.code === 'Space' &&
                document.activeElement?.tagName !== 'INPUT' &&
                document.activeElement?.tagName !== 'TEXTAREA'
            ) {
                const p = simRef.current.phase;
                if (p === 'sanitize' || p === 'fill' || p === 'cap') {
                    e.preventDefault();
                    if (!e.repeat) handleHoldStart();
                }
            }
        };

        const onKeyUp = (e) => {
            if (e.code === 'Space') handleHoldEnd();
        };

        window.addEventListener('pointerup', onGlobalPointerRelease);
        window.addEventListener('pointercancel', onGlobalPointerRelease);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('pointerup', onGlobalPointerRelease);
            window.removeEventListener('pointercancel', onGlobalPointerRelease);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [handleHoldStart, handleHoldEnd]);

    // Headless 2D Simulation Loop when WebGL is disabled in the browser
    useEffect(() => {
        if (!webglUnavailable) return;
        let rafId;
        let lastTime = performance.now();

        const tick2D = (now) => {
            const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
            lastTime = now;
            const st = simRef.current;

            if (st.isHolding) {
                if (st.phase === 'sanitize') {
                    st.sanitizePct = Math.min(100, st.sanitizePct + dt * 88);
                    if (st.sanitizePct >= 100) {
                        st.sanitizePct = 100;
                        st.isHolding = false;
                        st.phase = 'fill';
                        waterSoundEngine.stopSanitizeSpray();
                        waterSoundEngine.playSanitizeComplete();
                        setSanitizePct(100);
                        setPhase('fill');
                    }
                } else if (st.phase === 'fill') {
                    st.liters += dt * 6.2;
                    waterSoundEngine.updateWaterFlow(st.liters);
                    if (st.liters >= 20.3) {
                        st.liters = 20.3;
                        finalizeRef.current(20.3, true);
                    }
                }
            }

            if (now - st.lastHudSync > 50) {
                st.lastHudSync = now;
                if (st.phase === 'sanitize') setSanitizePct(Math.round(st.sanitizePct));
                if (st.phase === 'fill') setLiters(Number(st.liters.toFixed(2)));
            }

            rafId = requestAnimationFrame(tick2D);
        };

        rafId = requestAnimationFrame(tick2D);
        return () => cancelAnimationFrame(rafId);
    }, [webglUnavailable]);

    // Three.js 3D WebGL Refilling Bay Scene (Uses THREE.Timer + Safe WebGL Guard)
    useEffect(() => {
        const mount = isExpanded ? expandedMountRef.current : inlineMountRef.current;
        if (!mount || typeof window === 'undefined') return;

        if (!isWebGLAvailable()) {
            setWebglUnavailable(true);
            return;
        }

        let width = mount.clientWidth || 340;
        let height = mount.clientHeight || 225;

        let renderer = null;
        let roundCarboy = null;
        let slimContainer = null;
        let timer = null;
        let animationFrameId = null;

        const disposables = [];
        const trackGeo = (g) => {
            disposables.push(g);
            return g;
        };
        const trackMat = (m) => {
            disposables.push(m);
            return m;
        };

        let isDragging = false;
        let prevX = 0;
        const onPointerDown = (e) => {
            isDragging = true;
            prevX = e.clientX;
        };
        const onPointerMove = (e) => {
            if (!isDragging) return;
            simRef.current.rotY += (e.clientX - prevX) * 0.014;
            prevX = e.clientX;
        };
        const onPointerUp = () => {
            isDragging = false;
        };

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
        camera.position.set(0, 0.35, 7.6);

        const handleResize = () => {
            if (!mount || !renderer) return;
            width = mount.clientWidth || 340;
            height = mount.clientHeight || 225;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        try {
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            renderer.setSize(width, height);
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = darkMode ? 1.24 : 1.12;
            mount.appendChild(renderer.domElement);

            // 1. Studio Lighting
            scene.add(
                new THREE.AmbientLight(darkMode ? 0xe0f2fe : 0xffffff, darkMode ? 1.25 : 1.65)
            );

            const keyLight = new THREE.DirectionalLight(0xffffff, darkMode ? 2.5 : 2.2);
            keyLight.position.set(4.5, 6.5, 5.5);
            scene.add(keyLight);

            const aquaLight = new THREE.PointLight(0x38bdf8, darkMode ? 5.2 : 3.4, 20);
            aquaLight.position.set(-4.2, 2.5, 3.8);
            scene.add(aquaLight);

            const limeLight = new THREE.PointLight(0x8db600, darkMode ? 4.4 : 2.8, 20);
            limeLight.position.set(4.2, -1.5, 3.5);
            scene.add(limeLight);

            // Bay Stage Group
            const bayGroup = new THREE.Group();
            bayGroup.position.y = -0.25;
            scene.add(bayGroup);

            // 2. 3D Stainless Steel Slotted Drip Tray Base
            const trayMat = trackMat(
                new THREE.MeshStandardMaterial({
                    color: darkMode ? 0x64748b : 0x94a3b8,
                    metalness: 0.72,
                    roughness: 0.28
                })
            );
            const trayBase = new THREE.Mesh(
                trackGeo(new THREE.BoxGeometry(3.2, 0.16, 2.3)),
                trayMat
            );
            trayBase.position.y = -1.56;
            bayGroup.add(trayBase);

            const slotMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x0f172a }));
            const slotGeo = trackGeo(new THREE.BoxGeometry(0.11, 0.02, 1.75));
            for (let sx = -1.25; sx <= 1.25; sx += 0.28) {
                const slot = new THREE.Mesh(slotGeo, slotMat);
                slot.position.set(sx, -1.475, 0);
                bayGroup.add(slot);
            }

            const puddleMesh = new THREE.Mesh(
                trackGeo(new THREE.CylinderGeometry(1.38, 1.44, 0.03, 36)),
                trackMat(
                    new THREE.MeshPhysicalMaterial({
                        color: 0x38bdf8,
                        transparent: true,
                        opacity: 0.65,
                        roughness: 0.08
                    })
                )
            );
            puddleMesh.position.y = -1.46;
            puddleMesh.visible = false;
            bayGroup.add(puddleMesh);

            // 3. 3D Stainless Steel Overhead Dispensing Nozzle
            const nozzleGroup = new THREE.Group();
            nozzleGroup.position.set(0, 2.02, 0);

            const pipeMesh = new THREE.Mesh(
                trackGeo(new THREE.CylinderGeometry(0.16, 0.16, 0.55, 28)),
                trayMat
            );
            pipeMesh.position.y = 0.28;
            nozzleGroup.add(pipeMesh);

            const collarMesh = new THREE.Mesh(
                trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 28)),
                trayMat
            );
            nozzleGroup.add(collarMesh);

            const statusLedMat = trackMat(
                new THREE.MeshStandardMaterial({
                    color: 0x38bdf8,
                    emissive: 0x38bdf8,
                    emissiveIntensity: 1.4
                })
            );
            const statusLedRing = new THREE.Mesh(
                trackGeo(new THREE.TorusGeometry(0.245, 0.02, 10, 32)),
                statusLedMat
            );
            statusLedRing.rotation.x = Math.PI / 2;
            nozzleGroup.add(statusLedRing);

            const tipMesh = new THREE.Mesh(
                trackGeo(new THREE.CylinderGeometry(0.08, 0.075, 0.22, 24)),
                trackMat(
                    new THREE.MeshStandardMaterial({
                        color: 0xe2e8f0,
                        metalness: 0.85,
                        roughness: 0.18
                    })
                )
            );
            tipMesh.position.y = -0.15;
            nozzleGroup.add(tipMesh);

            bayGroup.add(nozzleGroup);

            // 4. Actual 3D Round Carboy & 3D Slim Container Models
            roundCarboy = buildRoundCarboy3D({
                darkMode,
                stationName,
                initialFill: simRef.current.liters / 20,
                withCap: false
            });
            bayGroup.add(roundCarboy.group);

            slimContainer = buildSlimContainer3D({
                darkMode,
                stationName,
                tdsLabel,
                initialFill: simRef.current.liters / 20,
                withCap: false,
                showSightGauge: true
            });
            bayGroup.add(slimContainer.group);

            // 5. 3D Target Fill Sweet-Spot Ring (20.0 L Gauge at y = +0.80)
            const targetRingMat = trackMat(
                new THREE.MeshStandardMaterial({
                    color: 0x8db600,
                    emissive: 0x8db600,
                    emissiveIntensity: 0.8,
                    transparent: true,
                    opacity: 0.72
                })
            );
            const targetRingMesh = new THREE.Mesh(
                trackGeo(new THREE.TorusGeometry(1.02, 0.018, 12, 48)),
                targetRingMat
            );
            targetRingMesh.rotation.x = Math.PI / 2;
            targetRingMesh.position.y = 0.8;
            bayGroup.add(targetRingMesh);

            // 6. Stage 1: 3D Dust Motes + Volumetric Ozone Sanitizer Spray Cone
            const moteGeo = trackGeo(new THREE.SphereGeometry(0.038, 10, 10));
            const moteMat = trackMat(
                new THREE.MeshStandardMaterial({
                    color: 0xfacc15,
                    emissive: 0xca8a04,
                    emissiveIntensity: 0.5,
                    transparent: true,
                    opacity: 0.8
                })
            );
            const dustMotes = Array.from({ length: 16 }, (_, idx) => {
                const m = new THREE.Mesh(moteGeo, moteMat);
                const angle = (idx / 16) * Math.PI * 2;
                const r = 0.35 + (idx % 4) * 0.14;
                const y = -1.1 + ((idx * 37) % 100) / 100 * 1.85;
                m.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
                bayGroup.add(m);
                return { mesh: m, angle, r, baseY: y };
            });

            const ozoneConeGeo = trackGeo(new THREE.ConeGeometry(0.88, 2.75, 32, 1, true));
            const ozoneConeMat = trackMat(
                new THREE.MeshBasicMaterial({
                    color: 0x38bdf8,
                    transparent: true,
                    opacity: 0.26,
                    side: THREE.DoubleSide,
                    depthWrite: false
                })
            );
            const ozoneConeMesh = new THREE.Mesh(ozoneConeGeo, ozoneConeMat);
            ozoneConeMesh.position.y = 0.35;
            ozoneConeMesh.visible = false;
            bayGroup.add(ozoneConeMesh);

            // 7. Stage 2: 3D Pressurized Pouring Water Stream & Splash Droplets
            const jetGeo = trackGeo(new THREE.CylinderGeometry(0.055, 0.068, 1, 20));
            jetGeo.translate(0, -0.5, 0);
            const jetMat = trackMat(
                new THREE.MeshPhysicalMaterial({
                    color: 0x7dd3fc,
                    emissive: 0x38bdf8,
                    emissiveIntensity: 0.55,
                    transparent: true,
                    opacity: 0.88,
                    roughness: 0.05
                })
            );
            const waterJetMesh = new THREE.Mesh(jetGeo, jetMat);
            waterJetMesh.position.set(0, 1.76, 0);
            waterJetMesh.visible = false;
            bayGroup.add(waterJetMesh);

            const splashGeo = trackGeo(new THREE.SphereGeometry(0.025, 8, 8));
            const splashMat = trackMat(
                new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.9 })
            );
            const splashes = Array.from({ length: 18 }, () => {
                const mesh = new THREE.Mesh(splashGeo, splashMat);
                mesh.visible = false;
                bayGroup.add(mesh);
                return { mesh, vx: 0, vy: 0, vz: 0, life: 0 };
            });

            // 8. Stage 3: Expanding 3D Apple-Green Hygiene Seal Ring
            const sealRingGeo = trackGeo(new THREE.TorusGeometry(0.32, 0.02, 10, 36));
            sealRingGeo.rotateX(Math.PI / 2);
            const sealRingMat = trackMat(
                new THREE.MeshBasicMaterial({
                    color: 0x8db600,
                    transparent: true,
                    opacity: 0
                })
            );
            const sealRingMesh = new THREE.Mesh(sealRingGeo, sealRingMat);
            sealRingMesh.position.y = 1.56;
            bayGroup.add(sealRingMesh);

            mount.addEventListener('pointerdown', onPointerDown);
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
            window.addEventListener('resize', handleResize);

            // Use THREE.Timer (replaces deprecated THREE.Clock)
            timer = new THREE.Timer();
            timer.connect?.(document);
            let lastTime = performance.now();

            const animate = (now) => {
                if (!renderer || !timer) return;
                timer.update(now);
                const t = timer.getElapsed();
                const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
                lastTime = now;
                const st = simRef.current;

                if (st.isHolding) {
                    if (st.phase === 'sanitize') {
                        st.sanitizePct = Math.min(100, st.sanitizePct + dt * 88);
                        if (st.sanitizePct >= 100) {
                            st.sanitizePct = 100;
                            st.isHolding = false;
                            st.phase = 'fill';
                            waterSoundEngine.stopSanitizeSpray();
                            waterSoundEngine.playSanitizeComplete();
                            setSanitizePct(100);
                            setPhase('fill');
                        }
                    } else if (st.phase === 'fill') {
                        st.liters += dt * 6.2;
                        waterSoundEngine.updateWaterFlow(st.liters);
                        if (st.liters >= 20.3) {
                            st.liters = 20.3;
                            finalizeRef.current(20.3, true);
                        }
                    }
                }

                if (st.phase === 'result' && st.capAnim > 0 && st.capAnim < 1) {
                    st.capAnim = Math.min(1, st.capAnim + dt * 4.2);
                }

                if (now - st.lastHudSync > 50) {
                    st.lastHudSync = now;
                    if (st.phase === 'sanitize') setSanitizePct(Math.round(st.sanitizePct));
                    if (st.phase === 'fill') setLiters(Number(st.liters.toFixed(2)));
                }

                const isRound = st.jugType === 'round';
                roundCarboy.group.visible = isRound;
                slimContainer.group.visible = !isRound;

                const targetNozzleZ = isRound ? 0 : 0.44;
                nozzleGroup.position.z += (targetNozzleZ - nozzleGroup.position.z) * 0.16;
                waterJetMesh.position.z = nozzleGroup.position.z;

                if (st.liters > 20.08) {
                    statusLedMat.color.setHex(0xef4444);
                    statusLedMat.emissive.setHex(0xef4444);
                } else if (st.phase === 'sanitize') {
                    statusLedMat.color.setHex(0x38bdf8);
                    statusLedMat.emissive.setHex(0x38bdf8);
                } else {
                    statusLedMat.color.setHex(0x8db600);
                    statusLedMat.emissive.setHex(0x8db600);
                }

                const activeGroup = isRound ? roundCarboy.group : slimContainer.group;
                const idleSpin = isDragging
                    ? 0
                    : st.isHolding && st.phase === 'sanitize'
                        ? Math.sin(t * 9) * 0.18
                        : Math.sin(t * 0.6) * 0.14;
                activeGroup.rotation.y = st.rotY + idleSpin;

                const fillFraction = Math.min(1.02, st.liters / 20.0);
                const capState =
                    st.phase === 'cap'
                        ? 'hover'
                        : st.phase === 'result' && st.capAnim > 0
                            ? 'snapping'
                            : 'hidden';

                if (isRound) {
                    roundCarboy.update(t, {
                        fillFraction,
                        isPouring: st.phase === 'fill' && st.isHolding,
                        capState,
                        capProgress: st.capAnim
                    });
                } else {
                    slimContainer.update(t, {
                        fillFraction,
                        capState,
                        capProgress: st.capAnim
                    });
                }

                const inSweetSpot = st.liters >= 19.5 && st.liters <= 20.08;
                const isOverflow = st.liters > 20.08;
                targetRingMesh.visible = st.phase === 'fill' || st.phase === 'cap';
                targetRingMesh.scale.set(isRound ? 1 : 0.92, isRound ? 1 : 1.15, 1);
                targetRingMat.color.setHex(isOverflow ? 0xef4444 : 0x8db600);
                targetRingMat.emissive.setHex(isOverflow ? 0xef4444 : 0x8db600);
                targetRingMat.emissiveIntensity = inSweetSpot ? 1.8 + Math.sin(t * 14) * 0.6 : 0.75;

                puddleMesh.visible = isOverflow;

                const showMotes = st.phase === 'sanitize';
                const visibleCount = showMotes
                    ? Math.ceil(dustMotes.length * (1 - st.sanitizePct / 100))
                    : 0;
                dustMotes.forEach((m, idx) => {
                    m.mesh.visible = idx < visibleCount;
                    if (m.mesh.visible) {
                        const spin = t * 1.4 + m.angle;
                        m.mesh.position.x = Math.cos(spin) * m.r;
                        m.mesh.position.z = Math.sin(spin) * m.r;
                        m.mesh.position.y = m.baseY + Math.sin(t * 2.5 + idx) * 0.05;
                    }
                });

                ozoneConeMesh.visible = st.phase === 'sanitize' && st.isHolding;
                if (ozoneConeMesh.visible) {
                    ozoneConeMesh.position.z = nozzleGroup.position.z;
                    ozoneConeMat.opacity = 0.2 + Math.sin(t * 22) * 0.08;
                }

                const pouringNow = st.phase === 'fill' && st.isHolding;
                waterJetMesh.visible = pouringNow;
                const waterSurfaceWorldY = -1.38 + Math.min(1, fillFraction) * 2.2;
                if (pouringNow) {
                    const streamLen = Math.max(0.2, 1.76 - waterSurfaceWorldY);
                    waterJetMesh.scale.set(
                        0.9 + Math.sin(t * 32) * 0.12,
                        streamLen,
                        0.9 + Math.cos(t * 32) * 0.12
                    );
                }

                splashes.forEach((sp) => {
                    if (pouringNow && sp.life <= 0) {
                        sp.life = 1;
                        sp.mesh.position.set(
                            (Math.random() - 0.5) * 0.12,
                            waterSurfaceWorldY + 0.03,
                            nozzleGroup.position.z + (Math.random() - 0.5) * 0.12
                        );
                        sp.vx = (Math.random() - 0.5) * 1.4;
                        sp.vy = 1.1 + Math.random() * 1.2;
                        sp.vz = (Math.random() - 0.5) * 1.4;
                    }
                    if (sp.life > 0) {
                        sp.mesh.visible = true;
                        sp.mesh.position.x += sp.vx * dt;
                        sp.mesh.position.y += sp.vy * dt;
                        sp.mesh.position.z += sp.vz * dt;
                        sp.vy -= 4.8 * dt;
                        sp.life -= dt * 2.4;
                        sp.mesh.scale.setScalar(Math.max(0.1, sp.life));
                    } else {
                        sp.mesh.visible = false;
                    }
                });

                if (st.phase === 'result' && st.capAnim > 0.35 && st.capAnim < 1) {
                    const ringT = (st.capAnim - 0.35) / 0.65;
                    sealRingMesh.visible = true;
                    sealRingMesh.position.set(0, isRound ? 1.56 : 1.22, nozzleGroup.position.z);
                    sealRingMesh.scale.setScalar(1 + ringT * 2.4);
                    sealRingMat.opacity = (1 - ringT) * 0.85;
                } else {
                    sealRingMesh.visible = false;
                }

                renderer.render(scene, camera);
                animationFrameId = requestAnimationFrame(animate);
            };

            animationFrameId = requestAnimationFrame(animate);
        } catch (err) {
            console.warn('RefillSimulatorGame switched to 2D fallback (WebGL unavailable):', err?.message || err);
            window.__SEASIDE_DISABLE_3D__ = true;
            setWebglUnavailable(true);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            mount.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);

            timer?.dispose?.();
            roundCarboy?.dispose?.();
            slimContainer?.dispose?.();
            disposables.forEach((d) => d?.dispose?.());
            if (renderer) {
                renderer.dispose();
                if (renderer.domElement && mount.contains(renderer.domElement)) {
                    mount.removeChild(renderer.domElement);
                }
            }
        };
    }, [darkMode, isExpanded, stationName, tdsLabel]);

    const rankLabel =
        jugsCompleted >= 8
            ? 'Station Master'
            : jugsCompleted >= 4
                ? 'Bay Specialist'
                : jugsCompleted >= 1
                    ? 'Junior Operator'
                    : 'Trainee';

    const renderGameContent = (expanded = false) => (
        <div
            className={`flex flex-col justify-between h-full select-none ${
                expanded ? 'p-5 sm:p-6 gap-4' : 'gap-2'
            }`}
        >
            {/* Top Scoreboard, Auto-Assigned Guest Alias & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-950/75 p-0.5 rounded-lg border border-slate-300/60 dark:border-white/10">
                    <button
                        type="button"
                        onClick={() => startNextJug('round')}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${
                            jugType === 'round'
                                ? 'bg-[#8DB600] text-white shadow-2xs'
                                : 'text-slate-600 dark:text-slate-300'
                        }`}
                    >
                        Round 20L
                    </button>
                    <button
                        type="button"
                        onClick={() => startNextJug('slim')}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${
                            jugType === 'slim'
                                ? 'bg-[#8DB600] text-white shadow-2xs'
                                : 'text-slate-600 dark:text-slate-300'
                        }`}
                    >
                        Slim w/ Faucet
                    </button>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setShowLeaderboard((prev) => !prev)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-black transition-colors cursor-pointer"
                        title="View saved guest & staff leaderboard"
                    >
                        <Trophy className="w-3 h-3" />
                        <span>{score}</span>
                        {streak > 1 && <span className="text-[#8DB600]">x{streak}</span>}
                    </button>

                    <button
                        type="button"
                        onClick={() => setSoundEnabled((s) => !s)}
                        className="p-1 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-[#8DB600] cursor-pointer"
                        title={soundEnabled ? 'Mute water sound effects' : 'Enable water sound effects'}
                    >
                        {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsExpanded((prev) => !prev)}
                        className="p-1 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-[#8DB600] cursor-pointer"
                        title={expanded ? 'Exit full bay view' : 'Expand 3D refill bay'}
                    >
                        {expanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                    </button>
                </div>
            </div>

            {/* Interactive Three.js 3D Refilling Bay Viewport (with 2D Fallback) */}
            <div
                className={`relative w-full rounded-2xl overflow-hidden border border-slate-200/70 dark:border-white/10 bg-gradient-to-b from-cyan-500/5 via-transparent to-lime-500/10 ${
                    expanded ? 'h-[320px] sm:h-[370px]' : 'h-[210px] sm:h-[235px]'
                }`}
            >
                {webglUnavailable ? (
                    <RefillBay2DFallback
                        jugType={jugType}
                        phase={phase}
                        sanitizePct={sanitizePct}
                        liters={liters}
                        darkMode={darkMode}
                        stationName={stationName}
                    />
                ) : (
                    <div
                        ref={expanded ? expandedMountRef : inlineMountRef}
                        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
                        title="Drag horizontally to inspect 3D container"
                    />
                )}

                {/* Top-Left Digital Liters & Step Pill Overlay */}
                <div className="pointer-events-none absolute top-2 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/85 dark:bg-slate-950/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-[10px] font-mono font-black">
                    <span className="text-[#659000] dark:text-[#a3d100]">
                        {phase === 'sanitize'
                            ? `SANITARY: ${sanitizePct}%`
                            : `${liters.toFixed(2)} / 20.00 L`}
                    </span>
                </div>

                {/* Top-Right Operator Rank Pill */}
                <div className="pointer-events-none absolute top-2 right-2.5 px-2 py-0.5 rounded-md bg-white/85 dark:bg-slate-950/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {rankLabel} ({jugsCompleted})
                </div>

                {/* Bottom Auto-Generated Guest / Player Identity & Sync Badge */}
                {identity && (
                    <div className="absolute bottom-2 inset-x-2.5 flex items-center justify-between gap-2 pointer-events-none">
                        <div className="pointer-events-auto inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/85 dark:bg-slate-950/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-[9.5px] font-bold text-slate-700 dark:text-slate-200 max-w-[72%]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8DB600] shrink-0" />
                            <span className="truncate">{identity.playerName}</span>
                            {identity.isGuest && (
                                <button
                                    type="button"
                                    onClick={rerollGuestName}
                                    className="text-slate-400 hover:text-[#8DB600] transition-colors cursor-pointer shrink-0"
                                    title="Generate new random guest name"
                                >
                                    <Shuffle className="w-2.5 h-2.5" />
                                </button>
                            )}
                        </div>

                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/85 dark:bg-slate-950/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400">
                            <CloudCheck
                                className={`w-3 h-3 ${
                                    recordRun.isPending
                                        ? 'text-amber-500 animate-pulse'
                                        : 'text-[#8DB600]'
                                }`}
                            />
                            <span>{recordRun.isPending ? 'Saving...' : 'Saved'}</span>
                        </div>
                    </div>
                )}

                {/* Saved Database Leaderboard Drawer */}
                {showLeaderboard && (
                    <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-md flex flex-col p-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black uppercase tracking-wider">
                                <Trophy className="w-3.5 h-3.5" />
                                <span>Top Refillers (Live DB)</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowLeaderboard(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                            {isLoadingBoard ? (
                                <p className="text-[11px] text-slate-400 text-center py-6">
                                    Loading leaderboard...
                                </p>
                            ) : leaderboard.length === 0 ? (
                                <p className="text-[11px] text-slate-400 text-center py-6">
                                    No saved runs yet — complete a refill to claim #1!
                                </p>
                            ) : (
                                leaderboard.map((row, idx) => {
                                    const isMe = row.player_key === identity?.playerKey;
                                    return (
                                        <div
                                            key={row.id || row.player_key}
                                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[10.5px] border ${
                                                isMe
                                                    ? 'bg-[#8DB600]/20 border-[#8DB600]/50 text-white'
                                                    : 'bg-white/5 border-white/10 text-slate-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="font-mono font-black text-amber-400 w-4 shrink-0">
                                                    #{idx + 1}
                                                </span>
                                                <span className="font-bold truncate">
                                                    {row.player_name}
                                                </span>
                                                <span className="text-[8.5px] uppercase px-1.5 py-0.2 rounded bg-white/10 text-slate-300 shrink-0">
                                                    {row.is_guest ? 'Guest' : 'Staff'}
                                                </span>
                                            </div>
                                            <div className="font-mono font-black text-[#a3d100] shrink-0 ml-2">
                                                {row.total_score} pts
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* Result Overlay Card */}
                {phase === 'result' && lastResult && !showLeaderboard && (
                    <div className="absolute inset-0 z-20 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-2xl p-3.5 max-w-[260px] w-full text-center shadow-xl space-y-2">
                            <div className="flex items-center justify-center gap-1.5">
                                {lastResult.grade === 'OVERFLOW' ? (
                                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 text-[#8DB600]" />
                                )}
                                <span
                                    className={`text-xs font-black uppercase tracking-wider ${
                                        lastResult.grade === 'OVERFLOW'
                                            ? 'text-rose-500'
                                            : 'text-[#659000] dark:text-[#a3d100]'
                                    }`}
                                >
                                    {lastResult.grade}
                                </span>
                            </div>

                            <div className="text-xl font-mono font-black text-slate-900 dark:text-white">
                                {lastResult.liters} L{' '}
                                {lastResult.points > 0 && (
                                    <span className="text-xs text-[#8DB600]">+{lastResult.points} pts</span>
                                )}
                            </div>

                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                                {lastResult.message}
                            </p>

                            <button
                                type="button"
                                onClick={() => startNextJug()}
                                className="w-full py-2 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Next 3D Container</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Tactile Primary Action Control */}
            <div className="flex items-center gap-2">
                {phase === 'sanitize' && (
                    <button
                        type="button"
                        onPointerDown={handleHoldStart}
                        onPointerUp={handleHoldEnd}
                        onPointerCancel={handleHoldEnd}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 touch-none select-none active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Step 1: Hold to Ozone Sanitize ({sanitizePct}%)</span>
                    </button>
                )}

                {phase === 'fill' && (
                    <>
                        <button
                            type="button"
                            onPointerDown={handleHoldStart}
                            onPointerUp={handleHoldEnd}
                            onPointerCancel={handleHoldEnd}
                            style={{
                                background:
                                    'linear-gradient(135deg, #8DB600 0%, #65a30d 55%, #0d9488 100%)'
                            }}
                            className="flex-1 py-2.5 px-3 rounded-xl text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 touch-none select-none active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <Droplets className="w-3.5 h-3.5" />
                            <span>Step 2: Hold Valve ({liters.toFixed(1)}L / 20.0L)</span>
                        </button>
                        {liters >= 15 && (
                            <button
                                type="button"
                                onClick={() => {
                                    simRef.current.phase = 'cap';
                                    setPhase('cap');
                                }}
                                className="py-2.5 px-3 rounded-xl bg-slate-800 dark:bg-slate-700 text-white font-bold text-xs cursor-pointer active:scale-95"
                            >
                                Seal
                            </button>
                        )}
                    </>
                )}

                {phase === 'cap' && (
                    <button
                        type="button"
                        onClick={() => finalizeRef.current(simRef.current.liters, false)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#8DB600] to-emerald-600 text-white font-black text-xs shadow-md animate-pulse flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Step 3: Tap to Snap Sanitary Cap!</span>
                    </button>
                )}

                {phase === 'result' && (
                    <button
                        type="button"
                        onClick={() => startNextJug()}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Refill Another 3D Container</span>
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <>
            {!isExpanded && <div className="w-full h-full">{renderGameContent(false)}</div>}

            {isExpanded && (
                <div className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 shadow-2xl overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#659000] dark:text-[#a3d100] block">
                                    {stationName.toUpperCase()} • 3D BAY 01 SIMULATOR
                                </span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {tdsLabel} • Sanitize, Fill to 20.0L &amp; Snap Seal
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsExpanded(false)}
                                className="px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                        {renderGameContent(true)}
                    </div>
                </div>
            )}
        </>
    );
}