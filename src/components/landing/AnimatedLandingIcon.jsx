// src/components/landing/AnimatedLandingIcon.jsx
import React, { useState, useEffect, useRef } from 'react';
import UseAnimations from 'react-useanimations';

// Core react-useanimations modules
import activity from 'react-useanimations/lib/activity';
import alertCircle from 'react-useanimations/lib/alertCircle';
import arrowDown from 'react-useanimations/lib/arrowDown';
import arrowLeft from 'react-useanimations/lib/arrowLeft';
import arrowRight from 'react-useanimations/lib/arrowRight';
import arrowUp from 'react-useanimations/lib/arrowUp';
import calendar from 'react-useanimations/lib/calendar';
import checkmark from 'react-useanimations/lib/checkmark';
import chevronDown from 'react-useanimations/lib/chevronDown';
import chevronLeft from 'react-useanimations/lib/chevronLeft';
import chevronRight from 'react-useanimations/lib/chevronRight';
import explore from 'react-useanimations/lib/explore';
import facebook from 'react-useanimations/lib/facebook';
import folder from 'react-useanimations/lib/folder';
import heart from 'react-useanimations/lib/heart';
import home from 'react-useanimations/lib/home';
import infinity from 'react-useanimations/lib/infinity';
import info from 'react-useanimations/lib/info';
import lock from 'react-useanimations/lib/lock';
import mail from 'react-useanimations/lib/mail';
import maximizeMinimize from 'react-useanimations/lib/maximizeMinimize';
import plusToX from 'react-useanimations/lib/plusToX';
import settings from 'react-useanimations/lib/settings';
import settings2 from 'react-useanimations/lib/settings2';
import share from 'react-useanimations/lib/share';
import star from 'react-useanimations/lib/star';
import userPlus from 'react-useanimations/lib/userPlus';
import video from 'react-useanimations/lib/video';
import visibility from 'react-useanimations/lib/visibility';
import volume from 'react-useanimations/lib/volume';

const USE_ANIMATIONS_MAP = {
    activity,
    alertCircle,
    arrowDown,
    arrowLeft,
    arrowRight,
    arrowUp,
    calendar,
    checkmark,
    chevronDown,
    chevronLeft,
    chevronRight,
    explore,
    facebook,
    folder,
    heart,
    home,
    infinity,
    info,
    lock,
    mail,
    maximizeMinimize,
    plusToX,
    settings,
    settings2,
    share,
    star,
    userPlus,
    video,
    visibility,
    volume
};

/**
 * Matching micro-animated SVG icons for water-station domain glyphs
 * (water droplet, delivery multicab, ice crystal, sun/moon, phone, messenger, clock)
 */
