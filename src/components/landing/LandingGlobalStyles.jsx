// src/components/landing/LandingGlobalStyles.jsx
import React from 'react';

export default function LandingGlobalStyles() {
    return (
        <style jsx global>{`
            .seaside-glass-input:-webkit-autofill,
            .seaside-glass-input:-webkit-autofill:hover,
            .seaside-glass-input:-webkit-autofill:focus,
            .seaside-glass-input:-webkit-autofill:active {
                -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
                -webkit-text-fill-color: #0f172a !important;
                caret-color: #0f172a !important;
                border-color: rgba(141, 182, 0, 0.65) !important;
                transition: background-color 5000s ease-in-out 0s;
            }

            .dark .seaside-glass-input:-webkit-autofill,
            .dark .seaside-glass-input:-webkit-autofill:hover,
            .dark .seaside-glass-input:-webkit-autofill:focus,
            .dark .seaside-glass-input:-webkit-autofill:active {
                -webkit-box-shadow: 0 0 0 1000px #09111e inset !important;
                -webkit-text-fill-color: #f8fafc !important;
                caret-color: #f8fafc !important;
                border-color: rgba(141, 182, 0, 0.55) !important;
                transition: background-color 5000s ease-in-out 0s;
            }

            /* --- Realistic 3D Refractive Water Droplets --- */
            .water-droplet-3d {
                border-radius: 56% 44% 48% 52% / 62% 58% 42% 38%;
                background: radial-gradient(
                    circle at 30% 28%,
                    rgba(255, 255, 255, 0.85) 0%,
                    rgba(224, 242, 254, 0.45) 28%,
                    rgba(6, 182, 212, 0.16) 68%,
                    rgba(141, 182, 0, 0.22) 100%
                );
                border: 1px solid rgba(255, 255, 255, 0.85);
                box-shadow:
                    inset 6px 8px 18px rgba(255, 255, 255, 0.85),
                    inset -8px -10px 20px rgba(6, 182, 212, 0.28),
                    inset -2px -4px 10px rgba(141, 182, 0, 0.22),
                    0 18px 36px rgba(14, 116, 144, 0.15);
                backdrop-filter: blur(6px);
                animation: liquidSurfaceMorph 9s ease-in-out infinite;
            }

            .dark .water-droplet-3d {
                background: radial-gradient(
                    circle at 30% 28%,
                    rgba(255, 255, 255, 0.28) 0%,
                    rgba(34, 211, 238, 0.14) 32%,
                    rgba(6, 182, 212, 0.06) 68%,
                    rgba(141, 182, 0, 0.14) 100%
                );
                border: 1px solid rgba(255, 255, 255, 0.22);
                box-shadow:
                    inset 6px 8px 16px rgba(255, 255, 255, 0.24),
                    inset -8px -10px 22px rgba(6, 182, 212, 0.26),
                    inset -2px -4px 10px rgba(141, 182, 0, 0.2),
                    0 22px 44px rgba(0, 0, 0, 0.55);
            }

            .water-droplet-lime {
                background: radial-gradient(
                    circle at 30% 28%,
                    rgba(255, 255, 255, 0.85) 0%,
                    rgba(236, 252, 203, 0.45) 30%,
                    rgba(141, 182, 0, 0.18) 68%,
                    rgba(6, 182, 212, 0.22) 100%
                );
            }

            .dark .water-droplet-lime {
                background: radial-gradient(
                    circle at 30% 28%,
                    rgba(255, 255, 255, 0.26) 0%,
                    rgba(163, 209, 0, 0.14) 32%,
                    rgba(141, 182, 0, 0.06) 68%,
                    rgba(6, 182, 212, 0.14) 100%
                );
            }

            .water-droplet-3d::before {
                content: '';
                position: absolute;
                top: 18%;
                left: 22%;
                width: 24%;
                height: 15%;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.9);
                transform: rotate(-28deg);
                filter: blur(0.5px);
            }

            .dark .water-droplet-3d::before {
                background: rgba(255, 255, 255, 0.65);
            }

            .water-droplet-3d::after {
                content: '';
                position: absolute;
                bottom: 18%;
                right: 22%;
                width: 12%;
                height: 12%;
                border-radius: 50%;
                background: rgba(163, 209, 0, 0.65);
                filter: blur(1px);
            }

            @keyframes liquidSurfaceMorph {
                0%,
                100% {
                    border-radius: 56% 44% 48% 52% / 62% 58% 42% 38%;
                }
                33% {
                    border-radius: 48% 52% 43% 57% / 55% 63% 37% 45%;
                }
                66% {
                    border-radius: 61% 39% 53% 47% / 58% 49% 51% 42%;
                }
            }

            /* --- Effervescent Rising Micro-Bubbles --- */
            .water-micro-bubble {
                position: absolute;
                bottom: -24px;
                border-radius: 9999px;
                background: radial-gradient(
                    circle at 32% 32%,
                    rgba(255, 255, 255, 0.9),
                    rgba(6, 182, 212, 0.25) 65%,
                    rgba(141, 182, 0, 0.2) 100%
                );
                border: 1px solid rgba(255, 255, 255, 0.7);
                box-shadow: inset 1px 1px 3px rgba(255, 255, 255, 0.8);
                animation: bubbleRise linear infinite;
                opacity: 0;
            }

            .dark .water-micro-bubble {
                background: radial-gradient(
                    circle at 32% 32%,
                    rgba(255, 255, 255, 0.45),
                    rgba(34, 211, 238, 0.14) 65%,
                    rgba(141, 182, 0, 0.12) 100%
                );
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            @keyframes bubbleRise {
                0% {
                    transform: translateY(0) translateX(0) scale(0.75);
                    opacity: 0;
                }
                15% {
                    opacity: 0.75;
                }
                50% {
                    transform: translateY(-48vh) translateX(8px) scale(1);
                }
                85% {
                    opacity: 0.55;
                }
                100% {
                    transform: translateY(-102vh) translateX(-6px) scale(1.1);
                    opacity: 0;
                }
            }

            /* --- Coastal Bottom Wave Motion --- */
            @keyframes seasideWaveSlide {
                0% {
                    transform: translateX(0);
                }
                100% {
                    transform: translateX(-50%);
                }
            }

            .seaside-wave-slow {
                animation: seasideWaveSlide 18s linear infinite;
            }

            /* --- Seaside Brand Logo Opening & Living Animations --- */
            @keyframes seasideBrandEntrance {
                0% {
                    opacity: 0;
                    transform: translate3d(-18px, 10px, 0) scale(0.8) rotate(-5deg);
                }
                65% {
                    opacity: 1;
                    transform: translate3d(2px, -2px, 0) scale(1.04) rotate(1deg);
                }
                100% {
                    opacity: 1;
                    transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
                }
            }

            @keyframes seasideWordmarkReveal {
                0% {
                    opacity: 0;
                    transform: translate3d(-14px, 0, 0);
                    filter: blur(4px);
                }
                100% {
                    opacity: 1;
                    transform: translate3d(0, 0, 0);
                    filter: blur(0px);
                }
            }

            @keyframes seasideRippleBurst {
                0% {
                    opacity: 0.75;
                    transform: scale(0.85);
                }
                100% {
                    opacity: 0;
                    transform: scale(1.65);
                }
            }

            @keyframes seasidePalmBreeze {
                0%,
                100% {
                    transform: rotate(-2deg) translateY(0px);
                }
                50% {
                    transform: rotate(2.5deg) translateY(-1.5px);
                }
            }

            @keyframes seasideGlassSheen {
                0% {
                    transform: translateX(-140%) skewX(-22deg);
                }
                35%,
                100% {
                    transform: translateX(240%) skewX(-22deg);
                }
            }

            @keyframes seasideTileGlowLight {
                0%,
                100% {
                    box-shadow: 0 6px 20px rgba(141, 182, 0, 0.2), 0 0 0 1px rgba(141, 182, 0, 0.15);
                }
                50% {
                    box-shadow: 0 10px 28px rgba(141, 182, 0, 0.34), 0 0 16px rgba(6, 182, 212, 0.22);
                }
            }

            @keyframes seasideTileGlowDark {
                0%,
                100% {
                    box-shadow: 0 0 18px rgba(141, 182, 0, 0.22), 0 0 0 1px rgba(141, 182, 0, 0.22);
                }
                50% {
                    box-shadow: 0 0 28px rgba(141, 182, 0, 0.42), 0 0 18px rgba(34, 211, 238, 0.24);
                }
            }

            .seaside-brand-enter {
                animation: seasideBrandEntrance 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
            }

            .seaside-wordmark-enter {
                animation: seasideWordmarkReveal 0.75s cubic-bezier(0.22, 1, 0.36, 1) 0.14s both;
            }

            .seaside-brand-ripple {
                animation: seasideRippleBurst 1.35s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
            }

            .seaside-palm-breeze {
                transform-origin: bottom center;
                animation: seasidePalmBreeze 3.6s ease-in-out 0.8s infinite;
            }

            .seaside-brand-sheen {
                width: 45%;
                background: linear-gradient(
                    90deg,
                    rgba(255, 255, 255, 0) 0%,
                    rgba(255, 255, 255, 0.55) 50%,
                    rgba(255, 255, 255, 0) 100%
                );
                animation: seasideGlassSheen 4.5s ease-in-out 0.45s infinite;
            }

            .seaside-tile-glow {
                animation: seasideTileGlowLight 3.5s ease-in-out 0.8s infinite;
            }

            .dark .seaside-tile-glow {
                animation: seasideTileGlowDark 3.5s ease-in-out 0.8s infinite;
            }

            @keyframes blob {
                0% {
                    transform: translate(0px, 0px) scale(1);
                }
                33% {
                    transform: translate(30px, -50px) scale(1.1);
                }
                66% {
                    transform: translate(-20px, 20px) scale(0.92);
                }
                100% {
                    transform: translate(0px, 0px) scale(1);
                }
            }
            .animate-blob {
                animation: blob 15s infinite alternate ease-in-out;
            }
            .animation-delay-2000 {
                animation-delay: 2s;
            }
            .animation-delay-4000 {
                animation-delay: 4s;
            }

            @keyframes float-slow {
                0%,
                100% {
                    margin-top: 0px;
                }
                50% {
                    margin-top: -18px;
                }
            }
            @keyframes float-medium {
                0%,
                100% {
                    margin-top: 0px;
                }
                50% {
                    margin-top: -14px;
                }
            }
            @keyframes float-fast {
                0%,
                100% {
                    margin-top: 0px;
                }
                50% {
                    margin-top: -22px;
                }
            }

            .animate-float-slow {
                animation: float-slow 8s ease-in-out infinite;
            }
            .animate-float-medium {
                animation: float-medium 6s ease-in-out infinite;
            }
            .animate-float-fast {
                animation: float-fast 5s ease-in-out infinite;
            }

            @keyframes shimmer {
                100% {
                    transform: translateX(100%);
                }
            }
            .animate-shimmer {
                animation: shimmer 1.8s infinite;
            }

            @keyframes gradient-x {
                0%,
                100% {
                    background-position: 0% 50%;
                }
                50% {
                    background-position: 100% 50%;
                }
            }
            .animate-gradient-x {
                background-size: 200% 200%;
                animation: gradient-x 4s ease infinite;
            }

            .perspective-wrapper {
                perspective: 1200px;
            }

            .translate-z-\[30px\] {
                transform: translateZ(30px);
            }

            .translate-z-\[20px\] {
                transform: translateZ(20px);
            }
        `}</style>
    );
}