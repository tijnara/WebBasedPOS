// pages/terms.jsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50 text-slate-800 font-sans selection:bg-lime-200">
            <Head>
                <title>Terms of Service | Seaside Water Refilling Station</title>
                <meta name="description" content="Terms and conditions for Seaside Purified Water Refilling Station in Labrador, Pangasinan." />
            </Head>

            <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                <Link href="/" className="inline-flex items-center text-green-700 hover:text-green-800 font-medium mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
                    <div className="flex items-center gap-3 mb-6">
                        <Image src="/seaside.png" alt="Seaside Logo" width={32} height={32} />
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Terms of Service</h1>
                    </div>
                    
                    <p className="text-sm text-slate-500 mb-8">Last Updated: {new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

                    <div className="space-y-8 text-slate-700 leading-relaxed">
                        
                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using the Seaside Purified Water Refilling Station website ("Site") and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Site or services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">2. Services Provided</h2>
                            <p>
                                Seaside provides 21-stage purified water, alkaline water, PET bottles, ice tubes, and delivery services within Labrador, Pangasinan and neighboring municipalities. Service availability, delivery times, and product stock are subject to change without prior notice.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">3. Orders, Delivery, and Containers</h2>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li><strong>Container Cleanliness:</strong> If providing your own containers for refill, you are responsible for their initial cleanliness. While we sanitize containers prior to refilling, we reserve the right to refuse refills for heavily soiled or contaminated bottles.</li>
                                <li><strong>Delivery:</strong> Door-to-door delivery schedules depend on rider availability and weather conditions. We will make reasonable efforts to fulfill orders promptly.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">4. Payments and Store Credit (Utang)</h2>
                            <p>
                                We accept Cash, GCash, and other approved payment methods. For registered customers utilizing our "Charge to Account" (store credit) system, you agree to settle outstanding balances in a timely manner. Seaside reserves the right to suspend delivery or credit privileges for accounts with overdue balances.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">5. Staff Portal and Security</h2>
                            <p>
                                Access to the `seasidepos.vercel.app` Point of Sale (POS) backend is strictly restricted to authorized Seaside personnel. Unauthorized access, tampering, or misuse of the POS system is prohibited and may result in legal action or termination of employment.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">6. Third-Party Advertising</h2>
                            <p>
                                Our public landing page may display advertisements provided by third parties (such as Google AdSense). We are not responsible for the content of external websites linked through these advertisements.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">7. Limitation of Liability</h2>
                            <p>
                                Seaside Purified Water Refilling Station adheres to strict health and sanitation standards. However, we are not liable for any illness, injury, or damages arising from the improper storage of water by the customer after delivery or pickup. Purified water should be stored in a cool, dry place away from direct sunlight.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-green-950 mb-3">8. Contact Us</h2>
                            <p>
                                If you have any questions regarding these terms, please contact us at our physical station in Loois, Labrador, Pangasinan, or via our official Facebook page.
                            </p>
                        </section>

                    </div>
                </div>
            </main>
        </div>
    );
}
