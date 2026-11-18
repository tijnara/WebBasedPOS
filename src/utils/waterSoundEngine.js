// src/utils/waterSoundEngine.js

class WaterRefillSoundEngine {
    constructor() {
        this.ctx = null;
        this.noiseBuffer = null;
        this.enabled = true;

        // Active pouring stream nodes
        this.pourNodes = null;
        this.bubbleTimer = null;
        this.currentLiters = 0;

        // Active ozone spray nodes
        this.sprayNodes = null;
    }

    setEnabled(flag) {
        this.enabled = Boolean(flag);
        if (!this.enabled) {
            this.stopAll();
        }
    }

    ensureContext() {
        if (!this.enabled || typeof window === 'undefined') return null;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;

        if (!this.ctx) {
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        if (!this.noiseBuffer) {
            this.noiseBuffer = this.createPinkNoiseBuffer(this.ctx, 2.5);
        }
        return this.ctx;
    }

    createPinkNoiseBuffer(ctx, durationSec = 2.5) {
        const sampleRate = ctx.sampleRate;
        const length = Math.floor(sampleRate * durationSec);
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        let b0 = 0;
        let b1 = 0;
        let b2 = 0;
        let b3 = 0;
        let b4 = 0;
        let b5 = 0;
        let b6 = 0;

        for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
            b6 = white * 0.115926;
        }
        return buffer;
    }

    // =========================================================================
    // STAGE 1: HIGH-PRESSURE OZONE MIST SPRAY
    // =========================================================================
    startSanitizeSpray() {
        const ctx = this.ensureContext();
        if (!ctx || this.sprayNodes) return;

        const now = ctx.currentTime;

        const source = ctx.createBufferSource();
        source.buffer = this.noiseBuffer;
        source.loop = true;

        const hissFilter = ctx.createBiquadFilter();
        hissFilter.type = 'bandpass';
        hissFilter.frequency.setValueAtTime(3200, now);
        hissFilter.Q.setValueAtTime(1.6, now);

        const pumpOsc = ctx.createOscillator();
        pumpOsc.type = 'sine';
        pumpOsc.frequency.setValueAtTime(120, now);

        const pumpGain = ctx.createGain();
        pumpGain.gain.setValueAtTime(0.018, now);

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.001, now);
        masterGain.gain.linearRampToValueAtTime(0.24, now + 0.08);

        source.connect(hissFilter);
        hissFilter.connect(masterGain);
        pumpOsc.connect(pumpGain);
        pumpGain.connect(masterGain);
        masterGain.connect(ctx.destination);

        source.start(now);
        pumpOsc.start(now);

