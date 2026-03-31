import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from '../../hooks/useInView';

const Location = ({ settings }) => {
    const [ref, isInView] = useInView();

    const googleMapsUrl = settings?.location_embed || "https://www.google.com/maps/place/SEASIDE+Water+Refilling+Station/@16.0432862,120.1322205,15z/data=!4m6!3m5!1s0x3393e1d08454d96f:0xfd7e1df20c90037d!8m2!3d16.0432862!4d120.1322205!16s%2Fg%2F11vsm_c4z5?entry=ttu";

    return (
        <motion.div
            id="location"
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
            transition={{ duration: 0.6 }}
            className="bg-transparent relative z-20 responsive-page"
        >
            <div className="px-6 py-20 pb-32 max-w-6xl mx-auto text-center">
                <div className="mb-16">
                    <h2 className="text-[4rem] sm:text-[5.5rem] lg:text-[7rem] font-bold text-[#0f172a] mb-8 tracking-tight leading-none">
                            <span style={{
                                background: 'linear-gradient(to right, #8DB600, #0d9488)', // Apple green to teal
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                color: 'transparent'
                            }}>LOCATION</span>
                    </h2>
                    <p className="text-xl lg:text-[22px] text-gray-500 max-w-3xl mx-auto font-light leading-relaxed">Navigate to Purity in Labrador, Pangasinan – See Us on the Map!</p>
                </div>
                <div className="w-full relative z-30">
                    <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105"
                    >
                        View on Google Maps
                    </a>
                </div>
            </div>
        </motion.div>
    );
};

export default Location;
