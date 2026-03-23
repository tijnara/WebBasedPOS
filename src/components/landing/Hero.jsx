import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Heart, Leaf } from 'lucide-react';
import { useInView } from '../../hooks/useInView';

const Hero = () => {
    const [ref, isInView] = useInView();

    return (
        <motion.section 
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
            transition={{ duration: 0.6 }}
            className="relative pt-6 pb-24 lg:pb-32 overflow-hidden flex-grow"
            aria-labelledby="hero-heading"
        >
            <div className="px-6 mt-16 md:mt-24 relative z-20">
                <div className="max-w-3xl">
                    <h1 id="hero-heading" className="text-4xl md:text-5xl lg:text-[3.25rem] font-light leading-tight mb-6 text-slate-900">
                        Your Family’s Health in Labrador, Pangasinan,<br/> 
                        <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
                            Flowing Crystal Clear from Seaside.
                        </span>
                    </h1>

                    {/* Applied Glass Morphism Pattern */}
                    <p className="mb-8 text-base md:text-lg text-slate-800 max-w-2xl font-medium leading-relaxed p-6 rounded-3xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] bg-white/60 backdrop-blur-md">
                        Proudly serving the families of Labrador, Pangasinan. At Seaside, we believe our community deserves world-class hydration without leaving town. We combine state-of-the-art 21-stage reverse osmosis with the warm, local service you know and trust.
                    </p>

                    {/* Applied Glass Morphism Pattern & Teal accents */}
                    <ul className="mb-10 space-y-4 text-sm md:text-base font-medium text-slate-800 p-6 rounded-3xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] inline-block bg-white/60 backdrop-blur-md">
                        <li className="flex items-center">
                            <ShieldCheck className="w-5 h-5 text-teal-600 mr-3 shrink-0" aria-hidden="true"/>
                            Advanced 21-stage reverse osmosis filtration system
                        </li>
                        <li className="flex items-center">
                            <Heart className="w-5 h-5 text-teal-600 mr-3 shrink-0" aria-hidden="true"/>
                            Carefully remineralized to deliver crisp, healthy hydration for your whole family
                        </li>
                        <li className="flex items-center">
                            <Leaf className="w-5 h-5 text-teal-600 mr-3 shrink-0" aria-hidden="true"/>
                            Eco-friendly station—bring your jugs and save the planet
                        </li>
                    </ul>
                </div>
            </div>
        </motion.section>
    );
};

export default Hero;
