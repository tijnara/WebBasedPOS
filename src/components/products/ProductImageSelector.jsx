// src/components/products/ProductImageSelector.jsx
import React, { useRef, useState, useEffect } from 'react';
import { Upload, Sparkles, Check, Image as ImageIcon, X } from 'lucide-react';

export const UNIFORM_IMAGE_SIZE = 400; // Identical 400x400 (1:1) size for all 3D presets and uploaded photos

export const PH_WRS_3D_PRESETS = [
    {
        id: 'slim-5gal-faucet',
        label: '5-Gal Slim w/ Faucet',
        subtitle: '20L Rectangular Container',
        category: 'Containers',
        suggestedPrice: 180
    },
    {
        id: 'round-5gal-carboy',
        label: '5-Gal Round Jug',
        subtitle: '20L Polycarbonate Carboy',
        category: 'Containers',
        suggestedPrice: 200
    },
    {
        id: 'alkaline-5gal',
        label: 'Alkaline Refill (20L)',
        subtitle: 'pH 8.5+ Alkaline Water',
        category: 'Refills/Services',
        suggestedPrice: 35
    },
    {
        id: 'walk-in-refill',
        label: 'Purified Refill (20L)',
        subtitle: 'Walk-In / Delivery Refill',
        category: 'Refills/Services',
        suggestedPrice: 25
    },
    {
        id: 'bottled-water',
        label: 'Bottled Water (500ml)',
        subtitle: '350ml / 500ml / 1L PET',
        category: 'Bottled Water',
        suggestedPrice: 15
    },
    {
        id: 'mini-dispenser-jug',
        label: '2.5-Gal / 10L Jug',
        subtitle: 'Portable Handle Container',
        category: 'Containers',
        suggestedPrice: 120
    },
    {
        id: 'tube-ice-pack',
        label: 'Purified Tube Ice',
        subtitle: '3kg / 5kg Food-Grade Bag',
        category: 'Ice Cubes/Tubes',
        suggestedPrice: 40
    },
    {
        id: 'caps-seals',
        label: 'Non-Spill Caps & Seals',
        subtitle: 'Replacement Cap & Shrink Seal',
        category: 'Accessories',
        suggestedPrice: 5
    }
];

