import React from 'react';

const WhyChooseUs = () => {
    // Updated array to remove icons and color classes
    const reasons = [
        {
            title: '21-Stage Filtration',
            description: 'Our advanced reverse osmosis system ensures the highest purity standards, removing impurities while retaining essential minerals.',
        },
        {
            title: 'Crystal Clear Quality',
            description: 'Every drop is carefully tested and monitored to guarantee the cleanest, safest drinking water for your family.',
        },
        {
            title: 'Health First',
            description: 'Properly remineralized water supports your family\'s health and wellbeing with balanced pH and essential minerals.',
        },
        {
            title: 'Eco-Friendly',
            description: 'Reduce plastic waste by refilling your jugs. Together, we\'re making a positive impact on our environment.',
        },
        {
            title: 'Trusted Quality',
            description: 'Serving Labrador, Pangasinan with pride. Our commitment to excellence has made us the community\'s choice.',
        },
        {
            title: 'Local Service',
            description: 'We\'re your neighbors, dedicated to providing friendly, reliable service and world-class hydration right in your community.',
        },
    ];

    // Icon SVGs for each card
    const icons = [
        // 21-Stage Filtration: Shield
        <svg key="shield" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="shield-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#14b8a6" />
                    <stop offset="1" stopColor="#7ed957" />
                </linearGradient>
            </defs>
            <path d="M24 4C24 4 8 8 8 18C8 36 24 44 24 44C24 44 40 36 40 18C40 8 24 4 24 4Z" fill="url(#shield-gradient)"/>
            <path d="M17 25L22 30L31 19" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>,
        // Crystal Clear Quality: Water Drop
        <svg key="drop" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="drop-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#14b8a6" />
                    <stop offset="1" stopColor="#7ed957" />
                </linearGradient>
            </defs>
            <path d="M24 6C24 6 12 22 12 30C12 38 18 44 24 44C30 44 36 38 36 30C36 22 24 6 24 6Z" fill="url(#drop-gradient)"/>
            <ellipse cx="24" cy="34" rx="6" ry="4" fill="#fff" fillOpacity="0.3"/>
        </svg>,
        // Health First: Heart
        <svg key="heart" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="heart-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#14b8a6" />
                    <stop offset="1" stopColor="#7ed957" />
                </linearGradient>
            </defs>
            <path d="M24 41s-13-8.35-13-17.5C11 15.5 16.5 12 24 20.5C31.5 12 37 15.5 37 23.5C37 32.65 24 41 24 41Z" fill="url(#heart-gradient)"/>
        </svg>,
        // Eco-Friendly: Leaf
        <svg key="leaf" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="leaf-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#14b8a6" />
                    <stop offset="1" stopColor="#7ed957" />
                </linearGradient>
            </defs>
            <path d="M36 12C36 12 28 12 20 20C12 28 12 36 12 36C12 36 20 36 28 28C36 20 36 12 36 12Z" fill="url(#leaf-gradient)"/>
            <path d="M12 36L36 12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
        </svg>,
        // Trusted Quality: Award/Star
        <svg key="star" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="star-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#14b8a6" />
                    <stop offset="1" stopColor="#7ed957" />
                </linearGradient>
            </defs>
            <path d="M24 8L30 18H40L32 26L35 36L24 30L13 36L16 26L8 18H18L24 8Z" fill="url(#star-gradient)"/>
        </svg>,
        // Local Service: Community/Building
        <svg key="community" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="community-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#14b8a6" />
                    <stop offset="1" stopColor="#7ed957" />
                </linearGradient>
            </defs>
            <path d="M24 8L10 20V40H18V30H30V40H38V20L24 8Z" fill="url(#community-gradient)"/>
            <rect x="22" y="16" width="4" height="4" fill="#fff" fillOpacity="0.4"/>
        </svg>,
    ];

    return (
        <section id="why-choose" className="py-24 relative overflow-hidden font-sans bg-white responsive-page">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-block mb-4">
                        <span className="px-5 py-2 bg-teal-50 text-teal-600 rounded-full text-sm font-semibold tracking-wide shadow-sm" style={{background: 'linear-gradient(90deg, #99f6e4 0%, #d1fae5 100%)', color: '#14b8a6'}}>
                            Our Commitment to Excellence
                        </span>
                    </div>
                    <h2 className="text-[4rem] sm:text-[6rem] lg:text-[10rem] font-bold text-[#0f172a] mb-8 tracking-tight leading-none">
                        WHY CHOOSE{' '}
                        <span style={{
                            background: 'linear-gradient(to right, #8DB600, #0d9488)', // Apple green to teal
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            color: 'transparent'
                        }}>
    SEASIDE?
</span>

                    </h2>
                    <p className="text-lg md:text-xl max-w-xl mx-auto font-light leading-relaxed" style={{color: '#64748b', fontFamily: 'Inter, sans-serif', fontWeight: 300, fontSize: '1.35rem'}}>
                        We're committed to delivering the best water refilling experience with advanced technology, sustainable practices, and genuine care for our community.
                    </p>
                </div>

                {/* Reasons Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {reasons.map((reason, index) => (
                        <div key={index} className="group p-5 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-teal-50 hover:border-teal-100 flex flex-col items-center text-center">
                            <div className="mb-4 p-3 bg-teal-50/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                {icons[index]}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                                {reason.title}
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed font-light">
                                {reason.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <br></br>
            <br></br>
        </section>
    );
};

export default WhyChooseUs;
