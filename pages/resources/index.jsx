import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../src/lib/supabaseClient';
import { motion } from 'framer-motion';

// --- High-Fidelity Reality 3D Icon Components ---

const IconWrapper = ({ children, index }) => (
    <div className="relative flex items-center justify-center">
        {/* Dynamic 3D Floor Shadow */}
        <motion.div
            className="absolute -bottom-2 w-12 h-2 bg-black/10 rounded-[100%] blur-md"
            animate={{
                scale: [1, 0.7, 1],
                opacity: [0.3, 0.1, 0.3]
            }}
            transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.15
            }}
        />

        {/* Floating 3D Glass/Clay Orb */}
        <motion.div
            className="w-20 h-20 rounded-full bg-white relative z-10 flex items-center justify-center"
            style={{
                background: 'rgba(255, 255, 255, 0.8)',
                boxShadow: `
          inset 0 -8px 10px rgba(0,0,0,0.1), 
          inset 0 8px 15px rgba(255,255,255,1),
          0 10px 30px rgba(20, 184, 166, 0.2)
        `,
            }}
            animate={{ y: [0, -15, 0] }}
            transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.15
            }}
            whileHover={{ scale: 1.1, rotateZ: 5 }}
        >
            <div className="transform scale-110 drop-shadow-[0_5px_5px_rgba(0,0,0,0.2)]">
                {children}
            </div>
        </motion.div>
    </div>
);

// Realistic 3D SVG Assets
const DropletsIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <path d="M24 4C24 4 10 20 10 32C10 39.7 16.3 46 24 46C31.7 46 38 39.7 38 32C38 20 24 4 24 4Z" fill={`url(#${gradId})`} />
        <path opacity="0.4" d="M20 28C16 32 16 38 24 38" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

const ShieldIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <path d="M24 4L8 10V22C8 33 24 44 24 44C24 44 40 33 40 22V10L24 4Z" fill={`url(#${gradId})`} />
        <path d="M18 24L22 28L30 20" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SunIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="10" fill={`url(#${gradId})`} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
            <rect key={deg} x="22" y="4" width="4" height="8" rx="2" fill={`url(#${gradId})`} transform={`rotate(${deg} 24 24)`} />
        ))}
    </svg>
);

const IceIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <rect x="10" y="10" width="20" height="20" rx="4" fill={`url(#${gradId})`} transform="rotate(-10 24 24)" />
        <rect x="18" y="18" width="20" height="20" rx="4" fill={`url(#${gradId})`} opacity="0.7" transform="rotate(15 24 24)" />
    </svg>
);

const TruckIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <path d="M42 24H34V14H10V34H42V24Z" fill={`url(#${gradId})`} />
        <circle cx="16" cy="34" r="4" fill="#333" />
        <circle cx="36" cy="34" r="4" fill="#333" />
    </svg>
);

const MicroscopeIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <path d="M32 38H16M24 38V30M24 10L30 24L24 28L18 14L24 10Z" stroke={`url(#${gradId})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="10" r="4" fill={`url(#${gradId})`} />
    </svg>
);

const HeartPulseIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <path d="M24 44C24 44 6 32 6 20C6 13 12 8 18 8C21 8 23 10 24 12C25 10 27 8 30 8C36 8 42 13 42 20C42 32 24 44 24 44Z" fill={`url(#${gradId})`} />
        <path d="M14 22H18L21 16L27 28L30 22H34" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const AlertIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <path d="M24 6L4 40H44L24 6Z" fill={`url(#${gradId})`} />
        <rect x="22" y="20" width="4" height="10" rx="2" fill="white" />
        <circle cx="24" cy="34" r="2" fill="white" />
    </svg>
);

const BookIcon = ({ gradId }) => (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
        <path d="M10 12C10 12 16 8 24 12C32 8 38 12 38 12V40C38 40 32 36 24 40C16 36 10 40 10 40V12Z" fill={`url(#${gradId})`} />
        <line x1="24" y1="12" x2="24" y2="40" stroke="white" strokeWidth="2" />
    </svg>
);

