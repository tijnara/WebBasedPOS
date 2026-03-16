// pages/privacy.jsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 text-slate-800 font-sans selection:bg-lime-200">
            <Head>
                <title>Privacy Policy | Seaside Water Refilling Station</title>
                <meta name="description" content="Privacy Policy for Seaside Purified Water Refilling Station in Labrador, Pangasinan." />
            </Head>

            <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                <Link href="/" className="inline-flex items-center text-green-700 hover:text-green-800 font-medium mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
                    <div className="flex items-center gap-3 mb-6">
                        <Image src="/seaside.png" alt="Seaside Logo" width={32} height={32} />
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Privacy Policy</h1>
                    </div>
                    
                    <p className="text-sm text-slate-500 mb-8">Last Updated: {new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

                    <div className="space-y-8 text-slate-700 leading-relaxed">
                        
                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">1. Introduction</h2>
                            <p>
                                Seaside Purified Water Refilling Station ("we," "our," "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website `seasidepos.vercel.app` (the "Site").
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">2. Information We Collect</h2>
                            <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li><strong>For Public Visitors:</strong> We may collect anonymous data such as your IP address, browser type, and pages visited for analytical purposes (e.g., page view counts) and to serve third-party advertisements (like Google AdSense). We do not collect personally identifiable information from public visitors.</li>
                                <li><strong>For Registered Staff:</strong> When you log in to our Point of Sale (POS) system, we collect your username and associate your activity (e.g., sales transactions, customer management) with your account for operational and security purposes.</li>
                                <li><strong>For Customers (via POS):</strong> Our staff may record customer names, addresses, and contact numbers into our secure POS system to manage deliveries and track store credit ("utang"). This information is not collected through the public website and is only accessible to authorized personnel.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">3. Use of Your Information</h2>
                            <p>
                                Having accurate information permits us to provide a smooth, efficient, and customized experience. Specifically, we may use information collected about you to:
                            </p>
                             <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>Manage sales, deliveries, and customer accounts.</li>
                                <li>Monitor and analyze usage and trends to improve your experience with the Site.</li>
                                <li>Maintain the security of our POS system and prevent fraudulent transactions.</li>
                                <li>Serve third-party advertising on our public landing page.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">4. Disclosure of Your Information</h2>
                            <p>
                                We do not sell, trade, or rent your personal information to others. We may share information we have collected about you in certain situations:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law.</li>
                                <li><strong>Third-Party Advertisers:</strong> We may use third-party advertising companies to serve ads when you visit the Site. These companies may use information about your visits to our Site and other websites that are contained in web cookies in order to provide advertisements about goods and services of interest to you.</li>
                            </ul>
                        </section>
                        
                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">5. Security of Your Information</h2>
                            <p>
                                We use administrative, technical, and physical security measures to help protect your personal information. All staff and customer data entered into our POS is stored securely with our database provider (Supabase) and is accessible only through authenticated staff accounts. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">6. Contact Us</h2>
                            <p>
                                If you have questions or comments about this Privacy Policy, please contact us at our physical station in Loois, Labrador, Pangasinan.
                            </p>
                        </section>

                    </div>
                </div>
            </main>
        </div>
    );
}