        this.sprayNodes = { source, pumpOsc, masterGain };
    }

    stopSanitizeSpray() {
        if (!this.sprayNodes || !this.ctx) return;
        const { source, pumpOsc, masterGain } = this.sprayNodes;
        this.sprayNodes = null;

        try {
            const now = this.ctx.currentTime;
            masterGain.gain.cancelScheduledValues(now);
            masterGain.gain.setValueAtTime(masterGain.gain.value, now);
            masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            setTimeout(() => {
                try {
                    source.stop();
                    pumpOsc.stop();
                    source.disconnect();
                    pumpOsc.disconnect();
                } catch {
                    // Already stopped
                }
            }, 110);
        } catch {
            // Ignore cleanup errors
        }
    }

    playSanitizeComplete() {
        const ctx = this.ensureContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.17);
    }

    // =========================================================================
    // STAGE 2: REALISTIC WATER POURING + RISING JUG CAVITY RESONANCE + BUBBLES
    // =========================================================================
    startWaterFlow(initialLiters = 0) {
        const ctx = this.ensureContext();
        if (!ctx || this.pourNodes) return;

        this.currentLiters = initialLiters;
        const now = ctx.currentTime;

        const source = ctx.createBufferSource();
        source.buffer = this.noiseBuffer;
        source.loop = true;

        // 1. Turbulent water jet stream body
        const streamFilter = ctx.createBiquadFilter();
        streamFilter.type = 'bandpass';
        streamFilter.frequency.setValueAtTime(820, now);
        streamFilter.Q.setValueAtTime(0.95, now);

        const streamGain = ctx.createGain();
        streamGain.gain.setValueAtTime(0.42, now);

        // 2. Resonant 20L Container Air Cavity (Pitch rises as water fills the jug)
        const cavityFilter = ctx.createBiquadFilter();
        cavityFilter.type = 'bandpass';
        cavityFilter.frequency.setValueAtTime(this.computeCavityFreq(initialLiters), now);
        cavityFilter.Q.setValueAtTime(5.2, now);

        const cavityGain = ctx.createGain();
        cavityGain.gain.setValueAtTime(0.55, now);

        // 3. High-frequency splash & aeration fizz
        const fizzFilter = ctx.createBiquadFilter();
        fizzFilter.type = 'highpass';
        fizzFilter.frequency.setValueAtTime(2400, now);

        const fizzGain = ctx.createGain();
        fizzGain.gain.setValueAtTime(0.18, now);

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.001, now);
        masterGain.gain.linearRampToValueAtTime(0.45, now + 0.09);

        source.connect(streamFilter);
        streamFilter.connect(streamGain);
        streamGain.connect(masterGain);

        source.connect(cavityFilter);
        cavityFilter.connect(cavityGain);
        cavityGain.connect(masterGain);

        source.connect(fizzFilter);
        fizzFilter.connect(fizzGain);
        fizzGain.connect(masterGain);

        masterGain.connect(ctx.destination);
        source.start(now);

        this.pourNodes = {
            source,
            streamFilter,
            cavityFilter,
            masterGain
        };

        const scheduleBubble = () => {
            if (!this.pourNodes || !this.enabled) return;
            this.triggerBubbleGlug(this.currentLiters);
            const nextMs = 55 + Math.random() * 95;
            this.bubbleTimer = setTimeout(scheduleBubble, nextMs);
        };
        scheduleBubble();
    }

    computeCavityFreq(liters) {
        const ratio = Math.max(0, Math.min(1, liters / 20.0));
        return 165 + Math.pow(ratio, 1.65) * 560;
    }

    updateWaterFlow(liters) {
        this.currentLiters = liters;
        if (!this.pourNodes || !this.ctx) return;

        const now = this.ctx.currentTime;
        const targetFreq = this.computeCavityFreq(liters);
        this.pourNodes.cavityFilter.frequency.setTargetAtTime(targetFreq, now, 0.06);
        this.pourNodes.streamFilter.frequency.setTargetAtTime(
            780 + (liters / 20) * 340,
            now,
            0.08
        );
    }

    triggerBubbleGlug(liters) {
        if (!this.ctx || !this.enabled) return;
        try {
            const now = this.ctx.currentTime;
            const ratio = Math.max(0, Math.min(1, liters / 20.0));
            const basePitch = 260 + ratio * 380 + (Math.random() - 0.5) * 140;
            const dur = 0.045 + Math.random() * 0.04;

            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(basePitch, now);
            osc.frequency.exponentialRampToValueAtTime(basePitch * 1.85, now + dur);

            const gain = this.ctx.createGain();
            const vol = 0.035 + Math.random() * 0.035;
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(vol, now + dur * 0.25);
            gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + dur + 0.01);
        } catch {
            // Ignore transient oscillator errors
        }
    }

    stopWaterFlow() {
        if (this.bubbleTimer) {
            clearTimeout(this.bubbleTimer);
            this.bubbleTimer = null;
        }
        if (!this.pourNodes || !this.ctx) return;

        const { source, masterGain } = this.pourNodes;
        this.pourNodes = null;

        try {
            const now = this.ctx.currentTime;
            masterGain.gain.cancelScheduledValues(now);
            masterGain.gain.setValueAtTime(masterGain.gain.value, now);
            masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
            setTimeout(() => {
                try {
                    source.stop();
                    source.disconnect();
                } catch {
                    // Already stopped
                }
            }, 130);
        } catch {
            // Ignore cleanup errors
        }
    }

    // =========================================================================
    // STAGE 3: TACTILE PLASTIC CAP SNAP, PERFECT SEAL & OVERFLOW SLOSH
    // =========================================================================
    playCapSnap() {
        const ctx = this.ensureContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        const thudOsc = ctx.createOscillator();
        thudOsc.type = 'triangle';
        thudOsc.frequency.setValueAtTime(240, now);
        thudOsc.frequency.exponentialRampToValueAtTime(95, now + 0.085);

        const thudGain = ctx.createGain();
        thudGain.gain.setValueAtTime(0.24, now);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        thudOsc.connect(thudGain);
        thudGain.connect(ctx.destination);
        thudOsc.start(now);
        thudOsc.stop(now + 0.095);

        const snapNoise = ctx.createBufferSource();
        snapNoise.buffer = this.noiseBuffer;

        const snapFilter = ctx.createBiquadFilter();
        snapFilter.type = 'bandpass';
        snapFilter.frequency.setValueAtTime(2100, now);
        snapFilter.Q.setValueAtTime(2.4, now);

        const snapGain = ctx.createGain();
        snapGain.gain.setValueAtTime(0.32, now);
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        snapNoise.connect(snapFilter);
        snapFilter.connect(snapGain);
        snapGain.connect(ctx.destination);
        snapNoise.start(now);
        snapNoise.stop(now + 0.04);
    }

    playPerfectSeal() {
        const ctx = this.ensureContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        [587.33, 880].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            const t0 = now + idx * 0.075;
            osc.frequency.setValueAtTime(freq, t0);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.03, t0 + 0.16);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.001, t0);
            gain.gain.linearRampToValueAtTime(0.11, t0 + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t0);
            osc.stop(t0 + 0.21);
        });
    }

    playOverflowSlosh() {
        const ctx = this.ensureContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        const slosh = ctx.createBufferSource();
        slosh.buffer = this.noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(950, now);
        filter.frequency.exponentialRampToValueAtTime(220, now + 0.34);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

        slosh.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        slosh.start(now);
        slosh.stop(now + 0.38);
    }

    stopAll() {
        this.stopSanitizeSpray();
        this.stopWaterFlow();
    }
}

export const waterSoundEngine = new WaterRefillSoundEngine();