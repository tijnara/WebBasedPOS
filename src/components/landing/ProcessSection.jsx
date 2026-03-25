import React from 'react';
import { Beaker, Filter, Sparkles, ThumbsUp } from 'lucide-react';

export function Process() {
    const steps = [
        {
            icon: Beaker,
            title: 'Source Water Collection',
            description: 'We carefully select and collect water from reliable sources, ensuring a clean starting point for our purification process.',
            gradient: 'from-[#009b70] to-[#84cc16]', // Teal to Apple Green
        },
        {
            icon: Filter,
            title: '21-Stage Filtration',
            description: 'Our advanced reverse osmosis system uses 21 stages to remove impurities, contaminants, and unwanted particles.',
            gradient: 'from-[#84cc16] to-[#009b70]', // Apple Green to Teal
        },
        {
            icon: Sparkles,
            title: 'Remineralization',
            description: 'Essential minerals are carefully reintroduced to create perfectly balanced, healthy drinking water.',
            gradient: 'from-[#009b70] to-[#84cc16]', // Teal to Apple Green
        },
        {
            icon: ThumbsUp,
            title: 'Quality Testing & Refilling',
            description: 'Every batch is tested for purity and taste before being ready for your family to enjoy.',
            gradient: 'from-[#84cc16] to-[#009b70]', // Apple Green to Teal
        },
    ];

    return (
        <section id="process" className="py-24 bg-white relative overflow-hidden font-sans responsive-page">

            {/* Replicated Faint Dotted Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(#e5e7eb 1.5px, transparent 1.5px)',
                    backgroundSize: '48px 48px'
                }}></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Section Header */}
                <div className="text-center mb-24">
                    <h2 className="text-[3rem] sm:text-[4.5rem] lg:text-[6rem] font-bold text-[#0f172a] mb-8 tracking-tight leading-none">
                        OUR <span style={{
                        background: 'linear-gradient(to right, #8DB600, #0d9488)', // Apple green to teal
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        color: 'transparent'
                    }}>PURIFICATION PROCESS</span>
                    </h2>
                    <p className="text-xl lg:text-[22px] text-gray-500 max-w-3xl mx-auto font-light leading-relaxed">
                        From source to your jug, every step is designed to deliver the cleanest,<br className="hidden md:block" /> healthiest water possible.
                    </p>
                </div>

                {/* Process Steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {steps.map((step, index) => {
                        const Icon = step.icon;

                        return (
                            <div key={index} className="group bg-white p-8 rounded-[2rem] flex flex-col items-center text-center">

                                {/* Gradient Icon */}
                                <div className="mb-6">
                                    <svg width="0" height="0">
                                        <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor={index % 2 === 0 ? '#009b70' : '#84cc16'} />
                                            <stop offset="100%" stopColor={index % 2 === 0 ? '#84cc16' : '#009b70'} />
                                        </linearGradient>
                                    </svg>
                                    <Icon
                                        className="w-12 h-12 transition-transform duration-300 group-hover:scale-110"
                                        strokeWidth={1.5}
                                        style={{ stroke: `url(#gradient-${index})` }}
                                    />
                                </div>

                                {/* Title */}
                                <h3 className="text-[1.1rem] font-bold text-gray-900 mb-4">
                                    {step.title}
                                </h3>

                                {/* Description */}
                                <p className="text-gray-500 text-[15px] leading-relaxed">
                                    {step.description}
                                </p>

                            </div>
                        );
                    })}
                </div>

                {/* Bottom Stats Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="text-center">
                        <div className="text-[2.5rem] font-extrabold text-[#009b70] mb-1">21</div>
                        <div className="text-gray-500 text-sm font-medium tracking-wide">Filtration Stages</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[2.5rem] font-extrabold text-[#009b70] mb-1">99.9%</div>
                        <div className="text-gray-500 text-sm font-medium tracking-wide">Purity Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[2.5rem] font-extrabold text-[#009b70] mb-1">24/7</div>
                        <div className="text-gray-500 text-sm font-medium tracking-wide">Quality Monitoring</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[2.5rem] font-extrabold text-[#009b70] mb-1">100%</div>
                        <div className="text-gray-500 text-sm font-medium tracking-wide">Customer Satisfaction</div>
                    </div>
                </div>

            </div>

            <br></br>
            <br></br>
        </section>


    );
}

export default Process;
