// src/components/landing/WaterStation3DModel.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { isWebGLAvailable } from '../SafeWebGL';

function normalizeStationBrand(stationName = 'SEASIDE') {
    const raw = String(stationName || 'SEASIDE').trim();
    if (/seaside/i.test(raw)) {
        return 'SEASIDE';
    }
    const stripped = raw
        .replace(/purified\s+water\s+refilling\s+station/i, '')
        .replace(/water\s+refilling\s+station/i, '')
        .trim();
    return (stripped || 'SEASIDE').toUpperCase();
}

function drawFittedText(ctx, text, x, y, maxWidth, baseSize, weight = '900', family = 'sans-serif') {
    let fontSize = baseSize;
    ctx.font = `${weight} ${fontSize}px ${family}`;
    while (fontSize > 12 && ctx.measureText(text).width > maxWidth) {
        fontSize -= 2;
        ctx.font = `${weight} ${fontSize}px ${family}`;
    }
    ctx.fillText(text, x, y, maxWidth);
}

/**
 * Procedural micro-pebbled frosted texture for the 3 raised
 * bumper rings & base heel of the 20L Round Polycarbonate Carboy.
 */
function createFrostedPolycarbonateTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 6500; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const r = Math.random() * 1.6 + 0.4;
        const shade = Math.floor(105 + Math.random() * 55);
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 2);
    tex.needsUpdate = true;
    return tex;
}

/**
 * Transparent-backed "SEASIDE Water Refilling Station" coastal-wave decal
 * printed on the lower-middle clear panel of the Round Carboy.
 */
function createRoundJugPrintTexture(stationTitle = 'SEASIDE') {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const brand = normalizeStationBrand(stationTitle);

    const drawWaveBand = (yCenter, color) => {
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx - 125, yCenter - 10);
        ctx.bezierCurveTo(cx - 80, yCenter - 34, cx - 38, yCenter + 12, cx, yCenter - 10);
        ctx.bezierCurveTo(cx + 38, yCenter - 34, cx + 80, yCenter + 12, cx + 125, yCenter - 10);
        ctx.lineTo(cx + 125, yCenter + 16);
        ctx.bezierCurveTo(cx + 80, yCenter + 38, cx + 38, yCenter - 6, cx, yCenter + 16);
        ctx.bezierCurveTo(cx - 38, yCenter + 38, cx - 80, yCenter - 6, cx - 125, yCenter + 16);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    };

    drawWaveBand(76, '#38bdf8');
    drawWaveBand(118, '#0284c7');
    drawWaveBand(160, '#8DB600');

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    drawFittedText(ctx, brand, cx, 250, canvas.width - 72, 74, '900');

    ctx.fillStyle = '#0369a1';
    drawFittedText(ctx, 'WATER REFILLING STATION', cx, 294, canvas.width - 64, 28, '900');

    ctx.fillStyle = '#4d7c0f';
    drawFittedText(ctx, 'PURIFIED DRINKING WATER • 20L', cx, 328, canvas.width - 80, 18, '800');

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
}

/**
 * Waterproof "PROPERTY OF SEASIDE WATER REFILLING STATION"
 * sticker placed on the narrow front chest of the 20L Slim Container.
 */
