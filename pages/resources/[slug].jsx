// pages/resources/[slug].jsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../src/lib/supabaseClient';

export default function DynamicArticle({ article }) {
    if (!article) return <div className="p-20 text-center">Article not found.</div>;

    return (
        <div className="min-h-screen text-slate-800 font-sans selection:bg-lime-200 responsive-page bg-slate-50">
            <Head>
                <title>{article.title} | Seaside</title>
                <meta name="description" content={article.description} />
            </Head>

            <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
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

                    {/* NEW: Render the uploaded Featured Image right before the content */}
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
            </main>
        </div>
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