import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { useCustomers } from '../../hooks/useCustomers'; // Import the hook
// NOTE: AdsterraBanner import removed

const Hero = () => {
    const { data: customersData, isLoading } = useCustomers(); // Use the hook to fetch customers
    const features = [
        'Advanced 21-stage reverse osmosis filtration system',
        'Carefully remineralized to deliver crisp, healthy hydration for your whole family',
        'Eco-friendly station—bring your jugs and save the planet',
    ];

    // Format the customer count
    const customerCount = customersData?.totalCount || 10000;
    const formattedCount = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
    }).format(customerCount);


    return (
        // Adjusted padding top to reduce the space above the text
        <section id="home" className="relative min-h-screen pt-8 md:pt-12 flex items-center bg-white overflow-hidden responsive-page">

            {/* Decorative Elements */}
            <div className="absolute top-32 right-10 w-72 h-72 bg-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 left-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

            {/* Background Image - ensure full image is visible and not cut off */}
            <div className="absolute inset-0 top-24 md:top-28 z-0 w-full h-full flex items-center justify-center pointer-events-none select-none">
                <picture>
                    <source media="(min-width: 768px)" srcSet="/seaside3d3.png" />
                    <img
                        src="/seaside3d4.png"
                        alt="Crystal clear water"
                        className="w-full h-full object-contain opacity-100"
                        style={{ maxHeight: '80vh', maxWidth: '100vw' }}
                    />
                </picture>
            </div>

            {/* Content - Reduced vertical padding to close the top gap */}
            <div className="relative z-10 w-full lg:w-1/2 mx-auto lg:mx-0 lg:mr-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="max-w-lg">

                    {/* A soft white card behind the text to guarantee contrast on smaller screens where the image spans full width */}
                    <div className="bg-white/80 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none p-6 lg:p-0 rounded-3xl">

                        {/* NOTE: Advertisement block removed from here */}

                        {/* Main Heading - REDUCED FONT SIZES */}
                        <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
                            Your Family's Health in Labrador, Pangasinan,<br />{' '}
                            <span style={{
                                background: 'linear-gradient(to right, #8DB600, #0d9488)', // Apple green to teal
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                color: 'transparent'
                            }}>
                                Flowing Crystal Clear from Seaside.
                            </span>
                        </h1>


                        {/* Subheading - UPDATED with 75% hex transparent background */}
                        <p
                            className="text-lg sm:text-xl lg:text-lg xl:text-xl text-gray-800 mb-10 leading-relaxed font-medium p-4 rounded-xl shadow-sm"
                            style={{ backgroundColor: '#ffffffBF' }}
                        >
                            Proudly serving the families of Labrador, Pangasinan. At Seaside, we believe our community deserves
                            world-class hydration without leaving town. We combine state-of-the-art 21-stage reverse osmosis with
                            the warm, local service you know and trust.
                        </p>

                        {/* Features List - REDUCED FONT SIZES */}
                        <div className="space-y-4 mb-10">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-4 p-3 rounded-xl shadow-sm transition-all hover:scale-[1.02]"
                                    style={{ backgroundColor: '#ffffffBF' }} // UPDATED with 75% hex transparent background
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                                            <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
                                        </div>
                                    </div>
                                    {/* Changed from text-base lg:text-lg to text-sm lg:text-base */}
                                    <span className="text-gray-900 font-bold text-sm lg:text-base">{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href="#location" className="w-full sm:w-auto">
                                {/* CHANGED text-lg to text-base AND px-8 py-4 to px-6 py-3.5 */}
                                <button className="w-full px-6 py-3.5 rounded-2xl hover:shadow-lg transition-all duration-300 font-bold text-base hover:scale-105 shadow-md" style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                                    Visit Us Today
                                </button>
                            </a>
                            <a href="#services" className="w-full sm:w-auto">
                                {/* CHANGED text-lg to text-base AND px-8 py-4 to px-6 py-3.5 */}
                                <button className="w-full px-6 py-3.5 bg-white text-teal-700 border-2 border-teal-600 rounded-2xl hover:bg-teal-50 transition-all duration-300 font-bold text-base shadow-sm hover:scale-105">
                                    Learn More
                                </button>
                            </a>
                        </div>


                        {/* Trust Indicators */}
                        <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-gray-800 p-3 rounded-xl inline-flex" style={{ backgroundColor: '#ffffffBF' }}>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                                <span className="font-bold">
                    {isLoading ? 'Loading...' : `${formattedCount}+ Happy Families`}
                  </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="font-bold">DOH Certified</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                                <span className="font-bold">Eco-Friendly</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

        </section>
    );
};

export default Hero;