function createSlimJugPropertyStickerTexture({
                                                 stationTitle = 'SEASIDE',
                                                 tdsLabel = 'TDS: 002 PPM • 21-STAGE'
                                             }) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    const brand = normalizeStationBrand(stationTitle);

    const drawRoundedRect = (x, y, w, h, r) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    };

    const renderSticker = (logoImg = null) => {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        ctx.save();
        drawRoundedRect(10, 10, w - 20, h - 20, 26);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();
        ctx.clip();

        // Top Red "PROPERTY OF" Header Banner
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, 0, w, 86);
        ctx.fillStyle = '#fef08a';
        ctx.textAlign = 'center';
        drawFittedText(ctx, 'PROPERTY OF', w / 2, 62, w - 48, 38, '900');

        // Seaside Emblem Circle
        const logoY = 172;
        ctx.save();
        ctx.beginPath();
        ctx.arc(w / 2, logoY, 56, 0, Math.PI * 2);
        ctx.fillStyle = '#f7fee7';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#8DB600';
        ctx.stroke();

        if (logoImg) {
            ctx.beginPath();
            ctx.arc(w / 2, logoY, 50, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(logoImg, w / 2 - 44, logoY - 44, 88, 88);
        } else {
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.arc(w / 2, logoY + 8, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#8DB600';
            ctx.beginPath();
            ctx.arc(w / 2, logoY - 10, 15, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Bold "SEASIDE" Title (Auto-fitted with zero clipping)
        ctx.fillStyle = '#0369a1';
        ctx.textAlign = 'center';
        drawFittedText(ctx, brand, w / 2, 304, w - 56, 76, '900');

        // Apple Green "WATER REFILLING STATION" Ribbon
        ctx.fillStyle = '#659000';
        ctx.fillRect(26, 326, w - 52, 48);
        ctx.fillStyle = '#ffffff';
        drawFittedText(ctx, 'WATER REFILLING STATION', w / 2, 358, w - 76, 25, '900');

        // Quality & Location Details
        ctx.fillStyle = '#0f172a';
        drawFittedText(ctx, 'Purified Drinking Water', w / 2, 412, w - 64, 22, '800');

        ctx.fillStyle = '#475569';
        drawFittedText(ctx, 'Laois, Labrador, Pangasinan', w / 2, 444, w - 64, 19, '700');

        ctx.fillStyle = '#0284c7';
        drawFittedText(ctx, tdsLabel, w / 2, 478, w - 64, 18, '800', 'monospace');

        // Bottom Yellow/Red Warning Strip
        ctx.fillStyle = '#facc15';
        ctx.fillRect(0, h - 84, w, 84);
        ctx.fillStyle = '#b91c1c';
        drawFittedText(ctx, 'DO NOT REMOVE THIS STICKER', w / 2, h - 34, w - 48, 23, '900');

        ctx.restore();
    };

    renderSticker(null);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    if (typeof window !== 'undefined') {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = '/seaside.png';
        img.onload = () => {
            renderSticker(img);
            texture.needsUpdate = true;
        };
    }

    return texture;
}

function createRoundedBoxShape(width, depth, radius) {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -depth / 2;
    const r = Math.min(radius, width / 2, depth / 2);

    shape.moveTo(x + r, y);
    shape.lineTo(x + width - r, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + r);
    shape.lineTo(x + width, y + depth - r);
    shape.quadraticCurveTo(x + width, y + depth, x + width - r, y + depth);
    shape.lineTo(x + r, y + depth);
    shape.quadraticCurveTo(x, y + depth, x, y + depth - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
}

function createSlimBaseWithAlcoveShape(width, depth, radius, cutW, cutD) {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hd = depth / 2;
    const r = Math.min(radius, hw, hd);
    const cr = 0.08;

    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - cutW - cr, -hd);
    shape.quadraticCurveTo(hw - cutW, -hd, hw - cutW, -hd + cr);
    shape.lineTo(hw - cutW, -hd + cutD - cr);
    shape.quadraticCurveTo(hw - cutW, -hd + cutD, hw - cutW + cr, -hd + cutD);
    shape.lineTo(hw - cr, -hd + cutD);
    shape.quadraticCurveTo(hw, -hd + cutD, hw, -hd + cutD + cr);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

    return shape;
}

/**
 * Shared 3D Builder: 20L Round Polycarbonate Carboy
 * Supports dynamic fill level (0..1), rippling water meniscus, rising bubbles, and cap-snap states.
 */
export function buildRoundCarboy3D({
                                       darkMode = false,
                                       stationName = 'SEASIDE',
                                       initialFill = 0.86,
                                       withCap = true
                                   }) {
    const group = new THREE.Group();
    const disposables = [];
    const trackGeo = (g) => {
        disposables.push(g);
        return g;
    };
    const trackMat = (m) => {
        disposables.push(m);
        return m;
    };

    const frostedBumpTex = createFrostedPolycarbonateTexture();
    disposables.push(frostedBumpTex);

    // 1. Clear-Blue Polycarbonate Body Shell (No side handle)
    const roundShellPts = [
        new THREE.Vector2(0.0, -1.42),
        new THREE.Vector2(0.76, -1.42),
        new THREE.Vector2(0.92, -1.32),
        new THREE.Vector2(0.95, 0.68),
        new THREE.Vector2(0.86, 0.88),
        new THREE.Vector2(0.64, 1.04),
        new THREE.Vector2(0.28, 1.18),
        new THREE.Vector2(0.23, 1.26),
        new THREE.Vector2(0.23, 1.48)
    ];
    const roundShellGeo = trackGeo(new THREE.LatheGeometry(roundShellPts, 64));
    const roundShellMat = trackMat(
        new THREE.MeshPhysicalMaterial({
            color: darkMode ? 0x7dd3fc : 0xbae6fd,
            transparent: true,
            opacity: darkMode ? 0.34 : 0.36,
            roughness: 0.06,
            metalness: 0.02,
            ior: 1.49,
            reflectivity: 0.95,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            side: THREE.DoubleSide,
            depthWrite: false
        })
    );
    group.add(new THREE.Mesh(roundShellGeo, roundShellMat));

    // 2. Three Raised Frosted Bumper Bands (Top, Middle, Bottom Base Skirt)
    const frostedBandMat = trackMat(
        new THREE.MeshPhysicalMaterial({
            color: darkMode ? 0x60a5fa : 0x93c5fd,
            transparent: true,
            opacity: darkMode ? 0.56 : 0.62,
            roughness: 0.65,
            bumpMap: frostedBumpTex,
            bumpScale: 0.015,
            ior: 1.49,
            clearcoat: 0.25,
            side: THREE.DoubleSide
        })
    );

    const buildBumperBand = (yBottom, yTop, rInner, rOuter) => {
        const pts = [
            new THREE.Vector2(rInner, yBottom),
            new THREE.Vector2(rOuter, yBottom + 0.03),
            new THREE.Vector2(rOuter, yTop - 0.03),
            new THREE.Vector2(rInner, yTop)
        ];
        group.add(new THREE.Mesh(trackGeo(new THREE.LatheGeometry(pts, 64)), frostedBandMat));
    };

    buildBumperBand(0.46, 0.72, 0.945, 0.978);
    buildBumperBand(-0.18, 0.08, 0.948, 0.98);
    const baseSkirtPts = [
        new THREE.Vector2(0.75, -1.43),
        new THREE.Vector2(0.94, -1.34),
        new THREE.Vector2(0.982, -1.2),
        new THREE.Vector2(0.982, -1.04),
        new THREE.Vector2(0.948, -1.0)
    ];
    group.add(new THREE.Mesh(trackGeo(new THREE.LatheGeometry(baseSkirtPts, 64)), frostedBandMat));

    // 3. Dynamic Inner Purified Water Volume (Anchored at y = -1.38 for clean 0..1 scaling)
    const waterBottomY = -1.38;
    const waterMaxSpan = 2.2;
    const roundWaterPts = [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.75, 0.0),
        new THREE.Vector2(0.895, 0.1),
        new THREE.Vector2(0.905, 2.04),
        new THREE.Vector2(0.84, waterMaxSpan)
    ];
    const roundWaterGeo = trackGeo(new THREE.LatheGeometry(roundWaterPts, 64));
    const roundWaterMat = trackMat(
        new THREE.MeshPhysicalMaterial({
            color: 0x38bdf8,
            emissive: 0x0284c7,
            emissiveIntensity: darkMode ? 0.25 : 0.1,
            transparent: true,
            opacity: 0.74,
            roughness: 0.08,
            ior: 1.333,
            clearcoat: 0.9
        })
    );
    const waterBodyMesh = new THREE.Mesh(roundWaterGeo, roundWaterMat);
    waterBodyMesh.position.y = waterBottomY;
    group.add(waterBodyMesh);

    // 4. Rippling Water Surface Meniscus Disc
    const meniscusGeo = trackGeo(new THREE.CircleGeometry(0.9, 48));
    meniscusGeo.rotateX(-Math.PI / 2);
    const meniscusBasePos = meniscusGeo.attributes.position.array.slice();
    const meniscusMat = trackMat(
        new THREE.MeshPhysicalMaterial({
            color: 0xbae6fd,
            emissive: 0x38bdf8,
            emissiveIntensity: 0.28,
            transparent: true,
            opacity: 0.88,
            roughness: 0.05
        })
    );
    const meniscusMesh = new THREE.Mesh(meniscusGeo, meniscusMat);
    meniscusMesh.position.y = waterBottomY + waterMaxSpan * initialFill;
    group.add(meniscusMesh);

    // 5. "SEASIDE Water Refilling Station" Decal on Lower-Middle Clear Panel
    const roundPrintTex = createRoundJugPrintTexture(stationName);
    disposables.push(roundPrintTex);
    const roundPrintArc = Math.PI * 0.56;
    const roundPrintGeo = trackGeo(
        new THREE.CylinderGeometry(
            0.955,
            0.955,
            0.62,
            48,
            1,
            true,
            -roundPrintArc / 2,
            roundPrintArc
        )
    );
    const roundPrintMat = trackMat(
        new THREE.MeshPhysicalMaterial({
            map: roundPrintTex,
            transparent: true,
            roughness: 0.18,
            clearcoat: 0.8,
            polygonOffset: true,
            polygonOffsetFactor: -1
        })
    );
    const roundPrintMesh = new THREE.Mesh(roundPrintGeo, roundPrintMat);
    roundPrintMesh.position.y = -0.58;
    group.add(roundPrintMesh);

    // 6. Translucent Blue Neck & Collar
    const blueNeckMat = trackMat(
        new THREE.MeshPhysicalMaterial({
            color: 0x0284c7,
            transparent: true,
            opacity: 0.86,
            roughness: 0.15,
            clearcoat: 0.9
        })
    );
    const neckCollar = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.28, 0.3, 0.08, 36)),
        blueNeckMat
    );
    neckCollar.position.y = 1.24;
    group.add(neckCollar);

    const neckTube = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.225, 0.235, 0.24, 36)),
        blueNeckMat
    );
    neckTube.position.y = 1.38;
    group.add(neckTube);

    // 7. White Non-Spill Snap Cap Group
    const capGroup = new THREE.Group();
    const whiteCapMat = trackMat(
        new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            roughness: 0.28,
            metalness: 0.04
        })
    );
    const whiteCapBody = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.245, 0.252, 0.21, 40)),
        whiteCapMat
    );
    capGroup.add(whiteCapBody);

    const capCenterHole = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.065, 0.065, 0.02, 24)),
        trackMat(new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 }))
    );
    capCenterHole.position.y = 0.102;
    capGroup.add(capCenterHole);

    capGroup.position.y = 1.56;
    capGroup.visible = withCap;
    group.add(capGroup);

    // 8. Rising 3D Bubbles inside Round Carboy
    const bubbleGeo = trackGeo(new THREE.SphereGeometry(0.024, 10, 10));
    const bubbleMat = trackMat(
        new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            emissive: 0xe0f2fe,
            emissiveIntensity: 0.45,
            transparent: true,
            opacity: 0.78,
            roughness: 0.05
        })
    );
    const bubbles = Array.from({ length: 28 }, () => {
        const mesh = new THREE.Mesh(bubbleGeo, bubbleMat);
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.68;
        mesh.position.set(
            Math.cos(angle) * radius,
            waterBottomY + Math.random() * (waterMaxSpan * Math.max(0.1, initialFill)),
            Math.sin(angle) * radius
        );
        mesh.scale.setScalar(0.45 + Math.random() * 0.9);
        group.add(mesh);
        return {
            mesh,
            speed: 0.35 + Math.random() * 0.5,
            angle,
            radius,
            phase: Math.random() * Math.PI * 2
        };
    });

    // 9. Contact Shadow
    const shadowGeo = trackGeo(new THREE.CircleGeometry(1.05, 36));
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = trackMat(
        new THREE.MeshBasicMaterial({
            color: darkMode ? 0x0284c7 : 0x0369a1,
            transparent: true,
            opacity: darkMode ? 0.22 : 0.14
        })
    );
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = -1.46;
    group.add(shadow);

    const update = (
        t,
        { fillFraction = initialFill, isPouring = false, capState = 'sealed', capProgress = 1 } = {}
    ) => {
        const clampedFill = Math.max(0, Math.min(1, fillFraction));
        const hasWater = clampedFill > 0.008;

        waterBodyMesh.visible = hasWater;
        meniscusMesh.visible = hasWater;

        const currentWaterTopY = waterBottomY + waterMaxSpan * clampedFill;
        if (hasWater) {
            waterBodyMesh.scale.y = Math.max(0.01, clampedFill);
            meniscusMesh.position.y = currentWaterTopY;

            const shoulderT = clampedFill > 0.927 ? (clampedFill - 0.927) / 0.073 : 0;
            meniscusMesh.scale.setScalar(1 - shoulderT * 0.068);

            const waveStrength = isPouring ? 1.55 : 1.0;
            const posAttr = meniscusGeo.attributes.position;
            for (let i = 0; i < posAttr.count; i++) {
                const vx = meniscusBasePos[i * 3];
                const vz = meniscusBasePos[i * 3 + 2];
                const dist = Math.sqrt(vx * vx + vz * vz);
                posAttr.setY(
                    i,
                    (Math.sin(dist * 7.5 - t * 4.0) * 0.016 + Math.cos(vx * 5.0 + t * 2.5) * 0.009) *
                    waveStrength
                );
            }
            posAttr.needsUpdate = true;
            meniscusGeo.computeVertexNormals();
        }

        bubbles.forEach((b) => {
            if (!hasWater || currentWaterTopY <= waterBottomY + 0.08) {
                b.mesh.visible = false;
                return;
            }
            b.mesh.visible = true;
            const speedMult = isPouring ? 1.6 : 1.0;
            b.mesh.position.y += b.speed * 0.011 * speedMult;
            b.mesh.position.x =
                Math.cos(b.angle) * b.radius + Math.sin(t * 2.4 + b.phase) * 0.022;
            if (b.mesh.position.y > currentWaterTopY - 0.04) {
                b.mesh.position.y = waterBottomY + 0.05;
            }
        });

        if (capState === 'hidden') {
            capGroup.visible = false;
        } else if (capState === 'hover') {
            capGroup.visible = true;
            capGroup.position.y = 1.92 + Math.sin(t * 5) * 0.04;
        } else if (capState === 'snapping') {
            capGroup.visible = true;
            const eased = 1 - Math.pow(1 - Math.min(1, capProgress), 3);
            capGroup.position.y = 1.92 - eased * (1.92 - 1.56);
        } else {
            capGroup.visible = true;
            capGroup.position.y = 1.56;
        }
    };

    const dispose = () => {
        disposables.forEach((item) => item?.dispose?.());
    };

    return { group, update, dispose };
}

