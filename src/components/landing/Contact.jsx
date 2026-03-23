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
                    <span className="inline-block py-2 px-6 rounded-full bg-lime-100 mb-4 border border-lime-300 shadow-sm">
                        <h2 className="text-green-700 text-2xl md:text-3xl font-black tracking-widest uppercase m-0">Contact Us</h2>
                    </span>
                    <p className="text-2xl md:text-3xl font-bold text-slate-800 drop-shadow-sm mt-4">We'd love to hear from you</p>
                </div>

                <div className="bg-white/50 backdrop-blur-sm p-8 md:p-12 rounded-3xl border shadow-sm text-left">
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