function drawPresetToCanvas(presetId, size = UNIFORM_IMAGE_SIZE) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const s = size / 200; // Normalized 200x200 coordinate space
    ctx.scale(s, s);
    ctx.clearRect(0, 0, 200, 200);

    // Subtle 3D floor contact shadow shared across all presets
    const shadowGrad = ctx.createRadialGradient(100, 174, 8, 100, 174, 58);
    shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.24)');
    shadowGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(100, 174, 56, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    if (presetId === 'slim-5gal-faucet') {
        // Top handle
        ctx.strokeStyle = '#659000';
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(76, 36);
        ctx.lineTo(76, 22);
        ctx.lineTo(116, 22);
        ctx.lineTo(116, 36);
        ctx.stroke();

        // Blue cap
        const capGrad = ctx.createLinearGradient(116, 22, 144, 22);
        capGrad.addColorStop(0, '#0284c7');
        capGrad.addColorStop(0.5, '#38bdf8');
        capGrad.addColorStop(1, '#0369a1');
        ctx.fillStyle = capGrad;
        ctx.beginPath();
        ctx.roundRect(118, 22, 24, 14, 4);
        ctx.fill();

        // 3D Apple-Green Slim Body
        const bodyGrad = ctx.createLinearGradient(48, 34, 152, 168);
        bodyGrad.addColorStop(0, '#a3e635');
        bodyGrad.addColorStop(0.45, '#8DB600');
        bodyGrad.addColorStop(1, '#4d7c0f');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(52, 34, 96, 134, 18);
        ctx.fill();

        // Specular side highlight
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.beginPath();
        ctx.roundRect(60, 44, 11, 112, 6);
        ctx.fill();

        // Property sticker
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(76, 56, 56, 68, 7);
        ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(76, 56, 56, 14, [7, 7, 0, 0]);
        ctx.fill();
        ctx.fillStyle = '#0369a1';
        ctx.font = '900 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SEASIDE', 104, 88);
        ctx.fillStyle = '#659000';
        ctx.font = '800 8px sans-serif';
        ctx.fillText('20L SLIM', 104, 102);

        // White + Red Faucet
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(126, 142, 28, 12, 4);
        ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(136, 130, 8, 14, 3);
        ctx.fill();
    } else if (presetId === 'round-5gal-carboy') {
        // White non-spill cap + blue neck
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(82, 16, 36, 14, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(78, 30, 44, 9, 4);
        ctx.fill();

        // 3D Round Carboy Shell
        const shellGrad = ctx.createLinearGradient(44, 38, 156, 168);
        shellGrad.addColorStop(0, '#bae6fd');
        shellGrad.addColorStop(0.5, '#38bdf8');
        shellGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = shellGrad;
        ctx.beginPath();
        ctx.moveTo(82, 39);
        ctx.lineTo(118, 39);
        ctx.quadraticCurveTo(154, 48, 154, 72);
        ctx.lineTo(154, 150);
        ctx.quadraticCurveTo(154, 168, 136, 168);
        ctx.lineTo(64, 168);
        ctx.quadraticCurveTo(46, 168, 46, 150);
        ctx.lineTo(46, 72);
        ctx.quadraticCurveTo(46, 48, 82, 39);
        ctx.closePath();
        ctx.fill();

        // Inner water level
        const waterGrad = ctx.createLinearGradient(46, 72, 154, 168);
        waterGrad.addColorStop(0, 'rgba(125, 211, 252, 0.92)');
        waterGrad.addColorStop(1, 'rgba(3, 105, 161, 0.95)');
        ctx.fillStyle = waterGrad;
        ctx.beginPath();
        ctx.roundRect(49, 74, 102, 91, [4, 4, 16, 16]);
        ctx.fill();

        // Frosted bumper ribs
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 3;
        [94, 118, 142].forEach((y) => {
            ctx.beginPath();
            ctx.moveTo(50, y);
            ctx.quadraticCurveTo(100, y + 6, 150, y);
            ctx.stroke();
        });

        // Gloss highlight
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.roundRect(57, 62, 10, 92, 5);
        ctx.fill();
    } else if (presetId === 'alkaline-5gal') {
        // Teal/Emerald Alkaline 5-Gal Jug
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.roundRect(80, 18, 40, 15, 5);
        ctx.fill();

        const alkGrad = ctx.createLinearGradient(46, 34, 154, 168);
        alkGrad.addColorStop(0, '#5eead4');
        alkGrad.addColorStop(0.5, '#0d9488');
        alkGrad.addColorStop(1, '#115e59');
        ctx.fillStyle = alkGrad;
        ctx.beginPath();
        ctx.roundRect(48, 34, 104, 134, 22);
        ctx.fill();

        // pH 8.5+ Badge
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(100, 104, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f766e';
        ctx.font = '900 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('pH 8.5+', 100, 102);
        ctx.fillStyle = '#659000';
        ctx.font = '800 8px sans-serif';
        ctx.fillText('ALKALINE', 100, 115);

        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.roundRect(58, 50, 9, 102, 5);
        ctx.fill();
    } else if (presetId === 'walk-in-refill') {
        // Stainless Nozzle + 3D Purified Water Droplet
        const pipeGrad = ctx.createLinearGradient(82, 18, 118, 18);
        pipeGrad.addColorStop(0, '#475569');
        pipeGrad.addColorStop(0.5, '#f1f5f9');
        pipeGrad.addColorStop(1, '#334155');
        ctx.fillStyle = pipeGrad;
        ctx.beginPath();
        ctx.roundRect(84, 16, 32, 26, 4);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(76, 38, 48, 12, 4);
        ctx.fill();

        // Water stream
        ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.fillRect(94, 50, 12, 34);

        // Large 3D Glossy Water Droplet
        const dropGrad = ctx.createRadialGradient(88, 106, 8, 100, 122, 48);
        dropGrad.addColorStop(0, '#bae6fd');
        dropGrad.addColorStop(0.5, '#0ea5e9');
        dropGrad.addColorStop(1, '#0369a1');
        ctx.fillStyle = dropGrad;
        ctx.beginPath();
        ctx.moveTo(100, 74);
        ctx.bezierCurveTo(100, 74, 62, 114, 62, 136);
        ctx.arc(100, 136, 38, Math.PI, 0, true);
        ctx.bezierCurveTo(138, 114, 100, 74, 100, 74);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.ellipse(84, 124, 6, 14, -0.35, 0, Math.PI * 2);
        ctx.fill();
    } else if (presetId === 'bottled-water') {
        // PET Bottle Cap
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(86, 16, 28, 14, 4);
        ctx.fill();

        // Bottle Body
        const petGrad = ctx.createLinearGradient(70, 30, 130, 168);
        petGrad.addColorStop(0, '#e0f2fe');
        petGrad.addColorStop(0.45, '#38bdf8');
        petGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = petGrad;
        ctx.beginPath();
        ctx.moveTo(88, 30);
        ctx.lineTo(112, 30);
        ctx.quadraticCurveTo(130, 48, 130, 66);
        ctx.lineTo(130, 154);
        ctx.quadraticCurveTo(130, 168, 116, 168);
        ctx.lineTo(84, 168);
        ctx.quadraticCurveTo(70, 168, 70, 154);
        ctx.lineTo(70, 66);
        ctx.quadraticCurveTo(70, 48, 88, 30);
        ctx.closePath();
        ctx.fill();

        // Seaside Bottle Label Band
        ctx.fillStyle = '#8DB600';
        ctx.fillRect(70, 88, 60, 34);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SEASIDE', 100, 105);
        ctx.font = '700 7px sans-serif';
        ctx.fillText('PURIFIED', 100, 116);

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.roundRect(77, 56, 7, 100, 4);
        ctx.fill();
    } else if (presetId === 'mini-dispenser-jug') {
        // Handle + Cap
        ctx.fillStyle = '#0369a1';
        ctx.beginPath();
        ctx.roundRect(82, 24, 36, 14, 4);
        ctx.fill();

        const miniGrad = ctx.createLinearGradient(56, 38, 144, 168);
        miniGrad.addColorStop(0, '#7dd3fc');
        miniGrad.addColorStop(0.5, '#0ea5e9');
        miniGrad.addColorStop(1, '#0369a1');
        ctx.fillStyle = miniGrad;
        ctx.beginPath();
        ctx.roundRect(58, 38, 84, 130, 20);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(74, 82, 52, 42, 8);
        ctx.fill();
        ctx.fillStyle = '#0369a1';
        ctx.font = '900 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('10L', 100, 104);
        ctx.fillStyle = '#659000';
        ctx.font = '800 8px sans-serif';
        ctx.fillText('MINI JUG', 100, 116);
    } else if (presetId === 'tube-ice-pack') {
        // Frosted Ice Bag + 3D Ice Cylinders
        const bagGrad = ctx.createLinearGradient(52, 26, 148, 168);
        bagGrad.addColorStop(0, '#f0f9ff');
        bagGrad.addColorStop(0.5, '#bae6fd');
        bagGrad.addColorStop(1, '#7dd3fc');
        ctx.fillStyle = bagGrad;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(54, 28, 92, 140, 18);
        ctx.fill();
        ctx.stroke();

        const cubes = [
            [70, 58], [104, 54], [74, 92], [106, 90], [72, 126], [104, 124]
        ];
        cubes.forEach(([cx, cy]) => {
            ctx.fillStyle = 'rgba(255,255,255,0.88)';
            ctx.beginPath();
            ctx.roundRect(cx, cy, 24, 24, 6);
            ctx.fill();
            ctx.strokeStyle = '#7dd3fc';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });

        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(66, 86, 68, 26, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TUBE ICE', 100, 103);
    } else {
        // Non-Spill Caps & Neck Seals
        const cap1Grad = ctx.createLinearGradient(44, 68, 112, 146);
        cap1Grad.addColorStop(0, '#38bdf8');
        cap1Grad.addColorStop(1, '#0369a1');
        ctx.fillStyle = cap1Grad;
        ctx.beginPath();
        ctx.roundRect(44, 72, 68, 56, 14);
        ctx.fill();

        const cap2Grad = ctx.createLinearGradient(92, 88, 158, 162);
        cap2Grad.addColorStop(0, '#a3e635');
        cap2Grad.addColorStop(1, '#4d7c0f');
        ctx.fillStyle = cap2Grad;
        ctx.beginPath();
        ctx.roundRect(92, 92, 64, 54, 14);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(62, 134, 76, 22, 6);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.font = '900 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CAPS & SEALS', 100, 148);
    }

    return canvas;
}

/**
 * Converts a 3D preset into a uniform 400x400 (1:1) PNG File & Data URL
 */
export function exportPresetAsUniformFile(presetId) {
    const canvas = drawPresetToCanvas(presetId, UNIFORM_IMAGE_SIZE);
    const dataUrl = canvas.toDataURL('image/png');
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            const file = blob
                ? new File([blob], `preset-${presetId}.png`, { type: 'image/png' })
                : null;
            resolve({ file, dataUrl });
        }, 'image/png');
    });
}

