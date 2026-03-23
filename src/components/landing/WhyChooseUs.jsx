import React from 'react';
import { motion } from 'framer-motion';
import { Droplet, Heart, Leaf } from 'lucide-react';
import { AdsterraBanner } from './AdBanners';
import { useInView } from '../../hooks/useInView';

// Note: In a true production app, FeatureCard should be imported from a shared /ui folder.
// For now, I've replicated the required Glass Morphism spec here so the file is standalone.
const FeatureCard = React.memo(({ icon: Icon, title, description }) => (
  <div className="bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] rounded-3xl p-8 flex flex-col items-center group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 border border-white/60 shadow-sm flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110">
      <Icon className="w-8 h-8 text-teal-600" aria-hidden="true" />
    </div>
    <h3 className="text-teal-900 text-sm font-bold uppercase tracking-wider mb-4 text-center">{title}</h3>
    <p className="text-[14px] text-slate-700 leading-relaxed font-medium text-center">{description}</p>
  </div>
));
FeatureCard.displayName = 'FeatureCard';

const WhyChooseUs = () => {
    const [ref, isInView] = useInView();

    return (
        <motion.section 
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
            transition={{ duration: 0.6 }}
            className="bg-transparent relative z-20 border-t border-teal-100/50"
            aria-labelledby="why-choose-heading"
        >
            <div className="px-6 py-20 pb-32 max-w-6xl mx-auto text-center">
                <div className="mb-12">
                    <AdsterraBanner />
                </div>
                <div className="mb-16">
                    <span className="inline-block py-2 px-6 rounded-full bg-teal-50 border border-teal-100 mb-4">
                        <h2 id="why-choose-heading" className="text-teal-700 text-sm md:text-base font-bold tracking-widest uppercase m-0">
                            Why Choose Seaside?
                        </h2>
                    </span>
                    <p className="text-3xl md:text-4xl font-extrabold text-slate-800 drop-shadow-sm">
                        Purity you can taste, quality you can trust.
                    </p>
                </div>
                
                {/* Responsive Grid matching guidelines */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                    <FeatureCard 
                        icon={Droplet}
                        title="Zero Doubts, Just Pure Water"
                        description="We don't cut corners. Our advanced 21-stage filtration system strips away 99.9% of impurities, heavy metals, and bacteria, leaving you with water that is as safe as it is refreshing."
                    />
                    <FeatureCard 
                        icon={Heart}
                        title="Gentle on Tummies, Great for Health"
                        description="From mixing your baby’s formula to brewing your morning coffee, our water is crafted for family life. We ensure a healthy balance of natural minerals."
                    />
                    <FeatureCard 
                        icon={Leaf}
                        title="Eco-Friendly"
                        description="Bring your own containers or purchase reusable jugs. Every refill helps reduce single-use plastic pollution in Labrador."
                    />
                </div>
            </div>
        </motion.section>
    );
};

export default WhyChooseUs;
