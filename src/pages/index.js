// src/pages/index.js
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';
import { useSettings } from '../hooks/useSettings';
import { login, register as registerAccount } from '../lib/api';

import LandingBackground from '../components/landing/LandingBackground';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingHero from '../components/landing/LandingHero';
import LandingAuthCard from '../components/landing/LandingAuthCard';
import LandingGlobalStyles from '../components/landing/LandingGlobalStyles';
import LoginCharacterEntrance from '../components/transitions/LoginCharacterEntrance';
import ForgotPasswordModal from '../components/landing/ForgotPasswordModal';

function checkWebGLSupport() {
    if (typeof window === 'undefined') return false;
    try {
        const canvas = document.createElement('canvas');
        const gl =
            canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
            canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
            canvas.getContext('experimental-webgl');
        if (!gl) return false;
        const loseExt = gl.getExtension('WEBGL_lose_context');
        if (loseExt) loseExt.loseContext();
        return true;
    } catch {
        return false;
    }
}

class BackgroundErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error) {
        console.warn('Landing 3D background disabled (WebGL unavailable):', error?.message || error);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || null;
        }
        return this.props.children;
    }
}

function StaticLandingFallback() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#8DB600]/20 dark:bg-[#8DB600]/15 blur-3xl" />
            <div className="absolute top-1/3 -right-24 w-[28rem] h-[28rem] rounded-full bg-sky-400/20 dark:bg-sky-500/15 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 w-96 h-96 rounded-full bg-emerald-400/20 dark:bg-emerald-500/10 blur-3xl" />
        </div>
    );
}