/**
 * Normalizes any staff-uploaded image to the exact same 400x400 (1:1) square size
 */
export function normalizeUploadedFileToUniformSquare(rawFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = UNIFORM_IMAGE_SIZE;
                canvas.height = UNIFORM_IMAGE_SIZE;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, UNIFORM_IMAGE_SIZE, UNIFORM_IMAGE_SIZE);

                // Fit image proportionally centered inside the 400x400 frame (matching 3D presets)
                const padding = 20;
                const maxDim = UNIFORM_IMAGE_SIZE - padding * 2;
                const scale = Math.min(maxDim / img.width, maxDim / img.height);
                const drawW = img.width * scale;
                const drawH = img.height * scale;
                const dx = (UNIFORM_IMAGE_SIZE - drawW) / 2;
                const dy = (UNIFORM_IMAGE_SIZE - drawH) / 2;

                ctx.drawImage(img, dx, dy, drawW, drawH);

                const dataUrl = canvas.toDataURL('image/png');
                canvas.toBlob((blob) => {
                    const normalizedFile = blob
                        ? new File([blob], rawFile.name.replace(/\.[^.]+$/, '.png'), {
                            type: 'image/png'
                        })
                        : rawFile;
                    resolve({ file: normalizedFile, dataUrl });
                }, 'image/png');
            };
            img.onerror = reject;
            img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(rawFile);
    });
}

