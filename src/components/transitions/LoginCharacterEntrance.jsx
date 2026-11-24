// src/components/transitions/LoginCharacterEntrance.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

const PAD_LEFT = 240;
const PAD_RIGHT = 520;
const PAD_TOP = 190;
const PAD_BOTTOM = 40;

const FUN_QUIPS = [
    'Here is your form! Fresh & purified!',
    'Ahhhh! Crisp Seaside water. Ready to log in!',
    'Stay hydrated, Boss! Let’s get started!'
];

function createSeasideShirtTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#8DB600';
    ctx.fillRect(0, 0, 512, 512);

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, 'rgba(255,255,255,0.14)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.16)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, 512, 34);
    ctx.fillRect(0, 484, 512, 28);

    const drawChestLogo = (cx, cy, isFront) => {
        ctx.save();
        ctx.translate(cx, cy);

        ctx.beginPath();
        ctx.arc(0, -18, 44, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#0284c7';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -44);
        ctx.bezierCurveTo(20, -20, 22, -4, 0, 4);
        ctx.bezierCurveTo(-22, -4, -20, -20, 0, -44);
        ctx.fillStyle = '#0ea5e9';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(-6, -16, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();

        ctx.font = '900 24px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('SEASIDE', 0, 52);

        if (isFront) {
            ctx.font = '700 11px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = '#e0f2fe';
            ctx.fillText('WATER STATION', 0, 68);
        }

        ctx.restore();
    };

    drawChestLogo(128, 220, true);
    drawChestLogo(384, 220, false);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
}

function createBoyFaceTexture(expression = 'normal') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f5c29b';
    ctx.fillRect(0, 0, 512, 512);

    const cx = 128;
    const cy = 265;

    ctx.fillStyle =
        expression === 'strain'
            ? 'rgba(239, 68, 68, 0.36)'
            : 'rgba(244, 114, 182, 0.30)';
    ctx.beginPath();
    ctx.ellipse(cx - 42, cy + 18, 17, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 42, cy + 18, 17, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 6.5;
    ctx.lineCap = 'round';

    if (expression === 'surprised') {
        ctx.beginPath();
        ctx.arc(cx - 28, cy - 28, 16, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 28, cy - 28, 16, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
    } else if (expression === 'strain') {
        ctx.beginPath();
        ctx.moveTo(cx - 44, cy - 30);
        ctx.lineTo(cx - 14, cy - 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 44, cy - 30);
        ctx.lineTo(cx + 14, cy - 20);
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.moveTo(cx - 42, cy - 26);
        ctx.quadraticCurveTo(cx - 28, cy - 34, cx - 14, cy - 26);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 14, cy - 26);
        ctx.quadraticCurveTo(cx + 28, cy - 34, cx + 42, cy - 26);
        ctx.stroke();
    }

    if (expression === 'blink') {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        ctx.moveTo(cx - 38, cy - 3);
        ctx.lineTo(cx - 18, cy - 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 18, cy - 3);
        ctx.lineTo(cx + 38, cy - 3);
        ctx.stroke();
    } else if (expression === 'strain') {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx - 38, cy - 11);
        ctx.lineTo(cx - 20, cy - 3);
        ctx.lineTo(cx - 38, cy + 5);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + 38, cy - 11);
        ctx.lineTo(cx + 20, cy - 3);
        ctx.lineTo(cx + 38, cy + 5);
        ctx.stroke();
    } else if (expression === 'proud') {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx - 28, cy + 1, 12, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 28, cy + 1, 12, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
    } else {
        const radiusY = expression === 'surprised' ? 15 : 13;
        const drawEye = (ex, ey) => {
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.ellipse(ex, ey, 10.5, radiusY, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ex - 3, ey - 4, 4.2, 0, Math.PI * 2);
            ctx.fill();
        };
        drawEye(cx - 28, cy - 4);
        drawEye(cx + 28, cy - 4);
    }

    if (expression === 'surprised') {
        ctx.fillStyle = '#7c2d12';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 28, 9, 11, 0, 0, Math.PI * 2);
        ctx.fill();
    } else if (expression === 'strain') {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.roundRect(cx - 22, cy + 21, 44, 15, 7);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - 20, cy + 28.5);
        ctx.lineTo(cx + 20, cy + 28.5);
        ctx.moveTo(cx - 7, cy + 22);
        ctx.lineTo(cx - 7, cy + 35);
        ctx.moveTo(cx + 7, cy + 22);
        ctx.lineTo(cx + 7, cy + 35);
        ctx.stroke();
    } else if (expression === 'proud') {
        ctx.fillStyle = '#7c2d12';
        ctx.beginPath();
        ctx.arc(cx, cy + 20, 22, 0.08 * Math.PI, 0.92 * Math.PI);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.arc(cx, cy + 33, 10, Math.PI, 0);
        ctx.fill();
    } else {
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, cy + 22, 21, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
}

function createSeasideBottleLabelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#8DB600';
    ctx.fillRect(0, 62, 256, 132);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 62, 256, 22);
    ctx.fillRect(0, 172, 256, 22);

    ctx.font = '900 32px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SEASIDE', 128, 126);

    ctx.font = '800 15px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#f0f9ff';
    ctx.fillText('PURIFIED WATER', 128, 152);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
}

