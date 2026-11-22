// src/components/SafeWebGL.jsx
import React, { useState, useEffect } from 'react';

let cachedWebGLSupport = null;

export function isWebGLAvailable() {
    if (typeof window === 'undefined') return false;
    if (window.__SEASIDE_DISABLE_3D__) return false;
    if (cachedWebGLSupport !== null) return cachedWebGLSupport;

    try {
        const canvas = document.createElement('canvas');
        const gl =
            canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
            canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
            canvas.getContext('experimental-webgl');

        if (!gl) {
            cachedWebGLSupport = false;
            return false;
        }

        const loseExt = gl.getExtension('WEBGL_lose_context');
        if (loseExt) loseExt.loseContext();

        cachedWebGLSupport = true;
        return true;
    } catch {
        cachedWebGLSupport = false;
        return false;
    }
}

export function useWebGLSupport() {
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        setSupported(isWebGLAvailable());
    }, []);

    return supported;
}

class WebGLLocalBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        cachedWebGLSupport = false;
        if (typeof window !== 'undefined') {
            window.__SEASIDE_DISABLE_3D__ = true;
        }
        return { hasError: true };
    }

    componentDidCatch(error) {
        console.warn('3D scene disabled (WebGL unavailable):', error?.message || error);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? null;
        }
        return this.props.children;
    }
}

export default function SafeWebGL({ children, fallback = null }) {
    const supported = useWebGLSupport();

    if (!supported) {
        return fallback;
    }

    return (
        <WebGLLocalBoundary fallback={fallback}>
            {children}
        </WebGLLocalBoundary>
    );
}