/**
 * Shared 3D Builder: Apple Green 20L Slim Water Container with Recessed Corner
 * Push-Paddle Faucet (White Spout + Red Upright Thumb Paddle), Top Handle,
 * Blue Screw Cap w/ White Seal, Rear Breather Cap & Property Sticker.
 */
export function buildSlimContainer3D({
                                         darkMode = false,
                                         stationName = 'SEASIDE',
                                         tdsLabel = 'TDS: 002 PPM • 21-STAGE',
                                         initialFill = 0.86,
                                         withCap = true,
                                         showSightGauge = false
                                     }) {
    const group = new THREE.Group();
    const disposables = [];
    const trackGeo = (g) => {
        disposables.push(g);
        return g;
    };
    const trackMat = (m) => {
        disposables.push(m);
        return m;
    };

    // Seaside Apple Green (#8DB600) Blow-Molded HDPE Body Material
    const slimAppleGreenMat = trackMat(
        new THREE.MeshPhysicalMaterial({
            color: 0x8db600,
            emissive: 0x365314,
            emissiveIntensity: darkMode ? 0.28 : 0.14,
            roughness: 0.26,
            metalness: 0.03,
            clearcoat: 0.62,
            clearcoatRoughness: 0.2
        })
    );

    const slimW = 1.08;
    const slimD = 1.62;

    // 1. Lower Base Tier with Recessed Front-Right Corner Alcove
    const lowerBaseShape = createSlimBaseWithAlcoveShape(slimW, slimD, 0.22, 0.38, 0.34);
    const lowerBaseGeo = trackGeo(
        new THREE.ExtrudeGeometry(lowerBaseShape, {
            depth: 0.54,
            bevelEnabled: true,
            bevelSegments: 4,
            steps: 1,
            bevelSize: 0.045,
            bevelThickness: 0.055
        })
    );
    lowerBaseGeo.rotateX(-Math.PI / 2);
    lowerBaseGeo.translate(0, -1.36, 0);
    group.add(new THREE.Mesh(lowerBaseGeo, slimAppleGreenMat));

    // 2. Upper Main Torso Tier
    const upperTorsoShape = createRoundedBoxShape(slimW, slimD, 0.22);
    const upperTorsoGeo = trackGeo(
        new THREE.ExtrudeGeometry(upperTorsoShape, {
            depth: 1.72,
            bevelEnabled: true,
            bevelSegments: 5,
            steps: 1,
            bevelSize: 0.05,
            bevelThickness: 0.07
        })
    );
    upperTorsoGeo.rotateX(-Math.PI / 2);
    upperTorsoGeo.translate(0, -0.82, 0);
    group.add(new THREE.Mesh(upperTorsoGeo, slimAppleGreenMat));

    // 3. Tapered Top Shoulder Crown
    const shoulderShape = createRoundedBoxShape(slimW - 0.14, slimD - 0.18, 0.2);
    const shoulderGeo = trackGeo(
        new THREE.ExtrudeGeometry(shoulderShape, {
            depth: 0.18,
            bevelEnabled: true,
            bevelSegments: 4,
            steps: 1,
            bevelSize: 0.05,
            bevelThickness: 0.05
        })
    );
    shoulderGeo.rotateX(-Math.PI / 2);
    shoulderGeo.translate(0, 0.92, 0);
    group.add(new THREE.Mesh(shoulderGeo, slimAppleGreenMat));

    // 4. Top Integrated Center Carry Handle Bridge
    const topHandleCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.08, 0.06),
        new THREE.Vector3(0, 1.32, 0.02),
        new THREE.Vector3(0, 1.34, -0.34),
        new THREE.Vector3(0, 1.08, -0.4)
    ]);
    const topHandleGeo = trackGeo(new THREE.TubeGeometry(topHandleCurve, 24, 0.075, 14, false));
    group.add(new THREE.Mesh(topHandleGeo, slimAppleGreenMat));

    // 5. Open Neck Mouth + Animatable Wide Ribbed Blue Cap w/ White Tamper-Evident Seal Band
    const wideCapMat = trackMat(
        new THREE.MeshStandardMaterial({
            color: 0x0265d2,
            roughness: 0.28,
            metalness: 0.08
        })
    );

    const neckMouth = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.25, 0.26, 0.12, 32)),
        slimAppleGreenMat
    );
    neckMouth.position.set(0, 1.14, 0.44);
    group.add(neckMouth);

    const capGroup = new THREE.Group();
    const wideCap = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.29, 0.3, 0.19, 36)),
        wideCapMat
    );
    capGroup.add(wideCap);

    const sealBand = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.306, 0.308, 0.075, 36, 1, true)),
        trackMat(
            new THREE.MeshStandardMaterial({
                color: 0xf8fafc,
                roughness: 0.3,
                side: THREE.DoubleSide
            })
        )
    );
    sealBand.position.y = -0.06;
    capGroup.add(sealBand);

    capGroup.position.set(0, 1.22, 0.44);
    capGroup.visible = withCap;
    group.add(capGroup);

    // 6. 45-Degree Angled Small Rear Air-Vent Breather Cap
    const breatherGroup = new THREE.Group();
    breatherGroup.position.set(0, 1.12, -0.66);
    breatherGroup.rotation.x = -Math.PI / 4;

    const breatherNeck = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.11, 0.12, 0.14, 24)),
        slimAppleGreenMat
    );
    breatherGroup.add(breatherNeck);

    const breatherCap = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.13, 0.135, 0.09, 24)),
        wideCapMat
    );
    breatherCap.position.y = 0.09;
    breatherGroup.add(breatherCap);
    group.add(breatherGroup);

    // 7. Recessed Tomlinson-Style Dispenser Faucet (White Spout + Red Upright Thumb Paddle)
    const faucetGroup = new THREE.Group();
    faucetGroup.position.set(slimW / 2 - 0.19, -1.14, slimD / 2 - 0.29);

    const faucetWhiteMat = trackMat(
        new THREE.MeshPhysicalMaterial({
            color: 0xf8fafc,
            roughness: 0.22,
            metalness: 0.02,
            clearcoat: 0.65
        })
    );
    const faucetRedMat = trackMat(
        new THREE.MeshPhysicalMaterial({
            color: 0xdc2626,
            emissive: 0x7f1d1d,
            emissiveIntensity: 0.15,
            roughness: 0.24,
            metalness: 0.04,
            clearcoat: 0.75
        })
    );

    const flangeNut = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.088, 0.092, 0.055, 8)),
        faucetWhiteMat
    );
    flangeNut.rotation.x = Math.PI / 2;
    flangeNut.position.set(0, 0.02, 0.02);
    faucetGroup.add(flangeNut);

    const valveBarrel = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.054, 0.058, 0.22, 24)),
        faucetWhiteMat
    );
    valveBarrel.rotation.x = Math.PI / 2;
    valveBarrel.position.set(0, 0.02, 0.13);
    faucetGroup.add(valveBarrel);

    const verticalNozzle = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.056, 0.048, 0.2, 24)),
        faucetWhiteMat
    );
    verticalNozzle.position.set(0, -0.04, 0.22);
    faucetGroup.add(verticalNozzle);

    const spoutLip = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.048, 0.008, 10, 24)),
        faucetWhiteMat
    );
    spoutLip.rotation.x = Math.PI / 2;
    spoutLip.position.set(0, -0.138, 0.22);
    faucetGroup.add(spoutLip);

    const redBonnetCollar = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.062, 0.064, 0.055, 24)),
        faucetRedMat
    );
    redBonnetCollar.position.set(0, 0.075, 0.22);
    faucetGroup.add(redBonnetCollar);

    const paddlePivot = new THREE.Group();
    paddlePivot.position.set(0, 0.095, 0.22);

    const paddleShape = createRoundedBoxShape(0.078, 0.026, 0.012);
    const paddleGeo = trackGeo(
        new THREE.ExtrudeGeometry(paddleShape, {
            depth: 0.18,
            bevelEnabled: true,
            bevelSegments: 3,
            steps: 1,
            bevelSize: 0.006,
            bevelThickness: 0.008
        })
    );
    paddleGeo.rotateX(-Math.PI / 2);
    const redThumbPaddle = new THREE.Mesh(paddleGeo, faucetRedMat);
    redThumbPaddle.rotation.x = -0.14;
    paddlePivot.add(redThumbPaddle);

    faucetGroup.add(paddlePivot);
    group.add(faucetGroup);

    // 8. "PROPERTY OF SEASIDE WATER REFILLING STATION" Waterproof Sticker on Narrow Front Chest
    const slimStickerTex = createSlimJugPropertyStickerTexture({
        stationTitle: stationName,
        tdsLabel
    });
    disposables.push(slimStickerTex);
    const slimStickerGeo = trackGeo(
        new THREE.PlaneGeometry(showSightGauge ? 0.7 : 0.74, showSightGauge ? 0.88 : 0.92)
    );
    const slimStickerMat = trackMat(
        new THREE.MeshPhysicalMaterial({
            map: slimStickerTex,
            roughness: 0.2,
            clearcoat: 0.85,
            clearcoatRoughness: 0.1
        })
    );
    const slimStickerMesh = new THREE.Mesh(slimStickerGeo, slimStickerMat);
    slimStickerMesh.position.set(showSightGauge ? 0.06 : 0, 0.24, slimD / 2 + 0.056);
    group.add(slimStickerMesh);

    // 9. Optional 3D Translucent Sight-Level Window on Front-Left Edge (for Refill Simulator)
    const sightHeight = 2.04;
    const sightBottomY = -1.24;
    let sightWaterMesh = null;
    if (showSightGauge) {
        const sightFrame = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(0.11, sightHeight, 0.03)),
            trackMat(
                new THREE.MeshPhysicalMaterial({
                    color: 0x0f172a,
                    transparent: true,
                    opacity: 0.55,
                    roughness: 0.2
                })
            )
        );
        sightFrame.position.set(-slimW / 2 + 0.11, sightBottomY + sightHeight / 2, slimD / 2 + 0.052);
        group.add(sightFrame);

        const sightWaterGeo = trackGeo(new THREE.BoxGeometry(0.08, 1, 0.034));
        sightWaterGeo.translate(0, 0.5, 0);
        sightWaterMesh = new THREE.Mesh(
            sightWaterGeo,
            trackMat(
                new THREE.MeshPhysicalMaterial({
                    color: 0x38bdf8,
                    emissive: 0x0ea5e9,
                    emissiveIntensity: 0.45,
                    roughness: 0.1
                })
            )
        );
        sightWaterMesh.position.set(-slimW / 2 + 0.11, sightBottomY, slimD / 2 + 0.054);
        group.add(sightWaterMesh);
    }

    // 10. Contact Shadow
    const shadowGeo = trackGeo(new THREE.CircleGeometry(1.05, 36));
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = trackMat(
        new THREE.MeshBasicMaterial({
            color: darkMode ? 0x659000 : 0x4d7c0f,
            transparent: true,
            opacity: darkMode ? 0.24 : 0.15
        })
    );
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = -1.46;
    group.add(shadow);

    const update = (t, { fillFraction = initialFill, capState = 'sealed', capProgress = 1 } = {}) => {
        paddlePivot.rotation.x = Math.sin(t * 2.4) * 0.035;

        const clampedFill = Math.max(0, Math.min(1, fillFraction));
        if (sightWaterMesh) {
            sightWaterMesh.visible = clampedFill > 0.008;
            sightWaterMesh.scale.y = Math.max(0.01, clampedFill * sightHeight);
        }

        if (capState === 'hidden') {
            capGroup.visible = false;
        } else if (capState === 'hover') {
            capGroup.visible = true;
            capGroup.position.y = 1.62 + Math.sin(t * 5) * 0.04;
        } else if (capState === 'snapping') {
            capGroup.visible = true;
            const eased = 1 - Math.pow(1 - Math.min(1, capProgress), 3);
            capGroup.position.y = 1.62 - eased * (1.62 - 1.22);
        } else {
            capGroup.visible = true;
            capGroup.position.y = 1.22;
        }
    };

    const dispose = () => {
        disposables.forEach((item) => item?.dispose?.());
    };

    return { group, update, dispose };
}

