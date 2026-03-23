import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Truck, GlassWater, Snowflake } from 'lucide-react';
import { useInView } from '../../hooks/useInView';

const Services = () => {
    const [ref, isInView] = useInView();

    return (
        <motion.div 
            id="services" 
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
            transition={{ duration: 0.6 }}
            className="bg-transparent relative z-20 border-t"
        >
            <div className="px-6 py-20 pb-32 max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <span className="inline-block py-2 px-6 rounded-full bg-lime-100 mb-4 border">
                        <h2 className="text-green-700 text-2xl md:text-3xl font-bold tracking-widest uppercase m-0">
                            Our Services
                        </h2>
                    </span>
                    <p className="text-2xl md:text-3xl font-medium text-slate-800 drop-shadow-sm">Convenience and Quality, Delivered in Labrador, Pangasinan.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center text-center p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300 bg-white/80">
                        <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6"><Leaf className="w-8 h-8 text-green-600" /></div>
                        <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Walk-In Refills</h3>
                        <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Experience fast, friendly, and clean service right at our station in Labrador, Pangasinan. Bring your own jugs to help reduce plastic waste, and watch our team sanitize and refill them with crystal clear water while you wait.</p>
                    </div>

                    <div className="flex flex-col items-center text-center p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300 bg-white/80">
                        <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6"><Truck className="w-8 h-8 text-green-600" /></div>
                        <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Door-to-Door Delivery</h3>
                        <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Stay hydrated without leaving your home. We offer prompt and reliable delivery services across Labrador, Pangasinan and neighboring municipalities. Just send us a message, and we'll do the heavy lifting for you.</p>
                    </div>

                    <div className="flex flex-col items-center text-center p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300 bg-white/80">
                        <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6"><GlassWater className="w-8 h-8 text-green-600" /></div>
                        <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Ready-to-Drink PET Bottles</h3>
                        <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Always on the go? Grab our freshly sealed, purified water in convenient PET bottles. Perfect for road trips, family parties, corporate events, or simply stocking up your fridge.</p>
                    </div>

                    <div className="flex flex-col items-center text-center p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300 bg-white/80">
                        <div className="w-20 h-20 rounded-2xl bg-slate-50 border shadow-sm flex items-center justify-center mb-6"><Snowflake className="w-8 h-8 text-green-600" /></div>
                        <h3 className="text-green-950 text-sm font-bold uppercase tracking-wider mb-4">Purified Ice Tubes & Cubes</h3>
                        <p className="text-[14px] text-slate-700 leading-relaxed font-medium">Keep your drinks perfectly chilled without compromising on safety. Made from our signature 21-stage filtered water, our ice is crystal clear, food-grade safe, and slow-melting—perfect for parties, businesses, and everyday use.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Services;
