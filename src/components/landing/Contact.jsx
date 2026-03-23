import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from '../../hooks/useInView';
import ContactForm from './ContactForm';

const Contact = ({ settings }) => {
    const [ref, isInView] = useInView();

    return (
        <motion.div 
            id="contact" 
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
            transition={{ duration: 0.6 }}
            className="bg-transparent relative z-20 border-t"
        >
            <div className="px-6 py-20 pb-32 max-w-4xl mx-auto text-center">
                <div className="mb-12">
                    <span className="inline-block py-2 px-6 rounded-full bg-teal-50 border border-teal-100 mb-4">
                        <h2 className="text-teal-700 text-sm md:text-base font-bold tracking-widest uppercase m-0">
                            Contact Us
                        </h2>
                    </span>
                    <p className="text-3xl md:text-4xl font-extrabold text-slate-800 drop-shadow-sm">
                        We'd love to hear from you
                    </p>
                </div>

                <div className="p-8 md:p-12 rounded-[2rem] border border-white/40 bg-white/60 backdrop-blur-md shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] text-left">
                    <div className="mb-6 text-center">
                        <p className="text-lg font-semibold text-gray-800">Business Hours:</p>
                        <p className="text-gray-700">Monday - Saturday: 8:00 AM - 5:00 PM</p>
                        <p className="mt-4 text-lg font-semibold text-gray-800">Our Address:</p>
                        <p className="text-gray-700">Laois, Labrador, Pangasinan</p>
                    </div>
                    <ContactForm settings={settings} />
                </div>
            </div>
        </motion.div>
    );
};

export default Contact;