function Containers2DFallback({ selectedContainer, darkMode, stationName }) {
    const brand = normalizeStationBrand(stationName);
    const showRound = selectedContainer === 'both' || selectedContainer === 'round';
    const showSlim = selectedContainer === 'both' || selectedContainer === 'slim';

    return (
        <div className="w-full h-full min-h-[275px] sm:min-h-[305px] flex items-center justify-center gap-6 px-4 pb-8 select-none">
            {showRound && (
                <div className="flex flex-col items-center">
                    <svg className="w-28 h-36 sm:w-32 sm:h-40 drop-shadow-md" viewBox="0 0 140 175" fill="none">
                        <rect x="53" y="8" width="34" height="12" rx="4" fill="#f8fafc" stroke="#cbd5e1" />
                        <rect x="49" y="20" width="42" height="7" rx="3" fill="#0284c7" />
                        <path
                            d="M54 27H86C86 38 114 44 114 60V145C114 155 107 162 97 162H43C33 162 26 155 26 145V60C26 44 54 38 54 27Z"
                            fill={darkMode ? 'rgba(56,189,248,0.22)' : 'rgba(186,230,253,0.45)'}
                            stroke="#0284c7"
                            strokeWidth="2.5"
                        />
                        <path
                            d="M29 66C50 61 70 71 90 66C101 63 107 65 111 66V144C111 152 105 159 96 159H44C35 159 29 152 29 144V66Z"
                            fill="#38bdf8"
                            fillOpacity="0.82"
                        />
                        <text x="70" y="122" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="900">
                            {brand}
                        </text>
                        <text x="70" y="135" textAnchor="middle" fill="#0369a1" fontSize="6.5" fontWeight="800">
                            20L ROUND
                        </text>
                    </svg>
                </div>
            )}

            {showSlim && (
                <div className="flex flex-col items-center">
                    <svg className="w-28 h-36 sm:w-32 sm:h-40 drop-shadow-md" viewBox="0 0 140 175" fill="none">
                        <path d="M52 24V12H84V24" stroke="#8DB600" strokeWidth="7" strokeLinecap="round" />
                        <rect x="86" y="14" width="22" height="10" rx="3" fill="#0265d2" />
                        <rect x="34" y="24" width="72" height="138" rx="14" fill="#8DB600" />
                        <rect x="46" y="46" width="48" height="62" rx="6" fill="#ffffff" />
                        <rect x="46" y="46" width="48" height="11" rx="3" fill="#dc2626" />
                        <text x="70" y="76" textAnchor="middle" fill="#0369a1" fontSize="10" fontWeight="900">
                            {brand}
                        </text>
                        <text x="70" y="88" textAnchor="middle" fill="#4d7c0f" fontSize="6.5" fontWeight="800">
                            20L SLIM
                        </text>
                        <rect x="92" y="132" width="18" height="10" rx="3" fill="#f8fafc" />
                        <rect x="98" y="124" width="6" height="10" rx="2" fill="#dc2626" />
                    </svg>
                </div>
            )}
        </div>
    );
}

