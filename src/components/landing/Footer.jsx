import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { AdsterraBanner } from './AdBanners';

const Footer = () => {
    return (
        <>
            {/* ADSTERRA BANNER SECTION */}
            <div className="bg-transparent relative z-20 border-t py-10 flex justify-center items-center">
                <div className="text-center bg-white/50 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/30">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 block">Advertisement</span>

                    {/* Safely load Adsterra using our custom component */}
                    <AdsterraBanner />

                </div>
            </div>
            {/* END ADSTERRA BANNER SECTION */}

            <footer className="bg-slate-900 text-slate-400 py-12">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

                        <div>
                            <h3 className="text-cyan-400 text-lg font-bold mb-4">Our Labrador, Pangasinan Roots</h3>
                            <p className="text-sm leading-relaxed">
                                Founded on 2020, our station was born from a desire for local
                                self-reliance in Labrador, Pangasinan. We provide the community with
                                state-of-the-art 20-stage purification, ensuring every neighbor from the
                                poblacion to the barangays has access to the highest quality hydration.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-cyan-400 text-lg font-bold mb-4">Quick Links</h3>
                            <ul className="text-sm space-y-2">
                                <li><Link href="#process" className="inline-block py-2 hover:text-cyan-300 transition">Our 20-Stage Process</Link></li>
                                <li><Link href="#location" className="inline-block py-2 hover:text-cyan-300 transition">Delivery Areas</Link></li>
                                <li><Link href="/contact" className="inline-block py-2 hover:text-cyan-300 transition">Contact Support</Link></li>
                                <li><Link href="/terms" className="inline-block py-2 hover:text-cyan-300 transition">Terms of Service</Link></li>
                                <li><Link href="/privacy" className="inline-block py-2 hover:text-cyan-300 transition">Privacy Policy</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-cyan-400 text-lg font-bold mb-4">Resources & Health</h3>
                            <ul className="text-sm space-y-3">
                                <li>
                                    <Link href="/resources/benefits-of-21-stage-purified-water" className="inline-block py-2 hover:text-cyan-300 transition flex flex-col">
                                        <span className="font-bold">The Science of 20 Stages</span>
                                        <span className="text-xs text-slate-500">Why standard filtration isn't enough.</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/resources/staying-hydrated-in-labrador-summer-tips" className="inline-block py-2 hover:text-cyan-300 transition flex flex-col">
                                        <span className="font-bold">Beating the Labrador Heat</span>
                                        <span className="text-xs text-slate-500">Hydration tips for the tropical climate.</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/resources/maintaining-your-water-containers-at-home" className="inline-block py-2 hover:text-cyan-300 transition flex flex-col">
                                        <span className="font-bold">Dispenser Maintenance 101</span>
                                        <span className="text-xs text-slate-500">Keep your water pure at home.</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>

                    </div>

                    <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col items-center text-center text-xs">
                        <p className="mb-3">© {new Date().getFullYear()} Seaside Purified Water. DOH Certified. All Rights Reserved.</p>

                        {/* --- ADSTERRA DIRECT LINK (OPTIONAL SUPPORT) --- */}
                        <a
                            href="https://undergocutlery.com/ngz7b0mms?key=c1cb95a3297c5e2d634e2cbbecde0044"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-lime-400 transition-colors duration-300 px-3 py-1.5 rounded-full border border-slate-700/50 hover:border-lime-400/50 bg-slate-800/30"
                        >
                            <Heart className="w-3 h-3" /> Click here to support our local business
                        </a>
                        {/* --- END ADSTERRA DIRECT LINK --- */}

                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;
