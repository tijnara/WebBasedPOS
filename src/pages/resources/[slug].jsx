// pages/resources/[slug].jsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// --- Adsterra Monetization Components ---
import Meta from '../../components/landing/Meta';
import Footer from '../../components/landing/Footer';
import { AdsterraVerticalBanner, AdsterraBanner } from '../../components/landing/AdBanners';

export default function DynamicArticle({ article }) {
    if (!article) return <div className="p-20 text-center">Article not found.</div>;

    return (
        <>
            <Meta /> {/* Triggers Adsterra Popunders */}

            <div className="min-h-screen text-slate-800 font-sans selection:bg-lime-200 responsive-page bg-slate-50 flex flex-col justify-between">
                <Head>
                    <title>{article.title} | Seaside</title>
                    <meta name="description" content={article.description} />
                </Head>

                <div className="flex-grow flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-6 py-12 md:py-20 gap-10">

                    {/* MAIN ARTICLE CONTENT */}
                    <main className="w-full lg:w-3/4">
                        <Link href="/resources" className="inline-flex items-center text-green-700 hover:text-green-800 font-medium mb-8 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Resources
                        </Link>

                        <article className="rounded-3xl shadow-lg p-8 md:p-12 bg-white">
                            <header className="mb-10">
                                <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
                                    {article.title}
                                </h1>
                                <div className="flex items-center text-sm text-slate-500">
                                    <span>By Seaside Editorial Team</span>
                                    <span className="mx-2">•</span>
                                    <span>{new Date(article.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                            </header>

                            {/* Render the uploaded Featured Image right before the content */}
                            {article.image_url && (
                                <img
                                    src={article.image_url}
                                    alt={article.title}
                                    className="md:float-right md:ml-8 mb-6 w-full md:w-[40%] rounded-2xl shadow-md object-cover"
                                />
                            )}

                            {/* Render the HTML content safely with our custom typography class */}
                            <div
                                className="article-content text-slate-700 leading-relaxed text-lg"
                                dangerouslySetInnerHTML={{ __html: article.content }}
                            />

                            {/* Clear the float so footer elements don't get messy */}
                            <div className="clear-both"></div>
                        </article>

                        {/* Mobile Adsterra Banner (Shows only on small screens) */}
                        <div className="mt-12 w-full flex justify-center lg:hidden">
                            <AdsterraBanner />
                        </div>
                    </main>

                    {/* RIGHT SIDEBAR (Adsterra 160x600 Banner) */}
                    <aside className="hidden lg:flex lg:w-1/4 justify-center pt-24">
                        <div className="sticky top-24 flex flex-col items-center">
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 block text-center">Advertisement</span>
                            <AdsterraVerticalBanner />
                        </div>
                    </aside>

                </div>

                {/* Footer wrapped in a solid white background */}
                <div className="w-full bg-white relative z-20 border-t border-slate-100">
                    <Footer />
                </div>
            </div>
        </>
    );
}

// Fetch data on every request for SEO
export async function getServerSideProps({ params }) {
    const { slug } = params;

    const { data: article, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

    if (error || !article) {
        return { notFound: true };
    }

    return { props: { article } };
}
