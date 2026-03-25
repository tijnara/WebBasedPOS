import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from '../../hooks/useInView';
import ContactForm from './ContactForm';

const Contact = ({ settings }) => {
    const [ref, isInView] = useInView();

    return (
        <motion.section 
            id="contact" 
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
            transition={{ duration: 0.6 }}
            className="bg-transparent relative z-20 responsive-page"
            aria-labelledby="contact-heading"
        >
            <div className="px-6 py-20 pb-32 max-w-4xl mx-auto text-center">
                <div className="mb-12">
                    <span className="inline-block py-2 px-6 rounded-full bg-teal-50 mb-4">
                        <h2 className="text-[4rem] sm:text-[5.5rem] lg:text-[7rem] font-bold text-[#0f172a] mb-8 tracking-tight leading-none">
                            <span style={{
                                background: 'linear-gradient(to right, #8DB600, #0d9488)', // Apple green to teal
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                color: 'transparent'
                            }}>CONTACT US</span></h2>
                    </span>
                    <p className="text-3xl md:text-4xl font-extrabold text-slate-800 drop-shadow-sm">
                        We'd love to hear from you
                    </p>
                </div>

                <div className="p-8 md:p-12 rounded-[2rem] bg-white/60 backdrop-blur-md shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] text-left">
                    <div className="mb-6 text-center">
                        <p className="text-lg font-semibold text-gray-800">Business Hours:</p>
                        <p className="text-gray-700">Monday - Saturday: 8:00 AM - 5:00 PM</p>
                        <p className="mt-4 text-lg font-semibold text-gray-800">Our Address:</p>
                        <p className="text-gray-700">Laois, Labrador, Pangasinan</p>
                    </div>
                    <ContactForm settings={settings} />
                </div>
            </div>
        </motion.section>
    );
};

export default Contact;