function buildSeasideBoyRig() {
    const root = new THREE.Group();
    const disposables = [];

    const trackGeo = (g) => {
        disposables.push(g);
        return g;
    };
    const trackMat = (m) => {
        disposables.push(m);
        return m;
    };

    const shirtTex = createSeasideShirtTexture();
    const bottleLabelTex = createSeasideBottleLabelTexture();
    const faceTextures = {
        normal: createBoyFaceTexture('normal'),
        surprised: createBoyFaceTexture('surprised'),
        strain: createBoyFaceTexture('strain'),
        proud: createBoyFaceTexture('proud'),
        blink: createBoyFaceTexture('blink')
    };
    disposables.push(shirtTex, bottleLabelTex, ...Object.values(faceTextures));

    const skinMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xf5c29b, roughness: 0.62 }));
    const faceMat = trackMat(
        new THREE.MeshStandardMaterial({ map: faceTextures.normal, roughness: 0.58 })
    );
    const hairMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.8 }));
    const shirtMat = trackMat(new THREE.MeshStandardMaterial({ map: shirtTex, roughness: 0.52 }));
    const sleeveMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x8DB600, roughness: 0.52 }));
    const cuffMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.48 }));
    const shortsMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 }));
    const shoeMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.38 }));
    const soleMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.58 }));
    const waterBottleMat = trackMat(
        new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.65,
            roughness: 0.15
        })
    );
    const bottleLabelMat = trackMat(
        new THREE.MeshStandardMaterial({ map: bottleLabelTex, roughness: 0.45 })
    );
    const bottleCapMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 }));
    const shadowMat = trackMat(
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22 })
    );

    const shadowDisc = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(35, 24)), shadowMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.scale.set(1.15, 0.45, 1);
    shadowDisc.position.y = 1;
    root.add(shadowDisc);

    const hips = new THREE.Group();
    hips.position.y = 54;
    root.add(hips);

    const pelvisMesh = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(17, 18, 16, 20)),
        shortsMat
    );
    pelvisMesh.position.y = 4;
    hips.add(pelvisMesh);

    const torso = new THREE.Group();
    torso.position.y = 12;
    hips.add(torso);

    const chestMesh = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(19.5, 17, 42, 24)),
        shirtMat
    );
    chestMesh.position.y = 21;
    torso.add(chestMesh);

    const neckMesh = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(6.5, 7.5, 10, 16)),
        skinMat
    );
    neckMesh.position.y = 44;
    torso.add(neckMesh);

    const head = new THREE.Group();
    head.position.y = 64;
    torso.add(head);

    const headSphere = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(21, 28, 24)), faceMat);
    head.add(headSphere);

    const noseMesh = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(3.4, 12, 12)), skinMat);
    noseMesh.scale.set(0.9, 0.85, 1.3);
    noseMesh.position.set(0, -1, 20.8);
    head.add(noseMesh);

    const leftEar = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(4.2, 12, 12)), skinMat);
    leftEar.scale.set(0.55, 1.1, 0.8);
    leftEar.position.set(-20.5, -1, -1);
    head.add(leftEar);

    const rightEar = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(4.2, 12, 12)), skinMat);
    rightEar.scale.set(0.55, 1.1, 0.8);
    rightEar.position.set(20.5, -1, -1);
    head.add(rightEar);

    const hairCap = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(22.2, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.56)),
        hairMat
    );
    hairCap.rotation.x = -0.22;
    hairCap.position.set(0, 1.5, -1.5);
    head.add(hairCap);

    const tuft1 = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(8.5, 14, 14)), hairMat);
    tuft1.scale.set(1.3, 0.65, 0.9);
    tuft1.position.set(-5, 16, 14);
    head.add(tuft1);

    const tuft2 = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(7.5, 14, 14)), hairMat);
    tuft2.scale.set(1.2, 0.6, 0.85);
    tuft2.position.set(7, 15, 13.5);
    head.add(tuft2);

    const waterBottle = new THREE.Group();
    waterBottle.visible = false;

    const bottleBody = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(7.2, 7.2, 22, 18)),
        waterBottleMat
    );
    bottleBody.position.y = -4;
    waterBottle.add(bottleBody);

    const bottleLabel = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(7.4, 7.4, 10, 18, 1, true)),
        bottleLabelMat
    );
    bottleLabel.position.y = -4;
    waterBottle.add(bottleLabel);

    const bottleNeck = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(3.4, 5.5, 5, 14)),
        waterBottleMat
    );
    bottleNeck.position.y = 9.5;
    waterBottle.add(bottleNeck);

    const bottleCap = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(3.8, 3.8, 3.2, 14)),
        bottleCapMat
    );
    bottleCap.position.y = 13;
    waterBottle.add(bottleCap);

    const createArm = (side, attachBottle = false) => {
        const shoulderPivot = new THREE.Group();
        shoulderPivot.position.set(side * 23, 37, 0);

        const sleeve = new THREE.Mesh(
            trackGeo(new THREE.CylinderGeometry(6.8, 7.6, 15, 16)),
            sleeveMat
        );
        sleeve.position.y = -6;
        shoulderPivot.add(sleeve);

        const cuff = new THREE.Mesh(
            trackGeo(new THREE.CylinderGeometry(7.7, 7.7, 3, 16)),
            cuffMat
        );
        cuff.position.y = -13.5;
        shoulderPivot.add(cuff);

        const upperArm = new THREE.Mesh(
            trackGeo(new THREE.CylinderGeometry(5.4, 5.0, 8, 14)),
            skinMat
        );
        upperArm.position.y = -17;
        shoulderPivot.add(upperArm);

        const elbowPivot = new THREE.Group();
        elbowPivot.position.y = -20;
        shoulderPivot.add(elbowPivot);

        const forearm = new THREE.Mesh(
            trackGeo(new THREE.CylinderGeometry(5.0, 4.4, 16, 14)),
            skinMat
        );
        forearm.position.y = -8;
        elbowPivot.add(forearm);

        const hand = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(5.6, 14, 14)), skinMat);
        hand.position.y = -17;
        elbowPivot.add(hand);

        const thumb = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(2.4, 10, 10)), skinMat);
        thumb.position.set(-side * 4.2, -15.5, 3);
        elbowPivot.add(thumb);

        if (attachBottle) {
            waterBottle.position.set(0, -18, 8);
            elbowPivot.add(waterBottle);
        }

        torso.add(shoulderPivot);
        return { shoulder: shoulderPivot, elbow: elbowPivot };
    };

    const leftArm = createArm(-1, false);
    const rightArm = createArm(1, true);

    const createLeg = (side) => {
        const hipPivot = new THREE.Group();
        hipPivot.position.set(side * 9.5, -2, 0);

        const thigh = new THREE.Mesh(
            trackGeo(new THREE.CylinderGeometry(8.2, 7.4, 22, 16)),
            shortsMat
        );
        thigh.position.y = -11;
        hipPivot.add(thigh);

        const kneePivot = new THREE.Group();
        kneePivot.position.y = -22;
        hipPivot.add(kneePivot);

        const calf = new THREE.Mesh(
            trackGeo(new THREE.CylinderGeometry(5.8, 5.0, 22, 14)),
            skinMat
        );
        calf.position.y = -11;
        kneePivot.add(calf);

        const shoe = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(12, 8, 20)), shoeMat);
        shoe.position.set(0, -24, 3.5);
        kneePivot.add(shoe);

        const sole = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(12.6, 3, 20.6)), soleMat);
        sole.position.set(0, -28.5, 3.5);
        kneePivot.add(sole);

        hips.add(hipPivot);
        return { hip: hipPivot, knee: kneePivot };
    };

    const leftLeg = createLeg(-1);
    const rightLeg = createLeg(1);

    const sweatMat = trackMat(
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 })
    );
    const sweatGeo = trackGeo(new THREE.SphereGeometry(3.2, 10, 10));
    const sweatDrops = [0, 1].map(() => {
        const drop = new THREE.Mesh(sweatGeo, sweatMat);
        drop.scale.set(0.8, 1.35, 0.8);
        drop.visible = false;
        root.add(drop);
        return drop;
    });

    const dustMat = trackMat(
        new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.65 })
    );
    const dustGeo = trackGeo(new THREE.SphereGeometry(6, 10, 10));
    const dustPuffs = [0, 1, 2].map(() => {
        const puff = new THREE.Mesh(dustGeo, dustMat);
        puff.visible = false;
        root.add(puff);
        return puff;
    });

    let activeExpression = 'normal';
    const setExpression = (expr) => {
        if (activeExpression === expr) return;
        activeExpression = expr;
        faceMat.map = faceTextures[expr] || faceTextures.normal;
        faceMat.needsUpdate = true;
    };

    return {
        root,
        shadowDisc,
        hips,
        torso,
        head,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        waterBottle,
        sweatDrops,
        dustPuffs,
        setExpression,
        dispose: () => {
            disposables.forEach((item) => item.dispose?.());
        }
    };
}

