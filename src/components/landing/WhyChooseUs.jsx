import React from 'react';
import { motion } from 'framer-motion';
import { Droplet, Heart, Leaf } from 'lucide-react';
import { AdsterraBanner } from './AdBanners';
import { useInView } from '../../hooks/useInView';

const WhyChooseUs = () => {
    const [ref, isInView] = useInView();

    return (
        <motion.div 
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
            transition={{ duration: 0.6 }}
            className="bg-transparent relative z-20 border-t"
        >
            <div className="px-6 py-20 pb-32 max-w-6xl mx-auto text-center">
                <div className="mb-12">
                    <AdsterraBanner />
                </div>
                <div className="mb-16">
                    <span className="inline-block py-2 px-6 rounded-full bg-lime-100 mb-4 border">
                        <h2 className="text-green-700 text-2xl md:text-3xl font-bold tracking-widest uppercase m-0">
                            Why Choose Seaside?
                        </h2>
                    </span>
                    <p className="text-2xl md:text-3xl font-medium text-slate-800 drop-shadow-sm">Purity you can taste, quality you can trust in Labrador, Pangasinan.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
                    <div className="flex flex-col items-center group p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300 bg-white/50">
                        <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6 transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-lime-50"><Droplet className="w-8 h-8 text-green-600" /></div>
                        <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4 text-center">Zero Doubts, Just Pure Water</h3>
                        <p className="text-[14px] text-slate-700 leading-relaxed font-medium text-center">We don't cut corners. Our advanced 21-stage filtration system strips away 99.9% of impurities, heavy metals, and bacteria, leaving you with water that is as safe as it is refreshing.</p>
                    </div>
                    <div className="flex flex-col items-center group p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300 bg-white/50">
                        <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6 transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-lime-50"><Heart className="w-8 h-8 text-green-600" /></div>
                        <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4 text-center">Gentle on Tummies, Great for Health</h3>
                        <p className="text-[14px] text-slate-700 leading-relaxed font-medium text-center">From mixing your baby’s formula to brewing your morning coffee, our water is crafted for family life. We ensure a healthy balance of natural minerals, making every glass safe, nourishing, and deeply refreshing.</p>
                    </div>
                    <div className="flex flex-col items-center group p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300 bg-white/50">
                        <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6 transition-transform duration-300 group-hover:-translate-y-2 group-hover:bg-lime-50"><Leaf className="w-8 h-8 text-green-600" /></div>
                        <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4 text-center">Eco-Friendly</h3>
                        <p className="text-[14px] text-slate-700 leading-relaxed font-medium text-center">Bring your own containers or purchase reusable jugs. Every refill helps reduce single-use plastic pollution.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default WhyChooseUs;
