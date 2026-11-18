// src/components/landing/LandingAuthCard.jsx
import React, { useRef, useState } from 'react';
import LoginFormView from './LoginFormView';
import SignUpFormView from './SignUpFormView';
import ContactFormView from './ContactFormView';
import AnimatedLandingIcon from './AnimatedLandingIcon';

export default function LandingAuthCard({
                                            activeCard,
                                            onSwitchCard,
                                            tilt,
                                            onTiltChange,
                                            onLogin,
                                            onDemoLogin,
                                            isDemoLoading,
                                            authError,
                                            pendingApprovalInfo,
                                            onDismissPending,
                                            onNotifyAdmin,
                                            onForgotPassword,
                                            onSignUp,
                                            regError,
                                            businessHours,
                                            physicalAddress,
                                            facebookLink,
                                            contactPrefill
                                        }) {
    const cardRef = useRef(null);
    const [tabTick, setTabTick] = useState(0);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -9;
        const rotateY = ((x - centerX) / centerX) * 9;

        onTiltChange({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        onTiltChange({ x: 0, y: 0 });
    };

    return (
        <div
            className="relative perspective-[1200px] w-full flex justify-center items-center h-full min-h-[560px]"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div
                ref={cardRef}
                className="w-full max-w-[450px] transform-gpu transition-transform duration-200 ease-out"
                style={{
                    transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                    transformStyle: 'preserve-3d'
                }}
            >
                <div className="bg-white/75 dark:bg-slate-900/65 backdrop-blur-2xl text-slate-800 dark:text-slate-100 rounded-[2.25rem] p-6 sm:p-8 md:p-9 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.14),0_0_40px_rgba(141,182,0,0.16)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(141,182,0,0.12)] border border-white/90 dark:border-white/15 relative overflow-hidden transition-colors duration-300">
                    {/* Top Lime Accent Rim */}
                    <div
                        className="absolute top-0 inset-x-10 h-[2px] rounded-full opacity-85"
                        style={{
                            background:
                                'linear-gradient(90deg, transparent, #8DB600, #06b6d4, transparent)'
                        }}
                    />

                    {/* Dynamic Mouse-Follow Glare Layer */}
                    <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                        style={{
                            background: `radial-gradient(circle at ${50 + tilt.y * 2.5}% ${50 - tilt.x * 2.5}%, rgba(141,182,0,0.14) 0%, rgba(255,255,255,0.12) 35%, transparent 65%)`
                        }}
                    />

                    <div className="relative z-10 w-full translate-z-[30px] transform-gpu">
                        {/* Segmented Tab Switch */}
                        {activeCard !== 'contact' && (
                            <div className="flex bg-slate-200/70 dark:bg-slate-950/70 p-1.5 rounded-2xl mb-6 border border-slate-300/60 dark:border-white/10 select-none shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTabTick((t) => t + 1);
                                        onSwitchCard('login');
                                    }}
                                    className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                                        activeCard === 'login'
                                            ? 'bg-white dark:bg-gradient-to-r dark:from-[#8DB600]/30 dark:to-teal-500/25 border border-lime-500/40 dark:border-[#8DB600]/50 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    <AnimatedLandingIcon
                                        name="lock"
                                        size={16}
                                        strokeColor="currentColor"
                                        triggerKey={activeCard === 'login' ? tabTick : 0}
                                    />
                                    <span>Sign In</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTabTick((t) => t + 1);
                                        onSwitchCard('signup');
                                    }}
                                    className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                                        activeCard === 'signup'
                                            ? 'bg-white dark:bg-gradient-to-r dark:from-[#8DB600]/30 dark:to-teal-500/25 border border-lime-500/40 dark:border-[#8DB600]/50 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    <AnimatedLandingIcon
                                        name="userPlus"
                                        size={16}
                                        strokeColor="currentColor"
                                        triggerKey={activeCard === 'signup' ? tabTick : 0}
                                    />
                                    <span>Staff Sign Up</span>
                                </button>
                            </div>
                        )}

                        {activeCard === 'login' && (
                            <LoginFormView
                                onLogin={onLogin}
                                onDemoLogin={onDemoLogin}
                                isDemoLoading={isDemoLoading}
                                authError={authError}
                                pendingApprovalInfo={pendingApprovalInfo}
                                onDismissPending={onDismissPending}
                                onNotifyAdmin={onNotifyAdmin}
                                onForgotPassword={onForgotPassword}
                                onSwitchToSignUp={() => onSwitchCard('signup')}
                            />
                        )}

                        {activeCard === 'signup' && (
                            <SignUpFormView
                                onSignUp={onSignUp}
                                regError={regError}
                                onSwitchToLogin={() => onSwitchCard('login')}
                            />
                        )}

                        {activeCard === 'contact' && (
                            <ContactFormView
                                businessHours={businessHours}
                                physicalAddress={physicalAddress}
                                facebookLink={facebookLink}
                                prefillData={contactPrefill}
                                onBackToLogin={() => onSwitchCard('login')}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}