import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Heart, Leaf } from 'lucide-react';
import { useInView } from '../../hooks/useInView';

const Hero = () => {
    const [ref, isInView] = useInView();

    return (
        <motion.div 
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
            transition={{ duration: 0.6 }}
            className="relative pt-6 pb-24 lg:pb-32 overflow-hidden flex-grow"
        >
            <div className="px-6 mt-16 md:mt-24 relative z-20">
                <div className="max-w-3xl">
                    <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-light leading-tight mb-6 text-slate-900">
                        Your Family’s Health in Labrador, Pangasinan,<br/> <span className="font-extrabold text-green-700">Flowing Crystal Clear from Seaside.</span>
                    </h1>

                    <p className="mb-8 text-base md:text-lg text-slate-800 max-w-2xl font-medium leading-relaxed p-5 rounded-xl border shadow-sm bg-white/80">
                        Proudly serving the families of Labrador, Pangasinan. At Seaside, we believe our community deserves world-class hydration without leaving town. We combine state-of-the-art 21-stage reverse osmosis with the warm, local service you know and trust.
                    </p>

                    <ul className="mb-10 space-y-4 text-sm md:text-base font-medium text-slate-800 p-4 rounded-xl border shadow-sm inline-block bg-white/80">
                        <li className="flex items-center"><ShieldCheck className="w-5 h-5 text-green-600 mr-3 shrink-0"/>Advanced 21-stage reverse osmosis filtration system</li>
                        <li className="flex items-center"><Heart className="w-5 h-5 text-green-600 mr-3 shrink-0"/>Carefully remineralized to deliver crisp, healthy hydration for your whole family</li>
                        <li className="flex items-center"><Leaf className="w-5 h-5 text-green-600 mr-3 shrink-0"/>Eco-friendly station—bring your jugs and save the planet</li>
                    </ul>
                </div>
            </div>
        </motion.div>
    );
};

export default Hero;
