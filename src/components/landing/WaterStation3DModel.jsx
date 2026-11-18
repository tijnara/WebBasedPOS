// src/components/landing/WaterStation3DModel.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

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
 * Transparent-backed Seaside triple-wave emblem decal
 * printed on the lower-middle clear panel of the Round Carboy.
 */
function createRoundJugPrintTexture(stationTitle = 'SEASIDE') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 380;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;

    const drawWaveBand = (yCenter, color) => {
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx - 115, yCenter - 10);
        ctx.bezierCurveTo(cx - 75, yCenter - 32, cx - 35, yCenter + 12, cx, yCenter - 10);
        ctx.bezierCurveTo(cx + 35, yCenter - 32, cx + 75, yCenter + 12, cx + 115, yCenter - 10);
        ctx.lineTo(cx + 115, yCenter + 16);
        ctx.bezierCurveTo(cx + 75, yCenter + 38, cx + 35, yCenter - 6, cx, yCenter + 16);
        ctx.bezierCurveTo(cx - 35, yCenter + 38, cx - 75, yCenter - 6, cx - 115, yCenter + 16);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    };

    drawWaveBand(92, '#38bdf8');
    drawWaveBand(134, '#0284c7');
    drawWaveBand(176, '#8DB600');

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 58px sans-serif';
    ctx.fillText(stationTitle.toUpperCase(), cx, 256);

    ctx.fillStyle = '#0369a1';
    ctx.font = '800 20px sans-serif';
    ctx.fillText('PURIFIED WATER • 20L', cx, 290);

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
        ctx.font = '900 38px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PROPERTY OF', w / 2, 62);

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

        // Bold Station Title
        ctx.fillStyle = '#0369a1';
        ctx.font = '900 72px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(stationTitle.toUpperCase(), w / 2, 304);

        // Apple Green "WATER REFILLING STATION" Ribbon
        ctx.fillStyle = '#659000';
        ctx.fillRect(28, 326, w - 56, 48);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px sans-serif';
        ctx.fillText('WATER REFILLING STATION', w / 2, 358);

        // Quality & Location Details
        ctx.fillStyle = '#0f172a';
        ctx.font = '800 22px sans-serif';
        ctx.fillText('Purified Drinking Water', w / 2, 412);

        ctx.fillStyle = '#475569';
        ctx.font = '700 19px sans-serif';
        ctx.fillText('Laois, Labrador, Pangasinan', w / 2, 444);

        ctx.fillStyle = '#0284c7';
        ctx.font = '800 18px monospace';
        ctx.fillText(tdsLabel, w / 2, 478);

        // Bottom Yellow/Red Warning Strip
        ctx.fillStyle = '#facc15';
        ctx.fillRect(0, h - 84, w, 84);
        ctx.fillStyle = '#b91c1c';
        ctx.font = '900 23px sans-serif';
        ctx.fillText('DO NOT REMOVE THIS STICKER', w / 2, h - 34);

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

    const cleanTitle = stationName.replace(/water refilling station/i, '').trim() || 'SEASIDE';
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

    // 5. Seaside Triple-Wave Decal on Lower-Middle Clear Panel
    const roundPrintTex = createRoundJugPrintTexture(cleanTitle);
    disposables.push(roundPrintTex);
    const roundPrintArc = Math.PI * 0.48;
    const roundPrintGeo = trackGeo(
        new THREE.CylinderGeometry(
            0.955,
            0.955,
            0.56,
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

            // Match meniscus disc radius smoothly to the tapered shoulder above 92.7%
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
 * Shared 3D Builder: 20L Slim Water Container with Recessed Corner Push-Paddle
 * Faucet (White Spout + Red Vertical Thumb Paddle), Top Handle, Wide Cap w/ White Seal,
 * Rear Breather Cap, Property Sticker & Optional Sight-Level Window.
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

    const cleanTitle = stationName.replace(/water refilling station/i, '').trim() || 'SEASIDE';

    const slimBlueMat = trackMat(
        new THREE.MeshPhysicalMaterial({
            color: 0x005be0,
            emissive: 0x00266e,
            emissiveIntensity: darkMode ? 0.28 : 0.12,
            roughness: 0.25,
            metalness: 0.04,
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
    group.add(new THREE.Mesh(lowerBaseGeo, slimBlueMat));

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
    group.add(new THREE.Mesh(upperTorsoGeo, slimBlueMat));

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
    group.add(new THREE.Mesh(shoulderGeo, slimBlueMat));

    // 4. Top Integrated Center Carry Handle Bridge
    const topHandleCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.08, 0.06),
        new THREE.Vector3(0, 1.32, 0.02),
        new THREE.Vector3(0, 1.34, -0.34),
        new THREE.Vector3(0, 1.08, -0.4)
    ]);
    const topHandleGeo = trackGeo(new THREE.TubeGeometry(topHandleCurve, 24, 0.075, 14, false));
    group.add(new THREE.Mesh(topHandleGeo, slimBlueMat));

    // 5. Open Neck Mouth + Animatable Wide Ribbed Blue Cap w/ White Tamper-Evident Seal Band
    const wideCapMat = trackMat(
        new THREE.MeshStandardMaterial({
            color: 0x0044b3,
            roughness: 0.28,
            metalness: 0.08
        })
    );

    const neckMouth = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.25, 0.26, 0.12, 32)),
        slimBlueMat
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
        slimBlueMat
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

    // 8. "PROPERTY OF SEASIDE" Waterproof Sticker on Narrow Front Chest
    const slimStickerTex = createSlimJugPropertyStickerTexture({
        stationTitle: cleanTitle,
        tdsLabel
    });
    disposables.push(slimStickerTex);
    const slimStickerGeo = trackGeo(new THREE.PlaneGeometry(showSightGauge ? 0.7 : 0.74, showSightGauge ? 0.88 : 0.92));
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
            color: darkMode ? 0x0284c7 : 0x0369a1,
            transparent: true,
            opacity: darkMode ? 0.22 : 0.14
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

