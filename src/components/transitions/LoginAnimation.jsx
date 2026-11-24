import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Environment, ContactShadows } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';

// --- 3D CHARACTER COMPONENT ---
// This requires a 'seaside-boy.glb' file in your public/models/ folder
// containing 3 animation clips named exactly: "Walk", "Idle", and "Push"
function SeasideBoy({ phase }) {
    const group = useRef();
    // Load your 3D model here:
    const { scene, animations } = useGLTF('/models/seaside-boy.glb');
    const { actions } = useAnimations(animations, group);

    useEffect(() => {
        // Stop all previous animations
        Object.values(actions).forEach(action => action?.stop());

        // Play specific animations based on the current phase
        if (phase === 'WALK_IN' || phase === 'WALK_OUT') {
            actions['Walk']?.play();
        } else if (phase === 'THINKING' || phase === 'DONE') {
            actions['Idle']?.play();
        } else if (phase === 'PUSHING') {
            actions['Push']?.play();
        }
    }, [phase, actions]);

    // Move the character across the screen based on the phase
    useFrame((state, delta) => {
        if (!group.current) return;

        const speed = 2.5;
        if (phase === 'WALK_IN') {
            // Walk from left off-screen to center-left
            group.current.position.x = Math.min(group.current.position.x + speed * delta, -1.5);
            group.current.rotation.y = Math.PI / 2; // Facing right
        } else if (phase === 'WALK_OUT') {
            // Walk from center-left to right off-screen
            group.current.position.x += speed * delta;
            group.current.rotation.y = Math.PI / 2;
        } else if (phase === 'PUSHING') {
            // Push from right off-screen to center-left
            group.current.position.x = Math.max(group.current.position.x - speed * delta, -2.5);
            group.current.rotation.y = -Math.PI / 2; // Facing left (pushing the form)
        } else if (phase === 'DONE') {
            // Turn to face the user and wave/idle
            group.current.rotation.y = Math.PI / 8; // Slight angle towards camera
        }
    });

    return <primitive ref={group} object={scene} position={[-6, -2, 0]} scale={1.5} />;
}

// --- MAIN ORCHESTRATOR COMPONENT ---
export default function LoginAnimation({ children, onSkip }) {
    const [phase, setPhase] = useState('WALK_IN');

    useEffect(() => {
        // The Master Timeline matching the video sequence
        const p1 = setTimeout(() => setPhase('THINKING'), 2000); // Walk in and stop
        const p2 = setTimeout(() => setPhase('WALK_OUT'), 4000); // "Wait let me grab it" -> walks off
        const p3 = setTimeout(() => setPhase('PUSHING'), 5500);  // Re-enters pushing the form
        const p4 = setTimeout(() => setPhase('DONE'), 8000);     // Stops pushing, poses

        return () => {
            clearTimeout(p1); clearTimeout(p2); clearTimeout(p3); clearTimeout(p4);
        };
    }, []);

    return (
        <div className="relative w-full h-screen bg-slate-950 overflow-hidden flex items-center justify-center font-sans">

            {/* 3D Canvas Layer */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} intensity={1} />
                    <Environment preset="city" />
                    <Suspense fallback={null}>
                        <SeasideBoy phase={phase} />
                        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} />
                    </Suspense>
                </Canvas>
            </div>

            {/* HTML UI Layer (Speech Bubbles & The Form) */}
            <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">

                {/* Speech Bubble 1 */}
                <AnimatePresence>
                    {phase === 'THINKING' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.9 }}
                            className="absolute ml-[-200px] mt-[-250px] bg-slate-800 text-slate-100 text-sm font-bold px-4 py-3 rounded-2xl shadow-xl border border-slate-700 max-w-[200px] text-center"
                        >
                            Wait a second! Let me grab the login form for you! 📦
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Speech Bubble 2 */}
                <AnimatePresence>
                    {phase === 'DONE' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="absolute ml-[-450px] mt-[-150px] bg-[#8DB600] text-white text-sm font-bold px-4 py-3 rounded-2xl shadow-xl max-w-[200px] text-center"
                        >
                            Here is your form! 🌊
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* The Login Form Wrapper */}
                <motion.div
                    initial={{ x: '100vw', opacity: 0 }}
                    animate={{
                        x: phase === 'PUSHING' || phase === 'DONE' ? 100 : '100vw',
                        opacity: phase === 'PUSHING' || phase === 'DONE' ? 1 : 0
                    }}
                    transition={{
                        duration: phase === 'PUSHING' ? 2.5 : 0.5,
                        ease: "linear"
                    }}
                    className={`relative w-full max-w-sm ${phase === 'DONE' ? 'pointer-events-auto' : ''}`}
                >
                    {children}
                </motion.div>
            </div>

            {/* Skip Button for fast-paced cashiers */}
            <button
                type="button"
                onClick={onSkip}
                className="absolute top-6 right-6 z-50 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
            >
                Skip Animation
            </button>
        </div>
    );
}

// Preload the model so it's ready instantly
useGLTF.preload('/models/seaside-boy.glb');