import React, { useState, useEffect, memo } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Heart, Leaf } from 'lucide-react';

// --- 1. ATOMIC COMPONENTS (Memoized for Performance) ---

const GlassCard = memo(({ children, className = '' }) => (
  <div className={`bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] rounded-3xl p-8 ${className}`}>
    {children}
  </div>
));
GlassCard.displayName = 'GlassCard';

const FeatureCard = memo(({ icon: Icon, title, description }) => (
  <GlassCard className="flex flex-col items-center group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 border border-white/60 shadow-sm flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110">
      <Icon className="w-8 h-8 text-teal-600" aria-hidden="true" />
    </div>
    <h3 className="text-teal-900 text-sm font-bold uppercase tracking-wider mb-4 text-center">{title}</h3>
    <p className="text-[14px] text-slate-700 leading-relaxed font-medium text-center">{description}</p>
  </GlassCard>
));
FeatureCard.displayName = 'FeatureCard';

// --- 2. MAIN PAGE COMPONENT ---

const SeasideWaterLanding = () => {
  // Advanced SEO Schema
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Seaside Purified Water Refilling Station",
    "image": "https://seasidepos.vercel.app/seasideHD_.png",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Labrador",
      "addressRegion": "Pangasinan",
      "addressCountry": "PH"
    },
    "priceRange": "₱₱",
    "openingHours": "Mo-Sa 08:00-17:00"
  };

  return (
    <div className="relative min-h-screen w-full font-sans text-slate-800 bg-slate-50">
      
      {/* --- ENTERPRISE SEO --- */}
      <Head>
        <title>Seaside Purified Water - Premium 21-Stage Filtration | Labrador, Pangasinan</title>
        <meta name="description" content="Trusted water refilling station in Labrador, Pangasinan. 21-stage reverse osmosis filtration. Eco-friendly, DOH certified." />
        <meta name="keywords" content="water refilling, purified water, Labrador Pangasinan, reverse osmosis" />
        <meta property="og:title" content="Seaside Purified Water - Premium Water Refilling Station" />
        <meta property="og:image" content="https://seasidepos.vercel.app/seasideHD_.png" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }} />
      </Head>

      {/* Background Image */}
      <div className="fixed inset-0 -z-10">
        <Image src="/seaside_bg2.png" alt="Crystal clear water waves" fill className="w-full h-full object-cover opacity-90" priority />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation placeholder */}
        {/* ... */}

        <main className="flex-grow flex flex-col w-full min-w-0 max-w-[1400px] mx-auto px-4">
          
          {/* --- HERO SECTION --- */}
          <motion.section 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.6 }} 
            className="pt-20 pb-24 sm:px-8"
            aria-labelledby="hero-heading"
          >
            <div className="max-w-3xl mx-auto lg:mx-0">
              <motion.h1 
                id="hero-heading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight text-slate-900 mb-6 tracking-tight"
              >
                Your Family’s Health,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
                  Flowing Crystal Clear.
                </span>
              </motion.h1>
              
              <GlassCard className="!p-6 mb-8">
                <p className="text-lg text-slate-700 font-medium leading-relaxed">
                  Proudly serving Labrador, Pangasinan with state-of-the-art 21-stage reverse osmosis filtration. World-class hydration delivered with local trust.
                </p>
              </GlassCard>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="#services" className="px-8 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold text-center hover:shadow-xl hover:scale-105 transition-all duration-300">
                  Explore Services
                </Link>
                <Link href="#contact" className="px-8 py-4 bg-white/80 backdrop-blur-md text-teal-700 border-2 border-teal-600 rounded-xl font-bold text-center hover:bg-teal-50 transition-all duration-300">
                  Contact Us
                </Link>
              </div>
            </div>
          </motion.section>

          {/* --- WHY CHOOSE US --- */}
          <section id="why-choose" className="py-20 sm:px-8 border-t border-teal-100/50 relative">
             <div className="text-center mb-16">
                 <span className="inline-block py-2 px-6 rounded-full bg-teal-50 text-teal-700 font-bold tracking-widest uppercase mb-4 border border-teal-100">Why Choose Us</span>
                 <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800">Purity You Can Taste</h2>
             </div>
             
             {/* Responsive Grid per guidelines */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                 <FeatureCard 
                    icon={ShieldCheck} 
                    title="Zero Doubts" 
                    description="21-stage filtration strips away 99.9% of impurities, heavy metals, and bacteria." 
                  />
                 <FeatureCard 
                    icon={Heart} 
                    title="Health First" 
                    description="Carefully remineralized to ensure a healthy balance of natural minerals for your family." 
                  />
                 <FeatureCard 
                    icon={Leaf} 
                    title="Eco-Friendly" 
                    description="Bring your own containers or purchase reusable jugs to reduce single-use plastic waste." 
                  />
             </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default SeasideWaterLanding;