function applySitAndSwingLegs(boy, now) {
    const swing = Math.sin(now * 0.0085);
    const kneeSwing = Math.cos(now * 0.0085);

    boy.hips.position.y = 35;
    boy.torso.rotation.x = 0.04;
    boy.head.rotation.z = 0.05 * Math.sin(now * 0.004);

    boy.leftLeg.hip.rotation.x = -1.2 + swing * 0.24;
    boy.leftLeg.knee.rotation.x = 0.82 + kneeSwing * 0.34;

    boy.rightLeg.hip.rotation.x = -1.2 - swing * 0.24;
    boy.rightLeg.knee.rotation.x = 0.82 - kneeSwing * 0.34;

    boy.leftArm.shoulder.rotation.z = 0.22;
    boy.leftArm.elbow.rotation.z = 0.35;
    boy.rightArm.shoulder.rotation.z = -0.22;
    boy.rightArm.elbow.rotation.z = -0.35;
}

export default function LoginCharacterEntrance({
                                                   children,
                                                   canRenderWebGL = true,
                                                   enabled = true
                                               }) {
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
    );
    const [cinematicCleared, setCinematicCleared] = useState(false);
    const [phase, setPhase] = useState('WAITING');
    const [subBeat, setSubBeat] = useState('WAVE');
    const [showBubble, setShowBubble] = useState(false);
    const [quipIndex, setQuipIndex] = useState(0);
    const [bubbleCoords, setBubbleCoords] = useState({
        x: 0,
        y: 0,
        visible: false
    });

    const stageWrapperRef = useRef(null);
    const desktopCanvasHostRef = useRef(null);
    const mobileCanvasHostRef = useRef(null);
    const cardSlotRef = useRef(null);
    const cardTransformRef = useRef(null);
    const phaseRef = useRef('WAITING');
    const subBeatRef = useRef('WAVE');
    const phaseStartRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
    const hopStartRef = useRef(0);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(min-width: 1024px)');
        const update = () => setIsDesktop(mq.matches);
        update();
        mq.addEventListener?.('change', update);
        return () => mq.removeEventListener?.('change', update);
    }, []);

    useEffect(() => {
        phaseRef.current = phase;
        phaseStartRef.current = typeof performance !== 'undefined' ? performance.now() : 0;
    }, [phase]);

    useEffect(() => {
        subBeatRef.current = subBeat;
    }, [subBeat]);

    useEffect(() => {
        if (!enabled) {
            setCinematicCleared(true);
            setPhase('DONE');
            return;
        }

        const markCleared = () => setCinematicCleared(true);

        if (typeof window !== 'undefined' && window.__SEASIDE_CINEMATIC_ACTIVE__) {
            window.addEventListener('seaside-cinematic-done', markCleared, { once: true });
            const safetyTimer = setTimeout(markCleared, 6500);
            return () => {
                window.removeEventListener('seaside-cinematic-done', markCleared);
                clearTimeout(safetyTimer);
            };
        } else {
            const briefDelay = setTimeout(markCleared, 120);
            return () => clearTimeout(briefDelay);
        }
    }, [enabled]);

    const handleSkip = useCallback(() => {
        setCinematicCleared(true);
        setPhase('DONE');
        setSubBeat('REFRESHED');
        setQuipIndex(0);
        setShowBubble(true);
        if (cardTransformRef.current) {
            cardTransformRef.current.style.transform = 'translate3d(0px, 0px, 0px) rotate(0deg)';
            cardTransformRef.current.style.opacity = '1';
        }
    }, []);

    const handleMascotPoke = useCallback(() => {
        if (phase !== 'DONE') return;
        hopStartRef.current = typeof performance !== 'undefined' ? performance.now() : 0;
        setQuipIndex((prev) => {
            const next = (prev + 1) % FUN_QUIPS.length;
            setSubBeat(next === 1 ? 'DRINK' : 'REFRESHED');
            return next;
        });
        setShowBubble(true);
    }, [phase]);

    useEffect(() => {
        if (!enabled || !canRenderWebGL) {
            setPhase('DONE');
            return;
        }
        if (!cinematicCleared) return;

        setPhase('WALK_IN');
        setSubBeat('WAVE');
        setShowBubble(false);

        const timers = [];

        if (!isDesktop) {
            timers.push(
                setTimeout(() => {
                    setPhase('SITTING_SWING');
                    setShowBubble(true);
                }, 1350)
            );
            return () => {
                timers.forEach((id) => clearTimeout(id));
            };
        }

        timers.push(
            setTimeout(() => {
                setPhase('SITTING_SWING');
                setShowBubble(true);
            }, 1350)
        );

        timers.push(
            setTimeout(() => {
                setPhase('THINKING');
                setShowBubble(true);
            }, 3250)
        );

        timers.push(
            setTimeout(() => {
                setShowBubble(false);
                setPhase('WALK_OUT');
            }, 4750)
        );

        timers.push(
            setTimeout(() => {
                setPhase('PUSHING');
                setShowBubble(true);
            }, 5550)
        );

        timers.push(
            setTimeout(() => {
                setPhase('DONE');
                setSubBeat('FORM_READY');
                setQuipIndex(0);
                setShowBubble(true);
            }, 8500)
        );

        timers.push(
            setTimeout(() => {
                setSubBeat('DRINK');
                setShowBubble(true);
            }, 9150)
        );

        timers.push(
            setTimeout(() => {
                setSubBeat('REFRESHED');
                setQuipIndex(1);
                setShowBubble(true);
            }, 11550)
        );

        timers.push(
            setTimeout(() => {
                setShowBubble(false);
            }, 15200)
        );

        return () => {
            timers.forEach((id) => clearTimeout(id));
        };
    }, [cinematicCleared, enabled, canRenderWebGL, isDesktop]);

    // Desktop 3D Three.js Stage (>= 1024px)
    useEffect(() => {
        if (!isDesktop || !canRenderWebGL || !desktopCanvasHostRef.current || !cardSlotRef.current) return;

        const container = desktopCanvasHostRef.current;
        const slotEl = cardSlotRef.current;

        const getStageSize = () => {
            const rect = slotEl.getBoundingClientRect();
            const cardW = Math.max(rect.width || 420, 320);
            const cardH = Math.max(rect.height || 480, 340);
            return {
                cardW,
                cardH,
                stageW: cardW + PAD_LEFT + PAD_RIGHT,
                stageH: cardH + PAD_TOP + PAD_BOTTOM
            };
        };

        let { cardW, cardH, stageW, stageH } = getStageSize();

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(
            -stageW / 2,
            stageW / 2,
            stageH / 2,
            -stageH / 2,
            1,
            1000
        );
        camera.position.set(0, 0, 400);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(stageW, stageH);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(renderer.domElement);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 1.38);
        hemiLight.position.set(0, 300, 200);
        scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
        dirLight.position.set(160, 260, 300);
        scene.add(dirLight);

        const rimLight = new THREE.DirectionalLight(0x8DB600, 0.55);
        rimLight.position.set(-200, 120, -150);
        scene.add(rimLight);

        const boy = buildSeasideBoyRig();
        scene.add(boy.root);

        const syncStageSize = () => {
            const next = getStageSize();
            if (next.stageW !== stageW || next.stageH !== stageH) {
                cardW = next.cardW;
                cardH = next.cardH;
                stageW = next.stageW;
                stageH = next.stageH;
                camera.left = -stageW / 2;
                camera.right = stageW / 2;
                camera.top = stageH / 2;
                camera.bottom = -stageH / 2;
                camera.updateProjectionMatrix();
                renderer.setSize(stageW, stageH);
            } else {
                cardW = next.cardW;
                cardH = next.cardH;
            }
        };

        const resizeObserver =
            typeof ResizeObserver !== 'undefined'
                ? new ResizeObserver(syncStageSize)
                : null;
        resizeObserver?.observe(slotEl);
        window.addEventListener('resize', syncStageSize);

        let rafId = 0;
        let lastBubbleUpdate = 0;

        const animate = (now) => {
            rafId = requestAnimationFrame(animate);

            const currentPhase = phaseRef.current;
            const currentBeat = subBeatRef.current;
            const elapsed = (now - phaseStartRef.current) / 1000;
            const scale = 1.06;
            boy.root.scale.setScalar(scale);

            const toWorldX = (localX) => localX + PAD_LEFT - stageW / 2;
            const toWorldY = (localY) => stageH / 2 - (localY + PAD_TOP);

            const feetLocalY = cardH - 22;
            let boyLocalX = -58;
            let boyLocalY = feetLocalY;
            let targetRotY = 0.25;
            let cardOffsetX = 0;
            let cardTiltDeg = 0;
            let cardOpacity = 1;

            const isBlinking = now % 3400 < 130;

            boy.torso.rotation.set(0, 0, 0);
            boy.head.rotation.set(0, 0, 0);
            boy.leftArm.shoulder.rotation.set(0, 0, 0);
            boy.leftArm.elbow.rotation.set(0, 0, 0);
            boy.rightArm.shoulder.rotation.set(0, 0, 0);
            boy.rightArm.elbow.rotation.set(0, 0, 0);
            boy.leftLeg.hip.rotation.set(0, 0, 0);
            boy.leftLeg.knee.rotation.set(0, 0, 0);
            boy.rightLeg.hip.rotation.set(0, 0, 0);
            boy.rightLeg.knee.rotation.set(0, 0, 0);
            boy.hips.position.y = 54;
            boy.shadowDisc.scale.set(1.15, 0.45, 1);
            boy.waterBottle.visible = false;

            boy.sweatDrops.forEach((d) => {
                d.visible = false;
            });
            boy.dustPuffs.forEach((p) => {
                p.visible = false;
            });

            if (currentPhase === 'WAITING') {
                boyLocalX = -180;
                cardOffsetX = cardW + 160;
                cardOpacity = 0;
            } else if (currentPhase === 'WALK_IN') {
                const progress = Math.min(elapsed / 1.3, 1);
                const ease = 1 - Math.pow(1 - progress, 3);
                const startX = -120;
                const stopX = cardW * 0.42;
                boyLocalX = startX + (stopX - startX) * ease;
                targetRotY = progress < 0.85 ? Math.PI / 2 : 0;

                const stride = Math.sin(now * 0.016) * (1 - progress * 0.88);
                boy.leftLeg.hip.rotation.x = stride * 0.65;
                boy.leftLeg.knee.rotation.x = Math.max(0, -stride) * 0.55;
                boy.rightLeg.hip.rotation.x = -stride * 0.65;
                boy.rightLeg.knee.rotation.x = Math.max(0, stride) * 0.55;

                boy.leftArm.shoulder.rotation.x = -stride * 0.55;
                boy.leftArm.elbow.rotation.x = -0.25;
                boy.rightArm.shoulder.rotation.x = stride * 0.55;
                boy.rightArm.elbow.rotation.x = -0.25;
                boy.hips.position.y = 54 + Math.abs(stride) * 3.8;
                boy.setExpression(isBlinking ? 'blink' : 'normal');

                cardOffsetX = cardW + 160;
                cardOpacity = 0;
            } else if (currentPhase === 'SITTING_SWING') {
                boyLocalX = cardW * 0.42;
                targetRotY = 0;
                applySitAndSwingLegs(boy, now);
                boy.setExpression(isBlinking ? 'blink' : 'normal');
                cardOffsetX = cardW + 160;
                cardOpacity = 0;
            } else if (currentPhase === 'THINKING') {
                boyLocalX = cardW * 0.42;
                targetRotY = 0;

                if (elapsed < 0.5) {
                    boy.setExpression('surprised');
                    boy.head.rotation.y = Math.sin(elapsed * 18) * 0.45;
                    boy.leftArm.shoulder.rotation.z = 0.35;
                    boy.leftArm.elbow.rotation.z = 0.6;
                    boy.rightArm.shoulder.rotation.z = -0.35;
                    boy.rightArm.elbow.rotation.z = -0.6;
                } else {
                    boy.setExpression(isBlinking ? 'blink' : 'normal');
                    const wave = Math.sin(now * 0.011);
                    boy.rightArm.shoulder.rotation.z = -2.35 + wave * 0.22;
                    boy.rightArm.elbow.rotation.z = -0.35 + wave * 0.18;
                    boy.rightArm.shoulder.rotation.x = -0.25;
                    boy.leftArm.shoulder.rotation.z = 0.18;
                    boy.head.rotation.z = 0.08 * Math.sin(now * 0.005);
                }
                boy.hips.position.y = 54 + Math.sin(now * 0.006) * 1.8;

                cardOffsetX = cardW + 160;
                cardOpacity = 0;
            } else if (currentPhase === 'WALK_OUT') {
                const progress = Math.min(elapsed / 0.82, 1);
                const runT = Math.max(0, (progress - 0.16) / 0.84);
                boyLocalX = cardW * 0.42 + (cardW + 190 - cardW * 0.42) * (runT * runT);
                targetRotY = Math.PI / 2;
                const jog = Math.sin(now * 0.026);
                boy.leftLeg.hip.rotation.x = jog * 0.9;
                boy.rightLeg.hip.rotation.x = -jog * 0.9;
                boy.leftArm.shoulder.rotation.x = -jog * 0.8;
                boy.rightArm.shoulder.rotation.x = jog * 0.8;
                cardOffsetX = cardW + 160;
                cardOpacity = 0;
            } else if (currentPhase === 'PUSHING') {
                // Slow, deliberate pull of the login form into place while facing toward the card (right)
                const progress = Math.min(elapsed / 2.85, 1);
                const slowPullEase = 1 - Math.pow(1 - progress, 2.2);
                const startOffset = Math.min(cardW + 100, PAD_RIGHT - 80);
                cardOffsetX = startOffset * (1 - slowPullEase);
                cardOpacity = Math.min(progress * 2.6, 1);
                cardTiltDeg = progress < 0.95 ? -0.9 * Math.sin(progress * Math.PI) : 0;

                boyLocalX = Math.max(cardOffsetX - 54, -64);
                targetRotY = Math.PI / 2;

                const pullStep = Math.sin(now * 0.015) * (1 - progress * 0.65);
                boy.torso.rotation.x = 0.28 + pullStep * 0.04;
                boy.head.rotation.x = -0.14;
                boy.leftArm.shoulder.rotation.x = -1.25 + pullStep * 0.14;
                boy.leftArm.elbow.rotation.x = -0.35;
                boy.rightArm.shoulder.rotation.x = -1.25 - pullStep * 0.14;
                boy.rightArm.elbow.rotation.x = -0.35;
                boy.leftLeg.hip.rotation.x = pullStep * 0.45 - 0.12;
                boy.leftLeg.knee.rotation.x = 0.28 + Math.max(0, -pullStep) * 0.3;
                boy.rightLeg.hip.rotation.x = -pullStep * 0.45 - 0.12;
                boy.rightLeg.knee.rotation.x = 0.28 + Math.max(0, pullStep) * 0.3;
                boy.hips.position.y = 51 + Math.abs(pullStep) * 2.4;
                boy.setExpression('strain');

                boy.sweatDrops.forEach((drop, idx) => {
                    const cycle = (now * 0.0022 + idx * 0.5) % 1;
                    const side = idx === 0 ? -1 : 1;
                    drop.visible = true;
                    drop.position.set(
                        side * (14 + cycle * 16),
                        124 + Math.sin(cycle * Math.PI) * 16 - cycle * 8,
                        12
                    );
                    drop.scale.setScalar(0.8 * (1 - cycle * 0.4));
                });
            } else {
                boyLocalX = -58;
                targetRotY = 0.25;

                let hopY = 0;
                if (hopStartRef.current > 0) {
                    const hopElapsed = (now - hopStartRef.current) / 1000;
                    if (hopElapsed < 0.5) {
                        hopY = Math.sin((hopElapsed / 0.5) * Math.PI) * 26;
                        boy.leftLeg.knee.rotation.x = 0.35;
                        boy.rightLeg.knee.rotation.x = 0.35;
                    } else {
                        hopStartRef.current = 0;
                    }
                }
                boyLocalY = feetLocalY - hopY;
                boy.shadowDisc.scale.set(
                    1.15 - (hopY / 26) * 0.35,
                    0.45 - (hopY / 26) * 0.15,
                    1
                );

                const idleBreath = Math.sin(now * 0.0045);
                boy.hips.position.y = 54 + idleBreath * 1.6;
                boy.leftArm.shoulder.rotation.z = 0.16 + idleBreath * 0.04;

                if (currentBeat === 'DRINK') {
                    boy.waterBottle.visible = true;
                    const gulp = Math.sin(now * 0.01);
                    boy.setExpression('proud');
                    boy.rightArm.shoulder.rotation.x = -1.62 + gulp * 0.06;
                    boy.rightArm.shoulder.rotation.z = -0.18;
                    boy.rightArm.elbow.rotation.x = -1.32 + gulp * 0.08;
                    boy.head.rotation.x = -0.28 + gulp * 0.05;
                    boy.waterBottle.rotation.x = 0.95;
                } else if (currentBeat === 'REFRESHED') {
                    boy.waterBottle.visible = true;
                    boy.setExpression('proud');
                    boy.rightArm.shoulder.rotation.x = -0.52;
                    boy.rightArm.shoulder.rotation.z = -0.24;
                    boy.rightArm.elbow.rotation.x = -0.62;
                    boy.head.rotation.z = 0.08 * Math.sin(now * 0.006);
                } else {
                    boy.setExpression(isBlinking ? 'blink' : hopY > 2 ? 'proud' : 'normal');
                    boy.rightArm.shoulder.rotation.z = -2.28 + Math.sin(now * 0.009) * 0.26;
                    boy.rightArm.elbow.rotation.z = -0.32 + Math.sin(now * 0.009) * 0.16;
                    boy.rightArm.shoulder.rotation.x = -0.22;
                    boy.head.rotation.y = Math.sin(now * 0.0028) * 0.14;
                }

                cardOffsetX = 0;
                cardTiltDeg = 0;
                cardOpacity = 1;
            }

            boy.root.position.set(toWorldX(boyLocalX), toWorldY(boyLocalY), 0);
            boy.root.rotation.y = targetRotY;

            if (cardTransformRef.current) {
                cardTransformRef.current.style.transform = `translate3d(${cardOffsetX.toFixed(1)}px, 0px, 0px) rotate(${cardTiltDeg.toFixed(2)}deg)`;
                cardTransformRef.current.style.opacity = String(cardOpacity);
            }

            if (now - lastBubbleUpdate > 50) {
                lastBubbleUpdate = now;
                const isVisible =
                    currentPhase === 'SITTING_SWING' ||
                    currentPhase === 'THINKING' ||
                    currentPhase === 'PUSHING' ||
                    currentPhase === 'DONE';
                setBubbleCoords({
                    x: boyLocalX,
                    y: boyLocalY - 148 * scale,
                    visible: isVisible
                });
            }

            renderer.render(scene, camera);
        };

        rafId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(rafId);
            resizeObserver?.disconnect();
            window.removeEventListener('resize', syncStageSize);
            boy.dispose();
            renderer.dispose();
            if (renderer.domElement.parentNode === container) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [isDesktop, canRenderWebGL]);

    // Mobile 3D Three.js Stage (< 1024px)
    useEffect(() => {
        if (isDesktop || !canRenderWebGL || !mobileCanvasHostRef.current || !cardSlotRef.current) return;

        const container = mobileCanvasHostRef.current;
        const slotEl = cardSlotRef.current;
        const MOBILE_STAGE_H = 188;

        const getMobileStageSize = () => {
            const rect = slotEl.getBoundingClientRect();
            const cardW = Math.max(rect.width || 340, 260);
            return { cardW, stageW: cardW, stageH: MOBILE_STAGE_H };
        };

        let { cardW, stageW, stageH } = getMobileStageSize();

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(
            -stageW / 2,
            stageW / 2,
            stageH / 2,
            -stageH / 2,
            1,
            1000
        );
        camera.position.set(0, 6, 400);
        camera.lookAt(0, 6, 0);

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(stageW, stageH);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(renderer.domElement);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 1.38);
        hemiLight.position.set(0, 300, 200);
        scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
        dirLight.position.set(160, 260, 300);
        scene.add(dirLight);

        const rimLight = new THREE.DirectionalLight(0x8DB600, 0.55);
        rimLight.position.set(-200, 120, -150);
        scene.add(rimLight);

        const boy = buildSeasideBoyRig();
        scene.add(boy.root);

        const syncMobileSize = () => {
            const next = getMobileStageSize();
            if (next.stageW !== stageW || next.stageH !== stageH) {
                cardW = next.cardW;
                stageW = next.stageW;
                stageH = next.stageH;
                camera.left = -stageW / 2;
                camera.right = stageW / 2;
                camera.top = stageH / 2;
                camera.bottom = -stageH / 2;
                camera.updateProjectionMatrix();
                renderer.setSize(stageW, stageH);
            } else {
                cardW = next.cardW;
            }
        };

        const resizeObserver =
            typeof ResizeObserver !== 'undefined'
                ? new ResizeObserver(syncMobileSize)
                : null;
        resizeObserver?.observe(slotEl);
        window.addEventListener('resize', syncMobileSize);

        let rafId = 0;

        const animate = (now) => {
            rafId = requestAnimationFrame(animate);

            const currentPhase = phaseRef.current;
            const elapsed = (now - phaseStartRef.current) / 1000;

            const scale = 0.96;
            boy.root.scale.setScalar(scale);

            const toWorldX = (localX) => localX - stageW / 2;
            const toWorldY = (localY) => stageH / 2 - localY;

            const topLineLocalY = 178;
            const centerX = cardW * 0.5;

            let boyLocalX = centerX;
            let boyLocalY = topLineLocalY;
            let targetRotY = 0;
            let boyVisible = true;

            const isBlinking = now % 3400 < 130;

            boy.torso.rotation.set(0, 0, 0);
            boy.head.rotation.set(0, 0, 0);
            boy.leftArm.shoulder.rotation.set(0, 0, 0);
            boy.leftArm.elbow.rotation.set(0, 0, 0);
            boy.rightArm.shoulder.rotation.set(0, 0, 0);
            boy.rightArm.elbow.rotation.set(0, 0, 0);
            boy.leftLeg.hip.rotation.set(0, 0, 0);
            boy.leftLeg.knee.rotation.set(0, 0, 0);
            boy.rightLeg.hip.rotation.set(0, 0, 0);
            boy.rightLeg.knee.rotation.set(0, 0, 0);
            boy.hips.position.y = 54;
            boy.waterBottle.visible = false;

            if (currentPhase === 'WAITING') {
                boyVisible = false;
            } else if (currentPhase === 'WALK_IN') {
                boyVisible = true;
                const walkProgress = Math.min(elapsed / 1.25, 1);
                const ease = 1 - Math.pow(1 - walkProgress, 3);
                boyLocalX = -80 + (centerX + 80) * ease;
                targetRotY = walkProgress < 0.85 ? Math.PI / 2 : 0;

                const stride = Math.sin(now * 0.015) * (1 - walkProgress * 0.85);
                boy.leftLeg.hip.rotation.x = stride * 0.6;
                boy.leftLeg.knee.rotation.x = Math.max(0, -stride) * 0.5;
                boy.rightLeg.hip.rotation.x = -stride * 0.6;
                boy.rightLeg.knee.rotation.x = Math.max(0, stride) * 0.5;
                boy.leftArm.shoulder.rotation.x = -stride * 0.5;
                boy.rightArm.shoulder.rotation.x = stride * 0.5;
                boy.setExpression(isBlinking ? 'blink' : 'normal');
            } else {
                boyVisible = true;
                boyLocalX = centerX;
                targetRotY = 0;
                applySitAndSwingLegs(boy, now);
                boy.setExpression(isBlinking ? 'blink' : 'normal');
            }

            boy.root.visible = boyVisible;
            boy.root.position.set(toWorldX(boyLocalX), toWorldY(boyLocalY), 0);
            boy.root.rotation.y = targetRotY;

            if (cardTransformRef.current) {
                cardTransformRef.current.style.transform = 'none';
                cardTransformRef.current.style.opacity = '1';
            }

            renderer.render(scene, camera);
        };

        rafId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(rafId);
            resizeObserver?.disconnect();
            window.removeEventListener('resize', syncMobileSize);
            boy.dispose();
            renderer.dispose();
            if (renderer.domElement.parentNode === container) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [isDesktop, canRenderWebGL]);

    const activeBubbleText = (() => {
        if (phase === 'SITTING_SWING') {
            return 'Taking a seat and swinging my legs!';
        }
        if (phase === 'THINKING') {
            return 'Wait a second! Let me grab the login form for you!';
        }
        if (phase === 'PUSHING') {
            return 'Pulling the login form slowly... almost there!';
        }
        if (subBeat === 'FORM_READY') {
            return 'Here is your form!';
        }
        if (subBeat === 'DRINK') {
            return 'Sipping fresh Seaside purified water!';
        }
        return FUN_QUIPS[quipIndex];
    })();

    const isPositiveBubble = phase === 'DONE';
    const showDesktopBubble = isDesktop && canRenderWebGL && showBubble && bubbleCoords.visible;
    const showMobileBubble = !isDesktop && canRenderWebGL && showBubble && phase === 'SITTING_SWING';

    const isFormInteractive = !isDesktop || phase === 'DONE';

    return (
        <div ref={stageWrapperRef} className="w-full relative overflow-visible">
            <div ref={cardSlotRef} className="w-full relative overflow-visible">
                {isDesktop && canRenderWebGL && (
                    <div
                        ref={desktopCanvasHostRef}
                        aria-hidden="true"
                        style={{
                            left: `-${PAD_LEFT}px`,
                            top: `-${PAD_TOP}px`,
                            pointerEvents: 'none'
                        }}
                        className="hidden lg:block absolute z-30 pointer-events-none overflow-visible"
                    />
                )}

                {isDesktop && canRenderWebGL && phase === 'DONE' && (
                    <button
                        type="button"
                        onClick={handleMascotPoke}
                        title="Tap for a Seaside water sip & greeting!"
                        aria-label="Say hi to Seaside Boy"
                        style={{
                            left: '-105px',
                            bottom: '18px',
                            width: '94px',
                            height: '165px'
                        }}
                        className="hidden lg:block absolute z-40 bg-transparent cursor-pointer focus:outline-none"
                    />
                )}

                {showDesktopBubble && (
                    <div
                        style={{
                            left: `${bubbleCoords.x}px`,
                            top: `${bubbleCoords.y}px`,
                            transform: 'translate(-50%, -100%)'
                        }}
                        className={`hidden lg:block absolute z-40 pointer-events-none w-max max-w-[225px] px-3.5 py-2.5 rounded-2xl text-white text-xs font-extrabold leading-snug text-center shadow-xl transition-colors duration-200 animate-in fade-in zoom-in-95 ${
                            isPositiveBubble
                                ? 'bg-[#8DB600] border border-lime-400/50'
                                : 'bg-slate-900/95 dark:bg-slate-800/95 border border-slate-700/80'
                        }`}
                    >
                        <span>{activeBubbleText}</span>
                        <span
                            className={`block w-2.5 h-2.5 rotate-45 mx-auto -mb-3.5 mt-1 ${
                                isPositiveBubble
                                    ? 'bg-[#8DB600] border-r border-b border-lime-400/50'
                                    : 'bg-slate-900/95 dark:bg-slate-800/95 border-r border-b border-slate-700/80'
                            }`}
                        />
                    </div>
                )}

                {canRenderWebGL && phase !== 'DONE' && phase !== 'SITTING_SWING' && phase !== 'WAITING' && (
                    <button
                        type="button"
                        onClick={handleSkip}
                        className="fixed bottom-5 right-5 z-50 px-3.5 py-1.5 rounded-full bg-slate-900/85 hover:bg-slate-900 text-white text-[11px] font-bold tracking-wide shadow-lg border border-white/15 backdrop-blur-md transition-all cursor-pointer active:scale-95"
                    >
                        Skip Intro
                    </button>
                )}

                {!isDesktop && canRenderWebGL && enabled && (
                    <div className="lg:hidden relative w-full h-[182px] -mb-3 z-20 pointer-events-none overflow-visible">
                        {showMobileBubble && (
                            <div
                                style={{
                                    left: '50%',
                                    top: '0px',
                                    transform: 'translateX(-50%)'
                                }}
                                className="absolute z-40 px-3 py-1 rounded-2xl bg-[#8DB600] text-white text-[10px] font-extrabold leading-snug text-center shadow-lg max-w-[230px] border border-lime-400/50 animate-in fade-in zoom-in-95"
                            >
                                <span>{activeBubbleText}</span>
                            </div>
                        )}

                        <div
                            ref={mobileCanvasHostRef}
                            aria-hidden="true"
                            className="w-full h-[188px] pt-2 pointer-events-none overflow-hidden"
                        />
                    </div>
                )}

                <div
                    ref={cardTransformRef}
                    style={
                        isDesktop && canRenderWebGL && enabled
                            ? {
                                transform: 'translate3d(120%, 0px, 0px)',
                                opacity: 0,
                                willChange: 'transform, opacity'
                            }
                            : {
                                transform: 'none',
                                opacity: 1
                            }
                    }
                    className={`w-full relative z-10 ${isFormInteractive ? 'pointer-events-auto' : 'pointer-events-none'}`}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}