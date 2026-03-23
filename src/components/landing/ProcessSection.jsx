import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from '../../hooks/useInView';

const ProcessSection = () => {
    const [ref, isInView] = useInView();

    const processStages = [
        { stage: '1-3', process: 'Multi-Media Sediment Filtration', description: 'Three layers of specialized media remove sand, silt, rust, and particles down to 40 microns.' },
        { stage: '4', process: 'Dual-Stage Carbon Filter (A)', description: 'High-grade activated carbon removes chlorine and chemical odors.' },
        { stage: '5', process: 'Dual-Stage Carbon Filter (B)', description: 'Second pass ensures complete removal of pesticides and volatile organic compounds (VOCs).' },
        { stage: '6', process: 'Water Softening Resin', description: 'Ion-exchange technology removes calcium and magnesium to prevent "hard water" scale.' },
        { stage: '7', process: 'Fine Sediment Polishing', description: 'A 10-micron filter catches any remaining microscopic debris from the softening stage.' },
        { stage: '8', process: 'Ultra-Fine Polishing', description: 'A 5-micron filter provides a secondary barrier for absolute clarity.' },
        { stage: '9-12', process: 'Reverse Osmosis (RO) Membrane', description: 'The heart of the system. Four high-pressure membranes force water through a 0.0001-micron barrier, removing bacteria, viruses, and heavy metals.' },
        { stage: '13', process: 'Post-Carbon Refinement', description: 'Polishes the taste of the water after RO, giving it a crisp, clean finish.' },
        { stage: '14', process: 'Mineral Enhancement', description: 'Re-introduces essential trace minerals for health and a refreshing natural taste.' },
        { stage: '15', process: 'Micro-Filtration Stage 1', description: 'A 1-micron absolute filter acts as a final physical defense.' },
        { stage: '16', process: 'Micro-Filtration Stage 2', description: 'A 0.5-micron filter ensures even the smallest cysts are removed.' },
        { stage: '17', process: 'Ultraviolet (UV) Sterilization', description: 'High-intensity UV light scrambles the DNA of any lingering microorganisms, rendering them harmless.' },
        { stage: '18', process: 'Ozone Injection', description: 'Powerful O3​ oxidation kills bacteria on contact and ensures the water remains sterile inside the bottle.' },
        { stage: '19', process: 'Final Oxygenation', description: 'Increases dissolved oxygen levels for a lighter, more refreshing mouthfeel.' },
        { stage: '20', process: 'Container Sanitization', description: 'Before filling, every bottle is rinsed with ozonated water to ensure the vessel is as clean as the product.' }
    ];

    return (
        <motion.div 
            id="process" 
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
            transition={{ duration: 0.6 }}
            className="bg-transparent relative z-20 border-t"
        >
            <div className="px-6 py-20 pb-32 max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <span className="inline-block py-2 px-6 rounded-full bg-teal-50 border border-teal-100 mb-4">
                        <h2 className="text-teal-700 text-sm md:text-base font-bold tracking-widest uppercase m-0">
                            Our 20-Stage Process
                        </h2>
                    </span>
                    <p className="text-3xl md:text-4xl font-extrabold text-slate-800 drop-shadow-sm">
                        Pure Water, Guaranteed.
                    </p>
                </div>
                <div className="relative">
                    <div className="absolute left-1/2 -translate-x-1/2 w-1 bg-teal-200/50 h-full rounded-full"></div>
                    <div className="space-y-12">
                        {processStages.map((item, index) => (
                            <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                                <div className="w-1/2 px-4">
                                    <div className="p-6 rounded-[1.5rem] border border-white/40 bg-white/60 backdrop-blur-md shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]">
                                        <h3 className="text-lg font-bold text-teal-900">{item.process}</h3>
                                        <p className="text-sm text-slate-700">{item.description}</p>
                                    </div>
                                </div>
                                <div className="absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold border-4 border-white/80 shadow-lg">
                                    {item.stage}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProcessSection;
