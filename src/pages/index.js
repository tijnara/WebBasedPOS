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
import VoltAuthCard from '../components/landing/VoltAuthCard';
import LandingGlobalStyles from '../components/landing/LandingGlobalStyles';
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
    const [tilt] = useState({ x: 0, y: 0 });
    const [canRenderWebGL, setCanRenderWebGL] = useState(false);

    useEffect(() => {
        setCanRenderWebGL(checkWebGLSupport());
        router.prefetch?.('/about')?.catch(() => {});
        router.prefetch?.('/pos')?.catch(() => {});
    }, [router]);

    const completeLoginAndNavigate = async (userPayload) => {
        if (typeof window !== 'undefined') {
            window.__SEASIDE_CINEMATIC_ACTIVE__ = false;
            window.dispatchEvent(new Event('seaside-cinematic-done'));
            try {
                localStorage.setItem('seaside_last_active_at', String(Date.now()));
                sessionStorage.setItem('pos_tab_initialized', 'true');
            } catch {
                // Ignore storage errors
            }
        }

        useStore.setState({ sessionLoaded: true });
        setAuth(userPayload);

        const navigated = await router.replace('/pos');
        if (!navigated && typeof window !== 'undefined') {
            window.location.assign('/pos');
        }
    };

    const handleDemoLogin = async () => {
        if (isLoggingIn || isDemoLoading) return;
        setIsLoggingIn(true);
        setIsDemoLoading(true);
        setAuthError(null);
        setPendingApprovalInfo(null);

        try {
            await completeLoginAndNavigate({
                id: 'demo-user',
                name: 'Demo User',
                email: 'demo@gmail.com',
                role: 'Admin',
                isadmin: true,
                isAdmin: true,
                isDemo: true
            });
        } catch {
            setIsDemoLoading(false);
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
                setIsDemoLoading(true);
                await completeLoginAndNavigate({
                    id: 'demo-user',
                    name: 'Demo User',
                    email: 'demo@gmail.com',
                    role: 'Admin',
                    isadmin: true,
                    isAdmin: true,
                    isDemo: true
                });
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
                setIsLoggingIn(false);
                return;
            }

            if (result?.status === 'INVALID_CREDENTIALS' || result?.status === 'ERROR') {
                setAuthError(result.message || 'Invalid email or password.');
                setIsLoggingIn(false);
                return;
            }

            const authenticatedUser = result?.user || (result?.id ? result : null);
            if (authenticatedUser && authenticatedUser.id) {
                await completeLoginAndNavigate({
                    ...authenticatedUser,
                    isDemo: false
                });
            } else {
                setAuthError('Invalid email or password.');
                setIsLoggingIn(false);
            }
        } catch (err) {
            setAuthError(err?.message || 'Unable to sign in right now. Please try again.');
            setIsDemoLoading(false);
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
        <div className="seaside-landing-shell min-h-[100dvh] bg-[#070d18] bg-gradient-to-br from-[#f3fae6] via-[#ecfdf5] to-[#e0f2fe] dark:from-[#060b13] dark:via-[#08101c] dark:to-[#060b13] relative overflow-x-hidden font-sans text-slate-800 dark:text-slate-100 flex flex-col justify-between perspective-wrapper transition-colors duration-300">
            <Head>
                <title>Seaside | Welcome</title>
                <meta name="description" content="Seaside Enterprise Management System" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <style jsx global>{`
                @media (max-width: 1023px) and (max-height: 780px) {
                    .seaside-volt-mobile-fit {
                        transform: scale(0.9);
                        transform-origin: center center;
                    }
                }
                @media (max-width: 1023px) and (max-height: 680px) {
                    .seaside-volt-mobile-fit {
                        transform: scale(0.8);
                        transform-origin: center center;
                    }
                }
            `}</style>

            {canRenderWebGL ? (
                <BackgroundErrorBoundary fallback={<StaticLandingFallback />}>
                    <LandingBackground tilt={tilt} />
                </BackgroundErrorBoundary>
            ) : (
                <StaticLandingFallback />
            )}

            <div className="shrink-0 relative z-30">
                <LandingNavbar
                    activeCard={activeCard}
                    onToggleContact={handleContactToggle}
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                />
            </div>

            <main className="relative z-20 flex-1 flex items-center justify-center px-3 py-2 sm:px-6 lg:px-12">
                <div className="seaside-landing-grid max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-12 items-center">
                    <div className="hidden lg:block">
                        <LandingHero />
                    </div>

                    <div className="seaside-volt-mobile-fit w-full flex justify-center lg:justify-end">
                        <VoltAuthCard
                            activeCard={activeCard}
                            onSwitchCard={switchCard}
                            onLogin={handleLogin}
                            onDemoLogin={handleDemoLogin}
                            isDemoLoading={isDemoLoading}
                            isLoggingIn={isLoggingIn}
                            authError={authError}
                            pendingApprovalInfo={pendingApprovalInfo}
                            onDismissPending={() => setPendingApprovalInfo(null)}
                            onNotifyAdmin={handleRequestApprovalFollowUp}
                            onForgotPassword={handleOpenForgotPassword}
                            onSignUp={handleSignUp}
                            regError={regError}
                            businessHours={businessHours}
                            physicalAddress={physicalAddress}
                            facebookLink={facebookLink}
                            contactPrefill={contactPrefill}
                        />
                    </div>
                </div>
            </main>

            <footer
                data-purpose="site-footer"
                className="shrink-0 relative z-30 w-full border-t border-white/10 bg-[#060b13]/90 backdrop-blur-xl py-3 px-6 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.5)]"
            >
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center text-center text-xs text-slate-300 tracking-wide font-medium">
                    <p className="leading-relaxed">
                        &copy; {new Date().getFullYear()} Seaside Purified Water Refilling Station. All rights reserved. &bull; By{' '}
                        <span className="font-extrabold text-[#8DB600] text-lime-400 drop-shadow-[0_0_8px_rgba(141,182,0,0.5)]">
                            tijnara
                        </span>
                    </p>
                </div>
            </footer>

            <ForgotPasswordModal
                isOpen={forgotOpen}
                onClose={() => setForgotOpen(false)}
                initialEmail={forgotInitialEmail}
            />

            <LandingGlobalStyles />
        </div>
    );
}