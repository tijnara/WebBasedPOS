import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from '../../hooks/useInView';

const Location = ({ settings }) => {
    const [ref, isInView] = useInView();

    return (
        <motion.div 
            id="location" 
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
            transition={{ duration: 0.6 }}
            className="bg-transparent relative z-20 border-t"
        >
            <div className="px-6 py-20 pb-32 max-w-6xl mx-auto text-center">
                <div className="mb-16">
                    <span className="inline-block py-2 px-6 rounded-full bg-lime-100 mb-4 border">
                        <h2 className="text-green-700 text-2xl md:text-3xl font-black tracking-widest uppercase m-0">Location</h2>
                    </span>
                    <p className="text-2xl md:text-3xl font-bold text-slate-800 drop-shadow-sm mt-4">Navigate to Purity in Labrador, Pangasinan – See Us on the Map!</p>
                </div>
                <div className="w-full relative z-30">
                    <iframe title="Seaside Water Refilling Station Location Map" src={settings?.location_embed || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.427589470715!2d120.1322205!3d16.043286199999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3393e1d08454d96f%3A0xfd7e1df20c90037d!2sSEASIDE%20Water%20Refilling%20Station!5e0!3m2!1sen!2sph!4v1771921863348!5m2!1sen!2sph"} width="100%" height="450" className="border-0 rounded-lg shadow-md" allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                </div>
            </div>
        </motion.div>
    );
};

export default Location;