export default function ProductImageSelector({
                                                 value = '',
                                                 selectedPresetId = null,
                                                 onChange,
                                                 disabled = false
                                             }) {
    const fileInputRef = useRef(null);
    const [activePresetId, setActivePresetId] = useState(selectedPresetId);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        setActivePresetId(selectedPresetId);
    }, [selectedPresetId]);

    // Generate preview thumbnails once
    const [presetThumbs] = useState(() => {
        if (typeof document === 'undefined') return {};
        const map = {};
        PH_WRS_3D_PRESETS.forEach((p) => {
            map[p.id] = drawPresetToCanvas(p.id, 160).toDataURL('image/png');
        });
        return map;
    });

    const handleSelectPreset = async (preset) => {
        if (disabled || isProcessing) return;
        setIsProcessing(true);
        try {
            setActivePresetId(preset.id);
            const { file, dataUrl } = await exportPresetAsUniformFile(preset.id);
            onChange?.({
                imageUrl: dataUrl,
                file,
                preset,
                presetId: preset.id,
                source: 'preset'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileUpload = async (e) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile || disabled) return;
        setIsProcessing(true);
        try {
            setActivePresetId(null);
            const { file, dataUrl } = await normalizeUploadedFileToUniformSquare(rawFile);
            onChange?.({
                imageUrl: dataUrl,
                file,
                preset: null,
                presetId: null,
                source: 'upload'
            });
        } finally {
            setIsProcessing(false);
            e.target.value = '';
        }
    };

    const handleClear = () => {
        setActivePresetId(null);
        onChange?.({ imageUrl: '', file: null, preset: null, presetId: null, source: null });
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#8DB600]" />
                    <span>Product Visual (3D Preset or Upload Photo)</span>
                </label>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                    Uniform {UNIFORM_IMAGE_SIZE}×{UNIFORM_IMAGE_SIZE}px
                </span>
            </div>

            {/* Uniform Square Preview + Staff Photo Upload Trigger */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                <div className="relative w-20 h-20 aspect-square rounded-xl bg-white dark:bg-slate-900 border-2 border-[#8DB600]/60 dark:border-lime-500/40 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {value ? (
                        <>
                            <img
                                src={value}
                                alt="Selected product"
                                className="w-full h-full object-contain p-1"
                            />
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    aria-label="Reset product image"
                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/75 text-white flex items-center justify-center hover:bg-rose-600 transition-colors cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </>
                    ) : (
                        <ImageIcon className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                    )}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {activePresetId
                            ? '3D Station Preset Selected'
                            : value
                                ? 'Custom Product Photo Ready'
                                : 'Select a 3D preset below or upload a photo'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        Both 3D presets and uploaded photos are auto-sized to an identical {UNIFORM_IMAGE_SIZE}×{UNIFORM_IMAGE_SIZE} square frame.
                    </p>
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={disabled || isProcessing}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={disabled || isProcessing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-lime-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                            <Upload className="w-3.5 h-3.5 text-[#659000] dark:text-lime-400" />
                            <span>{isProcessing ? 'Sizing Image...' : 'Upload Photo'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 8 Philippine Water Refilling Station 3D Presets Grid */}
            <div className="grid grid-cols-4 gap-2">
                {PH_WRS_3D_PRESETS.map((preset) => {
                    const isSelected = activePresetId === preset.id;
                    return (
                        <button
                            key={preset.id}
                            type="button"
                            disabled={disabled || isProcessing}
                            onClick={() => handleSelectPreset(preset)}
                            title={`${preset.label} — ${preset.subtitle}`}
                            className={`relative flex flex-col items-center p-1.5 rounded-xl border text-center transition-all cursor-pointer active:scale-95 ${
                                isSelected
                                    ? 'bg-lime-50 dark:bg-lime-950/50 border-[#8DB600] ring-2 ring-[#8DB600]/30'
                                    : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-700/80 hover:border-[#8DB600]/60'
                            }`}
                        >
                            {isSelected && (
                                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#8DB600] text-white flex items-center justify-center shadow-2xs">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                            )}
                            <div className="w-12 h-12 sm:w-14 sm:h-14 aspect-square flex items-center justify-center overflow-hidden">
                                {presetThumbs[preset.id] && (
                                    <img
                                        src={presetThumbs[preset.id]}
                                        alt={preset.label}
                                        className="w-full h-full object-contain"
                                    />
                                )}
                            </div>
                            <span className="mt-1 text-[10px] font-bold text-slate-700 dark:text-slate-200 leading-tight line-clamp-2">
                                {preset.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}