export default function WaterStation3DModel({
                                                darkMode = false,
                                                interactive = true,
                                                stationName = 'SEASIDE',
                                                tdsLabel = 'TDS: 002 PPM • 21-STAGE'
                                            }) {
    const containerRef = useRef(null);
    const [selectedContainer, setSelectedContainer] = useState('both'); // 'both' | 'round' | 'slim'
    const selectedContainerRef = useRef(selectedContainer);
    selectedContainerRef.current = selectedContainer;

    useEffect(() => {
        const container = containerRef.current;
        if (!container || typeof window === 'undefined') return;

        let width = container.clientWidth || 360;
        let height = container.clientHeight || 340;

        // 1. Scene & Camera
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
        camera.position.set(0, 0.35, 7.6);

        // 2. WebGL Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = darkMode ? 1.24 : 1.1;
        container.appendChild(renderer.domElement);

        // 3. Studio Lighting
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
        const roundCarboy = buildRoundCarboy3D({
            darkMode,
            stationName,
            initialFill: 0.86,
            withCap: true
        });
        rootGroup.add(roundCarboy.group);

        const slimContainer = buildSlimContainer3D({
            darkMode,
            stationName,
            tdsLabel,
            initialFill: 0.86,
            withCap: true,
            showSightGauge: false
        });
        rootGroup.add(slimContainer.group);

        // Pointer Interaction (Drag to Spin + Hover Parallax)
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

        container.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        container.addEventListener('pointerleave', onPointerLeave);

        const handleResize = () => {
            if (!container) return;
            width = container.clientWidth || 360;
            height = container.clientHeight || 340;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        // 60FPS Animation Loop
        let animationFrameId;
        const clock = new THREE.Clock();

        const animate = () => {
            const t = clock.getElapsedTime();
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

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            container.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            container.removeEventListener('pointerleave', onPointerLeave);

            roundCarboy.dispose();
            slimContainer.dispose();
            renderer.dispose();
            if (renderer.domElement && container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [darkMode, interactive, stationName, tdsLabel]);

    return (
        <div className="relative w-full h-full min-h-[290px] sm:min-h-[340px]">
            <div
                ref={containerRef}
                className="w-full h-full min-h-[290px] sm:min-h-[340px] cursor-grab active:cursor-grabbing select-none touch-none"
                title="Drag to rotate 20L containers"
            />

            {/* Container Type Switcher Pill */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 rounded-full bg-white/85 dark:bg-slate-950/75 backdrop-blur-md border border-slate-200/80 dark:border-white/15 shadow-sm">
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