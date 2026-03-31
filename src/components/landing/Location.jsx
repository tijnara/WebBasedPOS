import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from '../../hooks/useInView';

const Location = ({ settings }) => {
    const [ref, isInView] = useInView();

    const googleMapsUrl = settings?.location_embed || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.3333333333335!2d120.1322205!3d16.0432862!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3393e1d08454d96f%3A0xfd7e1df20c90037d!2sSEASIDE%20Water%20Refilling%20Station!5e0!3m2!1sen!2sph!4v1630000000000!5m2!1sen!2sph";

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
                <div className="w-full h-[450px] relative z-30">
                    <iframe
                        src={googleMapsUrl}
                        width="100%"
                        height="100%"
                        style={{ border:0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                </div>
            </div>
        </motion.div>
    );
};

export default Location;
