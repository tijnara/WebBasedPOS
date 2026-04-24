// pages/privacy.jsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 text-slate-800 font-sans selection:bg-lime-200 responsive-page">
            <Head>
                <title>Privacy Policy | Seaside Water Refilling Station</title>
                <meta name="description" content="Privacy Policy for Seaside Purified Water Refilling Station. Learn how we handle and protect your data." />
            </Head>

            <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                {/* Back to Home Link */}
                <Link href="/" className="inline-flex items-center text-green-700 hover:text-green-800 font-medium mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                {/* Main Content Card (Matches Terms of Service) */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
                    <div className="flex items-center gap-3 mb-6">
                        <ShieldCheck className="w-8 h-8 text-green-600" />
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Privacy Policy</h1>
                    </div>

                    <p className="text-sm text-slate-500 mb-8">Last Updated: {new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

                    <div className="space-y-8 text-slate-700 leading-relaxed">

                        <section>
                            <p>
                                At Seaside Purified Water Refilling Station ("we," "us," or "our"), accessible from <code>seasidepos.vercel.app</code>, the privacy of our visitors and customers is one of our main priorities. This Privacy Policy document outlines the types of information that is collected and recorded by Seaside and how we use it.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">1. Information We Collect</h2>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li><strong>Personal Information:</strong> If you are a delivery customer or utilize our store credit system, our staff may manually collect and store your Name, Address, and Phone Number in our secure Point of Sale (POS) system to fulfill orders and manage balances.</li>
                                <li><strong>Log Files & Analytics:</strong> Like many websites, we collect standard log files. This includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamps, and referring/exit pages. This information is used to analyze trends, administer the site, and track user movement on the website.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">2. Cookies and Web Beacons</h2>
                            <p>
                                Like any other website, Seaside uses "cookies". These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">3. Google AdSense & DoubleClick DART Cookie</h2>
                            <p>
                                Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL – <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">https://policies.google.com/technologies/ads</a>.
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-3">
                                <li>Third party vendors, including Google, use cookies to serve ads based on a user's prior visits to your website or other websites.</li>
                                <li>Google's use of advertising cookies enables it and its partners to serve ads to your users based on their visit to your sites and/or other sites on the Internet.</li>
                                <li>Users may opt out of personalized advertising by visiting <a href="https://myadcenter.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Ads Settings</a>.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">4. Security of Your Data</h2>
                            <p>
                                Our customer database and POS backend are strictly restricted to authorized Seaside personnel requiring login credentials. We do not sell, trade, or rent your personal identification information to others.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">5. Consent</h2>
                            <p>
                                By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">6. Contact Us</h2>
                            <p>
                                If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at our physical station in Loois, Labrador, Pangasinan, or via our official Facebook page.
                            </p>
                        </section>

                    </div>
                </div>
            </main>
        </div>
    );
}