export default function WaterStation3DModel({
                                                darkMode = false,
                                                interactive = true,
                                                stationName = 'SEASIDE',
                                                tdsLabel = 'TDS: 002 PPM • 21-STAGE'
                                            }) {
    const containerRef = useRef(null);
    const [selectedContainer, setSelectedContainer] = useState('both'); // 'both' | 'round' | 'slim'
    const [webglUnavailable, setWebglUnavailable] = useState(false);
    const selectedContainerRef = useRef(selectedContainer);
    selectedContainerRef.current = selectedContainer;

    useEffect(() => {
        const container = containerRef.current;
        if (!container || typeof window === 'undefined') return;

        if (!isWebGLAvailable()) {
            setWebglUnavailable(true);
            return;
        }

        let width = container.clientWidth || 360;
        let height = container.clientHeight || 340;

        let renderer = null;
        let roundCarboy = null;
        let slimContainer = null;
        let timer = null;
        let animationFrameId = null;

        let targetRotY = -0.16;
        let targetRotX = 0.07;
        let isDragging = false;
        let prevPointerX = 0;
        let prevPointerY = 0;

        const onPointerDown = (e) => {
            if (!interactive) return;
            isDragging = true;
            prevPointerX = e.clientX;
            prevPointerY = e.clientY;
        };

        const onPointerMove = (e) => {
            if (!interactive) return;
            const rect = container.getBoundingClientRect();
            if (isDragging) {
                const dx = e.clientX - prevPointerX;
                const dy = e.clientY - prevPointerY;
                targetRotY += dx * 0.012;
                targetRotX = Math.max(-0.45, Math.min(0.45, targetRotX + dy * 0.008));
                prevPointerX = e.clientX;
                prevPointerY = e.clientY;
            } else {
                const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
                targetRotY = -0.16 + nx * 0.45;
                targetRotX = 0.07 + ny * 0.2;
            }
        };

        const onPointerUp = () => {
            isDragging = false;
        };

        const onPointerLeave = () => {
            isDragging = false;
            targetRotY = -0.16;
            targetRotX = 0.07;
        };

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
        camera.position.set(0, 0.35, 7.6);

        const handleResize = () => {
            if (!container || !renderer) return;
            width = container.clientWidth || 360;
            height = container.clientHeight || 340;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        try {
            // WebGL Renderer
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            renderer.setSize(width, height);
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = darkMode ? 1.24 : 1.1;
            container.appendChild(renderer.domElement);

            // Studio Lighting
            const ambientLight = new THREE.AmbientLight(
                darkMode ? 0xe0f2fe : 0xffffff,
                darkMode ? 1.25 : 1.65
            );
            scene.add(ambientLight);

            const keyLight = new THREE.DirectionalLight(0xffffff, darkMode ? 2.5 : 2.2);
            keyLight.position.set(4.5, 6.5, 5.5);
            scene.add(keyLight);

            const aquaRimLight = new THREE.PointLight(0x38bdf8, darkMode ? 5.2 : 3.4, 20);
            aquaRimLight.position.set(-4.5, 2.5, 3.8);
            scene.add(aquaRimLight);

            const limeAccentLight = new THREE.PointLight(0x8db600, darkMode ? 4.4 : 2.8, 20);
            limeAccentLight.position.set(4.5, -1.5, 3.5);
            scene.add(limeAccentLight);

            const backLight = new THREE.DirectionalLight(0xbae6fd, 1.5);
            backLight.position.set(0, 3, -5);
            scene.add(backLight);

            // Root Group
            const rootGroup = new THREE.Group();
            rootGroup.position.y = -0.1;
            scene.add(rootGroup);

            // Build both authentic 3D containers
            roundCarboy = buildRoundCarboy3D({
                darkMode,
                stationName,
                initialFill: 0.86,
                withCap: true
            });
            rootGroup.add(roundCarboy.group);

            slimContainer = buildSlimContainer3D({
                darkMode,
                stationName,
                tdsLabel,
                initialFill: 0.86,
                withCap: true,
                showSightGauge: false
            });
            rootGroup.add(slimContainer.group);

            container.addEventListener('pointerdown', onPointerDown);
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
            container.addEventListener('pointerleave', onPointerLeave);
            window.addEventListener('resize', handleResize);

            // 60FPS Animation Loop using THREE.Timer (replaces deprecated THREE.Clock)
            timer = new THREE.Timer();
            timer.connect?.(document);

            const animate = (timestamp) => {
                if (!renderer || !timer) return;
                timer.update(timestamp);
                const t = timer.getElapsed();
                const mode = selectedContainerRef.current;

                const targetRoundX = mode === 'both' ? -1.04 : 0;
                const targetRoundScale = mode === 'slim' ? 0.001 : mode === 'both' ? 0.88 : 1.05;
                const targetSlimX = mode === 'both' ? 1.06 : 0;
                const targetSlimScale = mode === 'round' ? 0.001 : mode === 'both' ? 0.9 : 1.06;
                const targetCamZ = mode === 'both' ? 7.8 : 6.4;

                roundCarboy.group.visible = roundCarboy.group.scale.x > 0.02;
                slimContainer.group.visible = slimContainer.group.scale.x > 0.02;

                roundCarboy.group.position.x += (targetRoundX - roundCarboy.group.position.x) * 0.1;
                roundCarboy.group.position.y = Math.sin(t * 1.7) * 0.045;
                roundCarboy.group.rotation.y = mode === 'both' ? 0.16 : 0;
                const nextRoundS =
                    roundCarboy.group.scale.x + (targetRoundScale - roundCarboy.group.scale.x) * 0.12;
                roundCarboy.group.scale.setScalar(nextRoundS);

                slimContainer.group.position.x += (targetSlimX - slimContainer.group.position.x) * 0.1;
                slimContainer.group.position.y = Math.sin(t * 1.7 + 1.1) * 0.045;
                slimContainer.group.rotation.y = mode === 'both' ? -0.34 : -0.26;
                const nextSlimS =
                    slimContainer.group.scale.x + (targetSlimScale - slimContainer.group.scale.x) * 0.12;
                slimContainer.group.scale.setScalar(nextSlimS);

                camera.position.z += (targetCamZ - camera.position.z) * 0.1;

                const autoSpin = isDragging ? 0 : Math.sin(t * 0.55) * 0.18;
                rootGroup.rotation.y += (targetRotY + autoSpin - rootGroup.rotation.y) * 0.07;
                rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.07;

                roundCarboy.update(t, { fillFraction: 0.86, isPouring: false, capState: 'sealed' });
                slimContainer.update(t, { fillFraction: 0.86, capState: 'sealed' });

                renderer.render(scene, camera);
                animationFrameId = requestAnimationFrame(animate);
            };

            animationFrameId = requestAnimationFrame(animate);
        } catch (err) {
            console.warn('WaterStation3DModel switched to 2D fallback (WebGL unavailable):', err?.message || err);
            window.__SEASIDE_DISABLE_3D__ = true;
            setWebglUnavailable(true);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            container.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            container.removeEventListener('pointerleave', onPointerLeave);

            timer?.dispose?.();
            roundCarboy?.dispose?.();
            slimContainer?.dispose?.();
            if (renderer) {
                renderer.dispose();
                if (renderer.domElement && container.contains(renderer.domElement)) {
                    container.removeChild(renderer.domElement);
                }
            }
        };
    }, [darkMode, interactive, stationName, tdsLabel]);

    return (
        <div className="relative w-full h-full min-h-[275px] sm:min-h-[305px]">
            {webglUnavailable ? (
                <Containers2DFallback
                    selectedContainer={selectedContainer}
                    darkMode={darkMode}
                    stationName={stationName}
                />
            ) : (
                <div
                    ref={containerRef}
                    className="w-full h-full min-h-[275px] sm:min-h-[305px] cursor-grab active:cursor-grabbing select-none touch-none"
                    title="Drag to rotate 20L containers"
                />
            )}

            {/* Container Type Switcher Pill */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1 rounded-full bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border border-slate-200/80 dark:border-white/15 shadow-sm">
                {[
                    { id: 'both', label: 'Both Jugs' },
                    { id: 'round', label: 'Round 20L' },
                    { id: 'slim', label: 'Slim w/ Faucet' }
                ].map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedContainer(opt.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                            selectedContainer === opt.id
                                ? 'bg-[#8DB600] text-white shadow-2xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}