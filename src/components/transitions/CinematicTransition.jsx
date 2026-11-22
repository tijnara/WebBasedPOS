// src/components/transitions/CinematicTransition.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { useStore } from '../../store/useStore';

export default function CinematicTransition({ onComplete, isRouteLoading = false }) {
    const canvasRef = useRef(null);
    const completedRef = useRef(false);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    const darkMode = useStore((s) => s.darkMode);
    const sessionLoaded = useStore((s) => s.sessionLoaded);
    const activeFetches = useIsFetching();

    const [liters, setLiters] = useState('0.0');
    const [statusText, setStatusText] = useState('OZONE & UV SANITIZING NOZZLE...');
    const [progressPercent, setProgressPercent] = useState(0);
    const [fadeOut, setFadeOut] = useState(false);

    // Real page-load readiness states
    const [domReady, setDomReady] = useState(() =>
        typeof document !== 'undefined' ? document.readyState === 'complete' : false
    );
    const [assetsReady, setAssetsReady] = useState(false);

    // Keep live readiness flags in a ref so the 60fps canvas loop reads latest values without restarting
    const readinessRef = useRef({
        domReady: false,
        routeReady: !isRouteLoading,
        sessionReady: Boolean(sessionLoaded),
        dataReady: activeFetches === 0,
        assetsReady: false
    });

    // 1. Track real browser document 'load' / readyState
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (document.readyState === 'complete') {
            setDomReady(true);
            return;
        }
        const handleLoad = () => setDomReady(true);
        window.addEventListener('load', handleLoad);
        return () => window.removeEventListener('load', handleLoad);
    }, []);

    // 2. Track real fonts & rendered <img> assets once route finishes
    useEffect(() => {
        if (isRouteLoading) {
            setAssetsReady(false);
            return;
        }

        let cancelled = false;
        let checkTimer = null;

        const verifyPageAssets = async () => {
            try {
                if (document.fonts?.ready) {
                    await document.fonts.ready;
                }
            } catch {
                // Ignore font API errors
            }

            const checkImages = () => {
                if (cancelled) return;
                const images = Array.from(document.querySelectorAll('img'));
                const allDecoded = images.every((img) => img.complete);
                if (allDecoded) {
                    setAssetsReady(true);
                } else {
                    checkTimer = setTimeout(checkImages, 80);
                }
            };

            requestAnimationFrame(checkImages);
        };

        verifyPageAssets();

        return () => {
            cancelled = true;
            if (checkTimer) clearTimeout(checkTimer);
        };
    }, [isRouteLoading]);

    // Sync latest readiness states into ref
    useEffect(() => {
        readinessRef.current = {
            domReady,
            routeReady: !isRouteLoading,
            sessionReady: Boolean(sessionLoaded),
            dataReady: activeFetches === 0,
            assetsReady
        };
    }, [domReady, isRouteLoading, sessionLoaded, activeFetches, assetsReady]);

    const triggerComplete = () => {
        if (completedRef.current) return;
        completedRef.current = true;
        if (onCompleteRef.current) onCompleteRef.current();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            triggerComplete();
            return;
        }

        let animationFrameId;
        const startTime = performance.now();
        let lastFrameTime = startTime;
        let displayProgress = 0; // Smoothed progress [0..1]
        let hasTriggeredFade = false;

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const width = window.innerWidth;
            const height = window.innerHeight;
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);

        // Physics-driven aeration bubbles
        const bubblePool = Array.from({ length: 85 }, () => ({
            active: false,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: Math.random() * 3.2 + 1.0,
            wobblePhase: Math.random() * Math.PI * 2,
            wobbleFreq: Math.random() * 0.08 + 0.035,
            wobbleAmp: Math.random() * 1.4 + 0.4,
            alpha: Math.random() * 0.65 + 0.25
        }));

        // Parabolic splash & mist droplets at the water surface
        const splashPool = Array.from({ length: 45 }, () => ({
            x: 0,
            y: 0,
            vx: (Math.random() - 0.5) * 3.5,
            vy: -(Math.random() * 3.4 + 1.1),
            radius: Math.random() * 2.0 + 0.7,
            life: Math.random()
        }));

        // Exterior chilled condensation micro-droplets on the jug wall
        const condensationDrops = Array.from({ length: 28 }, (_, idx) => ({
            rx: ((idx * 37) % 100) / 100 - 0.5,
            ry: 0.22 + (((idx * 53) % 72) / 100),
            r: idx % 3 === 0 ? 2.1 : 1.3
        }));

        const drawRoundedRect = (x, y, w, h, r) => {
            const radius = Math.min(r, w / 2, h / 2);
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + w - radius, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
            ctx.lineTo(x + w, y + h - radius);
            ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
            ctx.lineTo(x + radius, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        };

        const traceCarboyPath = (cx, jugX, jugY, jugW, jugH, inset = 0) => {
            const left = jugX + inset;
            const right = jugX + jugW - inset;
            const top = jugY + inset;
            const bottom = jugY + jugH - inset;
            const neckHalf = Math.max(14, 24 - inset * 0.6);
            const cornerR = Math.max(10, 22 - inset);

            ctx.beginPath();
            ctx.moveTo(cx - neckHalf, jugY - 24);
            ctx.lineTo(cx - neckHalf, top + 2);
            ctx.bezierCurveTo(cx - neckHalf, top + 20, left + 12, top + 26, left, top + 48);
            ctx.lineTo(left, bottom - cornerR);
            ctx.quadraticCurveTo(left, bottom, left + cornerR, bottom);
            ctx.lineTo(right - cornerR, bottom);
            ctx.quadraticCurveTo(right, bottom, right, bottom - cornerR);
            ctx.lineTo(right, top + 48);
            ctx.bezierCurveTo(right - 12, top + 26, cx + neckHalf, top + 20, cx + neckHalf, top + 2);
            ctx.lineTo(cx + neckHalf, jugY - 24);
            ctx.closePath();
        };

        const render = (now) => {
            const elapsed = now - startTime;
            const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
            lastFrameTime = now;

            const {
                domReady: isDom,
                routeReady,
                sessionReady,
                dataReady,
                assetsReady: isAssets
            } = readinessRef.current;

            // Compute target progress from real page-loading milestones
            let targetProgress = 0.12;
            if (isDom) targetProgress += 0.18;
            if (routeReady) targetProgress += 0.25;
            if (sessionReady) targetProgress += 0.15;
            if (dataReady) targetProgress += 0.14;
            if (isAssets) targetProgress += 0.16;

            if (elapsed > 8000) {
                targetProgress = 1;
            }

            if (targetProgress < 1) {
                const holdCeiling = Math.min(0.84, targetProgress);
                const step = (holdCeiling - displayProgress) * Math.min(1, dt * 1.4);
                displayProgress += Math.min(step, 0.22 * dt);
            } else {
                const maxSpeed = displayProgress < 0.85 ? 0.25 : 0.19;
                displayProgress = Math.min(1, displayProgress + maxSpeed * dt);
            }

            const progress = Math.min(1, Math.max(0, displayProgress));
            setProgressPercent(progress * 100);

            if (progress >= 0.965 && !hasTriggeredFade) {
                hasTriggeredFade = true;
                setFadeOut(true);
            }

            const rawFill = Math.max(0, Math.min(1, (progress - 0.08) / 0.77));
            const currentLiters = (rawFill * 20).toFixed(1);
            setLiters(currentLiters);

            if (!routeReady) {
                setStatusText('LOADING PAGE ROUTE & MODULES...');
            } else if (!sessionReady || !dataReady) {
                setStatusText('SYNCING STATION DATA & SETTINGS...');
            } else if (progress < 0.08) {
                setStatusText('OZONE & UV SANITIZING NOZZLE...');
            } else if (!isAssets || progress < 0.85) {
                setStatusText('DISPENSING 21-STAGE RO PURIFIED WATER...');
            } else if (progress < 0.94) {
                setStatusText('APPLYING SANITARY NON-SPILL SEAL...');
            } else {
                setStatusText('20.0L SEALED • PAGE READY');
            }

            const w = window.innerWidth;
            const h = window.innerHeight;
            const cx = w / 2;
            const cy = h / 2 + 8;

            ctx.clearRect(0, 0, w, h);

            // 1. THEME-SYNCED ATMOSPHERIC STUDIO BACKGROUND
            const bgGrad = ctx.createLinearGradient(0, 0, w, h);
            if (darkMode) {
                bgGrad.addColorStop(0, '#050a12');
                bgGrad.addColorStop(0.5, '#08131f');
                bgGrad.addColorStop(1, '#061018');
            } else {
                bgGrad.addColorStop(0, '#eef8db');
                bgGrad.addColorStop(0.45, '#ecfdf5');
                bgGrad.addColorStop(1, '#e0f2fe');
            }
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);

            const studioGlow = ctx.createRadialGradient(cx, cy - 10, 20, cx, cy, 420);
            if (darkMode) {
                studioGlow.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
                studioGlow.addColorStop(0.45, 'rgba(141, 182, 0, 0.14)');
                studioGlow.addColorStop(1, 'rgba(6, 11, 19, 0)');
            } else {
                studioGlow.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
                studioGlow.addColorStop(0.5, 'rgba(141, 182, 0, 0.16)');
                studioGlow.addColorStop(1, 'rgba(224, 242, 254, 0)');
            }
            ctx.fillStyle = studioGlow;
            ctx.fillRect(0, 0, w, h);

            // 2. REFILLING STATION STAINLESS BACKPLATE & DRIP TRAY
            const jugW = 196;
            const jugH = 276;
            const jugX = cx - jugW / 2;
            const jugY = cy - 92;
            const trayY = jugY + jugH + 4;

            const panelW = 280;
            const panelX = cx - panelW / 2;
            const panelTop = jugY - 115;
            const panelH = trayY - panelTop + 8;

            ctx.save();
            const steelBackGrad = ctx.createLinearGradient(panelX, 0, panelX + panelW, 0);
            if (darkMode) {
                steelBackGrad.addColorStop(0, 'rgba(15, 23, 42, 0.65)');
                steelBackGrad.addColorStop(0.25, 'rgba(30, 41, 59, 0.78)');
                steelBackGrad.addColorStop(0.5, 'rgba(51, 65, 85, 0.72)');
                steelBackGrad.addColorStop(0.75, 'rgba(30, 41, 59, 0.78)');
                steelBackGrad.addColorStop(1, 'rgba(15, 23, 42, 0.65)');
            } else {
                steelBackGrad.addColorStop(0, 'rgba(226, 232, 240, 0.55)');
                steelBackGrad.addColorStop(0.25, 'rgba(248, 250, 252, 0.85)');
                steelBackGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.92)');
                steelBackGrad.addColorStop(0.75, 'rgba(241, 245, 249, 0.85)');
                steelBackGrad.addColorStop(1, 'rgba(226, 232, 240, 0.55)');
            }
            drawRoundedRect(panelX, panelTop, panelW, panelH, 24);
            ctx.fillStyle = steelBackGrad;
            ctx.fill();
            ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.35)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            const barColor =
                progress >= 0.85
                    ? 'rgba(141, 182, 0, 0.85)'
                    : 'rgba(14, 165, 233, 0.75)';
            ctx.shadowColor = barColor;
            ctx.shadowBlur = 12;
            ctx.fillStyle = barColor;
            ctx.fillRect(panelX + 12, panelTop + 28, 3, panelH - 56);
            ctx.fillRect(panelX + panelW - 15, panelTop + 28, 3, panelH - 56);
            ctx.restore();

            ctx.save();
            ctx.shadowColor = darkMode ? 'rgba(0, 0, 0, 0.65)' : 'rgba(15, 23, 42, 0.18)';
            ctx.shadowBlur = 22;
            ctx.shadowOffsetY = 10;

            const trayGrad = ctx.createLinearGradient(cx - 175, trayY, cx + 175, trayY + 26);
            trayGrad.addColorStop(0, '#475569');
            trayGrad.addColorStop(0.3, '#94a3b8');
            trayGrad.addColorStop(0.5, '#cbd5e1');
            trayGrad.addColorStop(0.7, '#94a3b8');
            trayGrad.addColorStop(1, '#334155');
            drawRoundedRect(cx - 175, trayY, 350, 26, 8);
            ctx.fillStyle = trayGrad;
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(cx - 170, trayY + 1, 340, 2.5);
            ctx.fillStyle = '#0f172a';
            for (let rx = cx - 150; rx <= cx + 144; rx += 18) {
                drawRoundedRect(rx, trayY + 6, 9, 15, 3);
                ctx.fill();
            }

            if (rawFill > 0.03) {
                const causticGrad = ctx.createRadialGradient(cx, trayY, 8, cx, trayY, 120);
                causticGrad.addColorStop(0, `rgba(56, 189, 248, ${0.32 * rawFill})`);
                causticGrad.addColorStop(0.6, `rgba(141, 182, 0, ${0.18 * rawFill})`);
                causticGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
                ctx.fillStyle = causticGrad;
                ctx.fillRect(cx - 140, trayY - 8, 280, 18);
            }

            const impactVibration =
                progress >= 0.08 && progress <= 0.24
                    ? Math.sin(now * 0.08) * (1 - (progress - 0.08) / 0.16) * 0.85
                    : 0;

            ctx.save();
            ctx.translate(impactVibration, 0);

            // 3. 3D MOLDED CARRY HANDLE (RIGHT SIDE)
            ctx.save();
            const handleX = jugX + jugW - 2;
            const handleY = jugY + jugH * 0.44;

            const handleGrad = ctx.createLinearGradient(handleX, handleY - 46, handleX + 26, handleY + 46);
            handleGrad.addColorStop(0, '#38bdf8');
            handleGrad.addColorStop(0.5, '#0284c7');
            handleGrad.addColorStop(1, '#0369a1');

            ctx.beginPath();
            ctx.moveTo(handleX, handleY - 46);
            ctx.bezierCurveTo(handleX + 30, handleY - 44, handleX + 30, handleY + 44, handleX, handleY + 46);
            ctx.lineTo(handleX, handleY + 32);
            ctx.bezierCurveTo(handleX + 15, handleY + 30, handleX + 15, handleY - 30, handleX, handleY - 32);
            ctx.closePath();
            ctx.fillStyle = handleGrad;
            ctx.fill();
            ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();

            // 4. 3D POLYCARBONATE CONTAINER SHELL (BACK WALL)
            const waterMaxH = jugH * 0.86;
            const waterHeight = waterMaxH * rawFill;
            const waterSurfaceY = jugY + jugH - 8 - waterHeight;

            ctx.save();
            traceCarboyPath(cx, jugX, jugY, jugW, jugH, 0);
            const shellGrad = ctx.createLinearGradient(jugX, 0, jugX + jugW, 0);
            if (darkMode) {
                shellGrad.addColorStop(0, 'rgba(186, 230, 253, 0.24)');
                shellGrad.addColorStop(0.18, 'rgba(14, 165, 233, 0.08)');
                shellGrad.addColorStop(0.55, 'rgba(2, 132, 199, 0.05)');
                shellGrad.addColorStop(0.88, 'rgba(14, 165, 233, 0.14)');
                shellGrad.addColorStop(1, 'rgba(125, 211, 252, 0.28)');
            } else {
                shellGrad.addColorStop(0, 'rgba(255, 255, 255, 0.68)');
                shellGrad.addColorStop(0.18, 'rgba(186, 230, 253, 0.24)');
                shellGrad.addColorStop(0.55, 'rgba(224, 242, 254, 0.14)');
                shellGrad.addColorStop(0.88, 'rgba(14, 165, 233, 0.18)');
                shellGrad.addColorStop(1, 'rgba(255, 255, 255, 0.55)');
            }
            ctx.fillStyle = shellGrad;
            ctx.fill();
            ctx.restore();

            // 5. RISING PURIFIED WATER VOLUME, 3D MENISCUS & BUBBLES
            const isPouring = progress >= 0.08 && progress <= 0.85;
            const streamTaper =
                progress < 0.11
                    ? (progress - 0.08) / 0.03
                    : progress > 0.81
                        ? Math.max(0, (0.85 - progress) / 0.04)
                        : 1;

            if (rawFill > 0.005) {
                ctx.save();
                traceCarboyPath(cx, jugX, jugY, jugW, jugH, 3.5);
                ctx.clip();

                const waterGrad = ctx.createLinearGradient(jugX, waterSurfaceY, jugX + jugW, jugY + jugH);
                waterGrad.addColorStop(0, 'rgba(125, 211, 252, 0.88)');
                waterGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.82)');
                waterGrad.addColorStop(0.7, 'rgba(14, 165, 233, 0.86)');
                waterGrad.addColorStop(1, 'rgba(3, 105, 161, 0.94)');
                ctx.fillStyle = waterGrad;

                const waveAmp = isPouring ? 3.2 : 1.1 * Math.max(0, 1 - (progress - 0.85) * 6);
                ctx.beginPath();
                ctx.moveTo(jugX - 8, jugY + jugH + 10);
                ctx.lineTo(jugX - 8, waterSurfaceY);
                for (let wx = jugX - 8; wx <= jugX + jugW + 8; wx += 6) {
                    const distFromCenter = Math.abs(wx - cx);
                    const craterDip =
                        isPouring && distFromCenter < 18
                            ? Math.cos((distFromCenter / 18) * (Math.PI / 2)) * 4.5 * streamTaper
                            : 0;
                    const waveY =
                        waterSurfaceY +
                        craterDip +
                        Math.sin(wx * 0.075 + now * 0.011) * waveAmp +
                        Math.cos(wx * 0.04 - now * 0.008) * (waveAmp * 0.5);
                    ctx.lineTo(wx, waveY);
                }
                ctx.lineTo(jugX + jugW + 8, jugY + jugH + 10);
                ctx.closePath();
                ctx.fill();

                const surfaceRadiusX = Math.max(20, jugW / 2 - 6);
                const surfaceGrad = ctx.createRadialGradient(
                    cx,
                    waterSurfaceY,
                    4,
                    cx,
                    waterSurfaceY,
                    surfaceRadiusX
                );
                surfaceGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
                surfaceGrad.addColorStop(0.35, 'rgba(186, 230, 253, 0.55)');
                surfaceGrad.addColorStop(1, 'rgba(56, 189, 248, 0.25)');

                ctx.fillStyle = surfaceGrad;
                ctx.beginPath();
                ctx.ellipse(cx, waterSurfaceY, surfaceRadiusX, 7.5, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(cx, waterSurfaceY, surfaceRadiusX - 1, 7, 0, 0, Math.PI);
                ctx.stroke();

                bubblePool.forEach((b) => {
                    if (!b.active && isPouring && Math.random() < 0.32) {
                        b.active = true;
                        b.x = cx + (Math.random() - 0.5) * 14;
                        b.y = waterSurfaceY + 4;
                        b.vx = (Math.random() - 0.5) * 2.5;
                        b.vy = Math.random() * 3.8 + 1.9;
                    }

                    if (!b.active) return;

                    b.vy -= 0.14;
                    b.vx *= 0.96;
                    b.wobblePhase += b.wobbleFreq;
                    b.x += b.vx + Math.sin(b.wobblePhase) * b.wobbleAmp * 0.35;
                    b.y += b.vy;

                    const minX = jugX + 14;
                    const maxX = jugX + jugW - 14;
                    if (b.x < minX) b.x = minX;
                    if (b.x > maxX) b.x = maxX;

                    if (b.y <= waterSurfaceY + 2 && b.vy < 0) {
                        b.active = false;
                        return;
                    }

                    if (b.y > jugY + jugH - 10) {
                        b.y = jugY + jugH - 10;
                        b.vy = -Math.abs(b.vy) * 0.5;
                    }

                    ctx.beginPath();
                    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha * 0.45})`;
                    ctx.fill();
                    ctx.strokeStyle = `rgba(255, 255, 255, ${b.alpha * 0.85})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();

                    if (b.radius > 1.8) {
                        ctx.beginPath();
                        ctx.arc(
                            b.x - b.radius * 0.32,
                            b.y - b.radius * 0.32,
                            b.radius * 0.28,
                            0,
                            Math.PI * 2
                        );
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                        ctx.fill();
                    }
                });

                ctx.restore();
            }

            // 6. 3D MOLDED RIBS, GLASS HIGHLIGHTS & CONDENSATION
            [0.34, 0.54, 0.74].forEach((ratio) => {
                const ry = jugY + jugH * ratio;
                ctx.strokeStyle = darkMode
                    ? 'rgba(3, 105, 161, 0.65)'
                    : 'rgba(2, 132, 199, 0.45)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(cx, ry, jugW / 2 - 2, 11, 0, 0.06 * Math.PI, 0.94 * Math.PI);
                ctx.stroke();

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.ellipse(cx, ry - 1.5, jugW / 2 - 3, 10.5, 0, 0.1 * Math.PI, 0.9 * Math.PI);
                ctx.stroke();
            });

            condensationDrops.forEach((drop) => {
                const dx = cx + drop.rx * (jugW - 28);
                const dy = jugY + drop.ry * jugH;
                if (dy > waterSurfaceY + 6) {
                    ctx.beginPath();
                    ctx.arc(dx, dy, drop.r, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
                    ctx.fill();
                }
            });

            ctx.save();
            traceCarboyPath(cx, jugX, jugY, jugW, jugH, 0);
            ctx.strokeStyle = darkMode ? '#38bdf8' : '#0284c7';
            ctx.lineWidth = 3.2;
            ctx.stroke();

            const leftGloss = ctx.createLinearGradient(jugX + 14, 0, jugX + 34, 0);
            leftGloss.addColorStop(0, 'rgba(255, 255, 255, 0.62)');
            leftGloss.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
            ctx.fillStyle = leftGloss;
            ctx.beginPath();
            ctx.moveTo(jugX + 18, jugY + 42);
            ctx.lineTo(jugX + 31, jugY + 42);
            ctx.lineTo(jugX + 25, jugY + jugH - 22);
            ctx.lineTo(jugX + 14, jugY + jugH - 22);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
            drawRoundedRect(jugX + jugW - 22, jugY + 48, 6, jugH - 74, 3);
            ctx.fill();
            ctx.restore();

            const collarGrad = ctx.createLinearGradient(cx - 28, 0, cx + 28, 0);
            collarGrad.addColorStop(0, '#0369a1');
            collarGrad.addColorStop(0.35, '#38bdf8');
            collarGrad.addColorStop(0.7, '#0284c7');
            collarGrad.addColorStop(1, '#0c4a6e');
            drawRoundedRect(cx - 28, jugY - 12, 56, 10, 4);
            ctx.fillStyle = collarGrad;
            ctx.fill();

            // 7. STAINLESS STEEL DISPENSING NOZZLE & PRESSURIZED STREAM
            const nozzleY = jugY - 62;

            const pipeGrad = ctx.createLinearGradient(cx - 16, 0, cx + 16, 0);
            pipeGrad.addColorStop(0, '#334155');
            pipeGrad.addColorStop(0.35, '#e2e8f0');
            pipeGrad.addColorStop(0.65, '#94a3b8');
            pipeGrad.addColorStop(1, '#1e293b');
            ctx.fillStyle = pipeGrad;
            ctx.fillRect(cx - 15, nozzleY - 52, 30, 52);

            const valveGrad = ctx.createLinearGradient(cx - 24, 0, cx + 24, 0);
            valveGrad.addColorStop(0, '#475569');
            valveGrad.addColorStop(0.4, '#f1f5f9');
            valveGrad.addColorStop(1, '#334155');
            drawRoundedRect(cx - 24, nozzleY, 48, 14, 4);
            ctx.fillStyle = valveGrad;
            ctx.fill();

            const tipGrad = ctx.createLinearGradient(cx - 9, 0, cx + 9, 0);
            tipGrad.addColorStop(0, '#64748b');
            tipGrad.addColorStop(0.4, '#ffffff');
            tipGrad.addColorStop(1, '#475569');
            ctx.fillStyle = tipGrad;
            ctx.fillRect(cx - 8, nozzleY + 14, 16, 24);

            if (progress < 0.09) {
                const mistAlpha = Math.sin((progress / 0.09) * Math.PI) * 0.65;
                const mistGrad = ctx.createRadialGradient(
                    cx,
                    nozzleY + 42,
                    2,
                    cx,
                    nozzleY + 65,
                    50
                );
                mistGrad.addColorStop(0, `rgba(186, 230, 253, ${mistAlpha})`);
                mistGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
                ctx.fillStyle = mistGrad;
                ctx.fillRect(cx - 52, nozzleY + 36, 104, 72);
            }

            if (isPouring && streamTaper > 0.02) {
                const streamTopY = nozzleY + 38;
                const streamEndY = Math.min(jugY + jugH - 12, waterSurfaceY + 8);
                const halfStream = 5.5 * streamTaper;

                ctx.save();
                const jetGrad = ctx.createLinearGradient(cx - halfStream, 0, cx + halfStream, 0);
                jetGrad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
                jetGrad.addColorStop(0.35, 'rgba(125, 211, 252, 0.88)');
                jetGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.95)');
                jetGrad.addColorStop(1, 'rgba(56, 189, 248, 0.85)');

                ctx.fillStyle = jetGrad;
                ctx.beginPath();
                ctx.moveTo(cx - halfStream, streamTopY);
                ctx.lineTo(cx + halfStream, streamTopY);
                ctx.lineTo(cx + halfStream * 1.25, streamEndY);
                ctx.lineTo(cx - halfStream * 1.25, streamEndY);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
                ctx.lineWidth = 1.3;
                const streakOffset = (now * 0.38) % 24;
                for (let sy = streamTopY + streakOffset; sy < streamEndY - 8; sy += 24) {
                    ctx.beginPath();
                    ctx.moveTo(cx - halfStream * 0.35, sy);
                    ctx.lineTo(cx - halfStream * 0.45, sy + 11);
                    ctx.stroke();
                }

                splashPool.forEach((m) => {
                    ctx.beginPath();
                    ctx.arc(cx + m.x, waterSurfaceY + m.y, m.radius * streamTaper, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${m.life * 0.9})`;
                    ctx.fill();

                    m.x += m.vx;
                    m.y += m.vy;
                    m.vy += 0.22;
                    m.life -= 0.04;
                    if (m.life <= 0 || m.y > 4) {
                        m.life = 1;
                        m.x = (Math.random() - 0.5) * 14;
                        m.y = -1;
                        m.vx = (Math.random() - 0.5) * 3.5;
                        m.vy = -(Math.random() * 3.2 + 1.0);
                    }
                });

                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(cx, streamTopY + 1, 3.5 * streamTaper, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // 8. ANIMATED SANITARY NON-SPILL CAP SNAP & SEAL RING
            if (progress > 0.84) {
                const capT = Math.min(1, (progress - 0.84) / 0.06);
                const dropOffset = (1 - capT) * (1 - capT) * 28;
                const capY = jugY - 26 - dropOffset;

                ctx.save();
                ctx.globalAlpha = Math.min(1, capT * 2.2);

                const capGrad = ctx.createLinearGradient(cx - 26, 0, cx + 26, 0);
                capGrad.addColorStop(0, '#0369a1');
                capGrad.addColorStop(0.35, '#38bdf8');
                capGrad.addColorStop(0.7, '#0284c7');
                capGrad.addColorStop(1, '#0c4a6e');

                drawRoundedRect(cx - 26, capY, 52, 18, 4);
                ctx.fillStyle = capGrad;
                ctx.fill();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
                ctx.fillRect(cx - 22, capY + 2.5, 44, 3);

                drawRoundedRect(cx - 6, capY, 12, 26, 2);
                ctx.fillStyle = '#ef4444';
                ctx.fill();

                if (progress > 0.88) {
                    const ringT = Math.min(1, (progress - 0.88) / 0.12);
                    ctx.strokeStyle = `rgba(141, 182, 0, ${(1 - ringT) * 0.9})`;
                    ctx.lineWidth = 2.8 * (1 - ringT * 0.5);
                    ctx.beginPath();
                    ctx.ellipse(
                        cx,
                        jugY - 17,
                        28 + ringT * 52,
                        8 + ringT * 16,
                        0,
                        0,
                        Math.PI * 2
                    );
                    ctx.stroke();
                }

                ctx.restore();
            }

            ctx.restore();

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(render);
            } else {
                triggerComplete();
            }
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [darkMode]);

    return (
        <div
            className={`fixed inset-0 z-[99999] select-none overflow-hidden transition-opacity duration-300 ${
                fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
        >
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* Top Bay Monitor */}
            <div className="absolute top-0 inset-x-0 h-16 sm:h-20 bg-white/80 dark:bg-slate-950/75 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/10 flex items-center justify-between px-5 sm:px-10 z-20 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8DB600] opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#8DB600]" />
                    </div>
                    <div>
                        <span className="text-[10px] font-mono font-bold tracking-widest text-green-800 dark:text-[#a3d100] uppercase block">
                            SEASIDE WATER REFILLING STATION • BAY 01
                        </span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-wide">
                            20-LITER ROUND PURIFIED CONTAINER
                        </span>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-6 font-mono text-xs">
                    <div className="text-right">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">
                            Water Quality
                        </span>
                        <span className="font-bold text-[#659000] dark:text-[#a3d100]">
                            TDS: 002 PPM • 21-STAGE RO
                        </span>
                    </div>
                    <div className="text-right border-l border-slate-300 dark:border-white/15 pl-6">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">
                            Location
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                            Laois, Labrador, Pangasinan
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Digital Liters Meter HUD */}
            <div className="absolute bottom-6 sm:bottom-8 inset-x-0 flex flex-col items-center justify-center z-20 pointer-events-none px-4">
                <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/90 dark:border-white/15 rounded-3xl px-6 sm:px-8 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.16)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.65)] flex items-center gap-5 sm:gap-9">
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-mono font-black text-green-800 dark:text-[#a3d100] tabular-nums">
                            {liters}
                        </span>
                        <span className="text-sm font-mono font-bold text-slate-500 dark:text-slate-400">
                            / 20.0 L
                        </span>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-white/15" />

                    <div className="w-40 sm:w-60">
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-600 dark:text-slate-300 mb-1.5 gap-2">
                            <span className="text-green-700 dark:text-[#a3d100] font-bold uppercase truncate">
                                {statusText}
                            </span>
                            <span className="font-bold shrink-0">{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300/60 dark:border-white/10">
                            <div
                                className="h-full bg-gradient-to-r from-[#8DB600] via-emerald-400 to-cyan-400 transition-all duration-75 rounded-full"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Skip Button */}
            <button
                type="button"
                onClick={triggerComplete}
                className="absolute top-20 sm:top-24 right-5 sm:right-10 z-50 px-4 py-2 rounded-full bg-white/85 dark:bg-slate-900/75 hover:bg-[#8DB600] dark:hover:bg-[#8DB600] hover:text-white text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-white/15 hover:border-[#8DB600] text-xs font-bold transition-all active:scale-95 cursor-pointer backdrop-blur-md shadow-lg flex items-center gap-1.5"
            >
                <span>SKIP</span>
                <span>&rarr;</span>
            </button>
        </div>
    );
}