function CustomAliveSvg({ name, size = 22, color = 'currentColor', isHovered = false }) {
    const common = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className: 'shrink-0 transition-transform duration-300'
    };

    switch (name) {
        case 'droplet':
            return (
                <svg {...common} style={{ transform: isHovered ? 'scale(1.14) translateY(-1px)' : undefined }}>
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                    <path
                        d="M9.5 14.5a3.5 3.5 0 0 0 3.5 3.5"
                        className="animate-pulse"
                    />
                </svg>
            );

        case 'truck':
            return (
                <svg
                    {...common}
                    style={{ transform: isHovered ? 'translateX(2px)' : undefined }}
                >
                    <path d="M1 3h15v13H1z" />
                    <path d="M16 8h4l3 3v5h-7V8z" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
            );

        case 'snowflake':
            return (
                <svg
                    {...common}
                    className="shrink-0 animate-[spin_14s_linear_infinite]"
                    style={{ transform: isHovered ? 'scale(1.15)' : undefined }}
                >
                    <line x1="12" y1="2" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
                </svg>
            );

        case 'package':
            return (
                <svg
                    {...common}
                    style={{ transform: isHovered ? 'translateY(-2px) scale(1.08)' : undefined }}
                >
                    <path d="M16.5 9.4l-9-5.19" />
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
            );

        case 'sun':
            return (
                <svg
                    {...common}
                    className="shrink-0 animate-[spin_18s_linear_infinite]"
                >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
            );

        case 'moon':
            return (
                <svg
                    {...common}
                    style={{ transform: isHovered ? 'rotate(-14deg) scale(1.1)' : undefined }}
                >
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
            );

        case 'phone':
            return (
                <svg
                    {...common}
                    style={{ transform: isHovered ? 'rotate(-12deg) scale(1.1)' : undefined }}
                >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
            );

        case 'messenger':
            return (
                <svg
                    {...common}
                    style={{ transform: isHovered ? 'scale(1.12)' : undefined }}
                >
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    <polyline points="8 13 11 10 13 12 16 9" className="animate-pulse" />
                </svg>
            );

        case 'clock':
            return (
                <svg {...common}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline
                        points="12 6 12 12 16 14"
                        style={{
                            transformOrigin: '12px 12px',
                            transform: isHovered ? 'rotate(45deg)' : undefined,
                            transition: 'transform 0.4s ease'
                        }}
                    />
                </svg>
            );

        case 'camera':
            return (
                <svg
                    {...common}
                    style={{ transform: isHovered ? 'scale(1.1)' : undefined }}
                >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" className="animate-pulse" />
                </svg>
            );

        case 'shield':
            return (
                <svg
                    {...common}
                    style={{ transform: isHovered ? 'scale(1.1)' : undefined }}
                >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                </svg>
            );

        case 'box':
            return (
                <svg
                    {...common}
                    style={{ transform: isHovered ? 'rotate(8deg) scale(1.1)' : undefined }}
                >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
            );

        case 'gamepad':
        default:
            return (
                <svg
                    {...common}
                    style={{ transform: isHovered ? 'rotate(-8deg) scale(1.12)' : undefined }}
                >
                    <rect x="2" y="6" width="20" height="12" rx="4" />
                    <line x1="6" y1="12" x2="10" y2="12" />
                    <line x1="8" y1="10" x2="8" y2="14" />
                    <circle cx="15" cy="11" r="1" fill={color} />
                    <circle cx="18" cy="13" r="1" fill={color} />
                </svg>
            );
    }
}

export default function AnimatedLandingIcon({
                                                name = 'checkmark',
                                                size = 22,
                                                strokeColor = 'currentColor',
                                                loop = false,
                                                autoplay = true,
                                                speed = 1.15,
                                                triggerKey = 0,
                                                className = ''
                                            }) {
    const hostRef = useRef(null);
    const [playCounter, setPlayCounter] = useState(autoplay ? 1 : 0);
    const [isHovered, setIsHovered] = useState(false);

    // Replay animation whenever parent card triggers hover (triggerKey increments)
    useEffect(() => {
        if (triggerKey > 0) {
            setPlayCounter((c) => c + 1);
        }
    }, [triggerKey]);

    // Trigger draw-in animation once when scrolled into viewport
    useEffect(() => {
        const el = hostRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setPlayCounter((c) => c + 1);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const animModule = USE_ANIMATIONS_MAP[name];

    return (
        <span
            ref={hostRef}
            onMouseEnter={() => {
                setIsHovered(true);
                setPlayCounter((c) => c + 1);
            }}
            onMouseLeave={() => setIsHovered(false)}
            className={`inline-flex items-center justify-center leading-none shrink-0 ${className}`}
            style={{ width: size, height: size }}
        >
            {animModule ? (
                <UseAnimations
                    key={loop ? 'loop' : playCounter}
                    animation={animModule}
                    size={size}
                    strokeColor={strokeColor}
                    loop={loop}
                    autoplay={loop || playCounter > 0}
                    speed={speed}
                />
            ) : (
                <CustomAliveSvg
                    name={name}
                    size={size}
                    color={strokeColor}
                    isHovered={isHovered || triggerKey > 0}
                />
            )}
        </span>
    );
}