export default function SeasideNewLanding() {
    const router = useRouter();

    const { data: settings } = useSettings() || {};
    const businessHours =
        settings?.business_hours ||
        'Monday - Saturday: 8:00 AM - 5:00 PM for Delivery\nMonday, Wednesday, Friday and Saturday: 8:00 AM - 5:00 PM';
    const physicalAddress = settings?.physical_address || 'Laois, Labrador, Pangasinan';
    const facebookLink = settings?.facebook_link || 'https://www.facebook.com/61587059323111/';

    const setAuth = useStore((state) => state.setAuth);
    const darkMode = useStore((state) => state.darkMode);
    const toggleDarkMode = useStore((state) => state.toggleDarkMode);

    // Active card view: 'login' | 'signup' | 'contact'
    const [activeCard, setActiveCard] = useState('login');
    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotInitialEmail, setForgotInitialEmail] = useState('');
    const [authError, setAuthError] = useState(null);
    const [regError, setRegError] = useState(null);
    const [pendingApprovalInfo, setPendingApprovalInfo] = useState(null);
    const [isDemoLoading, setIsDemoLoading] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [contactPrefill, setContactPrefill] = useState(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [canRenderWebGL, setCanRenderWebGL] = useState(false);

    useEffect(() => {
        setCanRenderWebGL(checkWebGLSupport());
        router.prefetch?.('/about')?.catch(() => {});
    }, [router]);

    const handleDemoLogin = async () => {
        if (isLoggingIn || isDemoLoading) return;
        setIsLoggingIn(true);
        setIsDemoLoading(true);
        setAuthError(null);
        setPendingApprovalInfo(null);

        try {
            setAuth({
                id: 'demo-user',
                name: 'Demo User',
                email: 'demo@gmail.com',
                role: 'Admin',
                isadmin: true,
                isAdmin: true,
                isDemo: true
            });
            await router.push('/pos');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogin = async (data) => {
        if (isLoggingIn) return;
        setIsLoggingIn(true);
        setAuthError(null);
        setPendingApprovalInfo(null);

        try {
            if (data.email === 'demo@gmail.com' && data.password === 'demodemo') {
                await handleDemoLogin();
                return;
            }

            const result = await login({
                email: data.email,
                password: data.password
            });

            if (result?.status === 'PENDING_APPROVAL') {
                setPendingApprovalInfo({
                    identifier: data.email.trim(),
                    title: 'Account Awaiting Admin Approval',
                    message:
                        result.message ||
                        'Your account is pending administrator approval before you can access the system.'
                });
                return;
            }

            if (result?.status === 'INVALID_CREDENTIALS' || result?.status === 'ERROR') {
                setAuthError(result.message || 'Invalid email or password.');
                return;
            }

            const authenticatedUser = result?.user || (result?.id ? result : null);
            if (authenticatedUser && authenticatedUser.id) {
                setAuth({
                    ...authenticatedUser,
                    isDemo: false
                });
                await router.push('/pos');
            } else {
                setAuthError('Invalid email or password.');
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleSignUp = async (data) => {
        setRegError(null);
        setPendingApprovalInfo(null);

        const cleanEmail = data.email.trim().toLowerCase();
        try {
            await registerAccount({
                name: data.name.trim(),
                email: cleanEmail,
                phone: data.phone.trim(),
                password: data.password,
                isAdmin: false,
                isApproved: false,
                categoryId: 2
            });

            setActiveCard('login');
            setPendingApprovalInfo({
                identifier: cleanEmail,
                title: 'Registration Submitted!',
                message:
                    'Your staff account has been created and is awaiting administrator approval before you can sign in.'
            });
            return true;
        } catch (err) {
            setRegError(err.message || 'Failed to create staff account. Please try again.');
            return false;
        }
    };

    const handleContactToggle = () => {
        if (activeCard === 'contact') {
            setActiveCard('login');
        } else {
            setContactPrefill({ email: '', message: '', focus: 'email', nonce: Date.now() });
            setActiveCard('contact');
        }
    };

    const handleOpenForgotPassword = (typedEmail) => {
        if (typeof typedEmail === 'string' && typedEmail.includes('@')) {
            setForgotInitialEmail(typedEmail.trim());
        }
        setForgotOpen(true);
    };

    const handleRequestApprovalFollowUp = () => {
        const identifier = pendingApprovalInfo?.identifier || '';
        const prefillEmail = identifier.includes('@') ? identifier : '';
        setContactPrefill({
            email: prefillEmail,
            message: `Hello Admin, I recently registered my staff account (${identifier || 'Staff'}) and would like to request access approval for Seaside POS.`,
            focus: prefillEmail ? 'message' : 'email',
            nonce: Date.now()
        });
        setActiveCard('contact');
    };

    const switchCard = (nextCard) => {
        setActiveCard(nextCard);
        setAuthError(null);
        setRegError(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f3fae6] via-[#ecfdf5] to-[#e0f2fe] dark:from-[#060b13] dark:via-[#08101c] dark:to-[#060b13] relative overflow-x-hidden font-sans text-slate-800 dark:text-slate-100 flex flex-col justify-between perspective-wrapper transition-colors duration-300">
            <Head>
                <title>Seaside | Welcome</title>
                <meta name="description" content="Seaside Enterprise Management System" />
            </Head>

            {canRenderWebGL ? (
                <BackgroundErrorBoundary fallback={<StaticLandingFallback />}>
                    <LandingBackground tilt={tilt} />
                </BackgroundErrorBoundary>
            ) : (
                <StaticLandingFallback />
            )}

            <LandingNavbar
                activeCard={activeCard}
                onToggleContact={handleContactToggle}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
            />

            <main className="relative z-10 flex-grow flex items-center justify-center p-4 sm:p-6 mt-2 sm:mt-0">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                    <LandingHero />

                    <LoginCharacterEntrance canRenderWebGL={canRenderWebGL} enabled={true}>
                        <LandingAuthCard
                            activeCard={activeCard}
                            onSwitchCard={switchCard}
                            tilt={tilt}
                            onTiltChange={setTilt}
                            // Login props
                            onLogin={handleLogin}
                            onDemoLogin={handleDemoLogin}
                            isDemoLoading={isDemoLoading}
                            authError={authError}
                            pendingApprovalInfo={pendingApprovalInfo}
                            onDismissPending={() => setPendingApprovalInfo(null)}
                            onNotifyAdmin={handleRequestApprovalFollowUp}
                            onForgotPassword={handleOpenForgotPassword}
                            // Sign Up props
                            onSignUp={handleSignUp}
                            regError={regError}
                            // Contact props
                            businessHours={businessHours}
                            physicalAddress={physicalAddress}
                            facebookLink={facebookLink}
                            contactPrefill={contactPrefill}
                        />
                    </LoginCharacterEntrance>
                </div>
            </main>

            <ForgotPasswordModal
                isOpen={forgotOpen}
                onClose={() => setForgotOpen(false)}
                initialEmail={forgotInitialEmail}
            />

            <footer className="relative z-20 py-4 px-6 text-center text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 border-t border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md transition-colors">
                <p>
                    &copy; {new Date().getFullYear()} Seaside Purified Water Refilling Station. All rights reserved. • By{' '}
                    <span className="font-bold text-green-800 dark:text-[#8DB600]">tijnara</span>
                </p>
            </footer>

            <LandingGlobalStyles />
        </div>
    );
}