const IconMap = {
    Droplets: DropletsIcon,
    Shield: ShieldIcon,
    Sun: SunIcon,
    Snowflake: IceIcon,
    Truck: TruckIcon,
    Microscope: MicroscopeIcon,
    HeartPulse: HeartPulseIcon,
    AlertTriangle: AlertIcon,
    BookOpen: BookIcon
};

export default function ResourcesPage({ articles }) {
    return (
        <>
            <style>{`
        .responsive-bg {
          background-image: url('/resourceswallpapermob.png');
        }
        @media (min-width: 768px) {
          .responsive-bg {
            background-image: url('/resourceswallpaper.png');
          }
        }
      `}</style>

            <div className="min-h-screen font-sans responsive-page bg-cover bg-center bg-no-repeat bg-fixed responsive-bg">
                {/* WHOLE PAGE WRAPPER: Aligned to LEFT with 75% Transparent White Background */}
                <div
                    className="min-h-screen w-full flex flex-col items-start py-16 px-6 md:px-20 backdrop-blur-[2px]"
                    style={{ backgroundColor: '#FFFFFF40' }}
                >
                    <Head>
                        <title>Knowledge Hub | Seaside Purified Water</title>
                    </Head>

                    {/* Title Section (Leftmost) */}
                    <div className="w-full lg:w-2/3 xl:w-1/2 mb-10">
                        <Link href="/" className="inline-flex items-center text-teal-900 hover:text-teal-700 font-extrabold mb-10 transition-colors uppercase tracking-[0.2em] text-xs">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Link>

                        <h1 className="text-[4rem] sm:text-[5rem] lg:text-[6.5rem] font-black text-[#0f172a] mb-2 tracking-tighter leading-[0.85] drop-shadow-xl">
                    <span style={{
                        background: 'linear-gradient(to right, #8DB600, #0d9488)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>SEASIDE</span> <br />Knowledge Hub
                        </h1>
                    </div>

                    {/* LATEST RELEASE: Under the title */}
                    {articles.length > 0 && (
                        <div className="w-full lg:w-3/5 xl:w-1/2 mb-20 flex flex-col items-start pt-10 border-t-4 border-slate-900/10">
                            <span className="text-teal-900 font-black text-sm tracking-[0.3em] uppercase mb-4 opacity-60">Latest Release</span>
                            <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 leading-[0.9] tracking-tighter max-w-lg">
                                {articles[0].title}
                            </h3>
                            <Link href={`/resources/${articles[0].slug}`} className="inline-flex items-center justify-center px-10 py-5 bg-slate-900 hover:bg-teal-700 text-white rounded-full font-black text-sm uppercase tracking-widest transition-all shadow-2xl hover:scale-105 active:scale-95">
                                Read Now
                            </Link>
                        </div>
                    )}

                    {/* ARTICLE LIST: Aligned Left */}
                    <div className="w-full lg:w-3/5 xl:w-1/2 flex flex-col gap-16">
                        {articles.map((article, index) => {
                            const Icon = IconMap[article.icon_name] || BookIcon;
                            const gradId = `resource-grad-${index}`;

                            return (
                                <Link
                                    key={article.id}
                                    href={`/resources/${article.slug}`}
                                    className="group flex items-start gap-10 transition-all duration-300"
                                >
                                    <svg width="0" height="0" className="absolute">
                                        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor={index % 2 === 0 ? '#8DB600' : '#0d9488'} />
                                            <stop offset="100%" stopColor={index % 2 === 0 ? '#0d9488' : '#8DB600'} />
                                        </linearGradient>
                                    </svg>

                                    <IconWrapper index={index}>
                                        <Icon gradId={gradId} />
                                    </IconWrapper>

                                    <div className="flex-1 pt-2">
                                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 group-hover:text-teal-700 transition-colors leading-tight">
                                            {article.title}
                                        </h2>
                                        <p className="text-base md:text-lg text-slate-700 leading-relaxed font-semibold opacity-80">
                                            {article.description}
                                        </p>
                                        <span className="inline-flex items-center mt-5 text-teal-700 font-black text-xs uppercase tracking-widest group-hover:gap-3 transition-all">
                            Read Article <span className="ml-2">→</span>
                          </span>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

export async function getServerSideProps() {
    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, slug, description, icon_name')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    return {
        props: {
            articles: articles || [],
        },
    };
}