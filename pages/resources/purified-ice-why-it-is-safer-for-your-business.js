import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Snowflake, Store, ShieldCheck, GlassWater } from 'lucide-react';

export default function PurifiedIceArticle() {
  return (
    <div 
      className="min-h-screen font-sans"
      style={{
        backgroundImage: "url('/seaside_bg2.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        {/* Article Content */}
        <article className="bg-white/50 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8 md:p-12" style={{ backgroundColor: '#FFFFFF80' }}>
          <header className="mb-10">
            <Link href="/resources" className="inline-flex items-center text-green-700 hover:text-green-800 font-medium mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Resources
            </Link>
            <div className="flex items-center gap-2 text-blue-600 mb-4 font-bold uppercase tracking-widest text-xs">
              <Snowflake className="w-4 h-4" />
              Business & Food Safety
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              The Hidden Ingredient: Why Purified Ice is Critical for Your Labrador Business
            </h1>
            <p className="text-sm text-slate-600 mt-6 italic">
              Last Updated: March 2024 • 6 min read
            </p>
          </header>

          <div className="prose prose-green max-w-none text-slate-800 leading-relaxed space-y-6">
            <p className="text-lg">
              For restaurants, coffee shops, and sari-sari stores in <strong>Labrador, Pangasinan</strong>, every detail counts toward customer satisfaction. While many focus on the quality of their beans or the freshness of their ingredients, one "hidden" ingredient is often overlooked: <strong>the ice.</strong> At <strong>Seaside Purified Water Refilling Station</strong>, we provide high-quality ice tubes and cubes that are as safe as the water we serve.
            </p>

            <h2 className="text-2xl font-bold text-green-950 mt-12 mb-4">Ice is Food, Not Just a Cooler</h2>
            <p>
              It is a common misconception that the freezing process kills bacteria. In reality, many pathogens can survive in ice made from untreated or poorly filtered water. When that ice melts into a customer's drink, it introduces those contaminants directly into their system. For businesses in <strong>Loois and neighboring municipalities</strong>, using ice made from our 21-stage purified water is the easiest way to ensure 100% food safety compliance.
            </p>

            {/* Business Benefits Box */}
            <div className="bg-blue-50/50 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6 my-8">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                <Store className="w-5 h-5 mr-2 text-blue-600" />
                Why Local Businesses Choose Seaside Ice
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                    <div className="bg-white p-1 h-fit rounded shadow-sm"><ShieldCheck className="w-4 h-4 text-green-600" /></div>
                    <div>
                        <h4 className="font-bold text-blue-800">Crystal Clear Presentation</h4>
                        <p className="text-sm text-slate-600">Impure water creates cloudy, white ice. Seaside ice is crystal clear, making your iced coffees, milkteas, and juices look professional and appetizing.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white p-1 h-fit rounded shadow-sm"><GlassWater className="w-4 h-4 text-blue-600" /></div>
                    <div>
                        <h4 className="font-bold text-blue-800">Neutral Flavor Profile</h4>
                        <p className="text-sm text-slate-600">Chlorine or minerals in tap-water ice can alter the taste of your beverages. Our purified ice ensures your signature drinks taste exactly how they should.</p>
                    </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-green-950 mt-12 mb-4">Protecting Your Reputation</h2>
            <p>
              In a tight-knit community like Labrador, word travels fast. A single incident of a customer getting sick from "dirty ice" can devastate a local business's reputation. By sourcing your <strong>ice tubes and cubes</strong> from Seaside, you are investing in "Pure Trust." We maintain the same strict sanitization standards for our ice-making equipment as we do for our water refilling taps.
            </p>

            <h2 className="text-2xl font-bold text-green-950 mt-12 mb-4">Cost-Effective and Convenient</h2>
            <p>
              Investing in a high-end commercial filtration and ice machine is expensive for small to medium businesses. Seaside offers a more practical solution with our <strong>reliable delivery service</strong>. We bring the ice directly to your doorstep, allowing you to focus on serving your customers while we handle the purification and production.
            </p>

            <div className="bg-lime-50/50 backdrop-blur-sm rounded-2xl border border-lime-100/50 p-6 my-8">
                <h3 className="text-lg font-bold text-green-900 mb-2">Perfect for Events</h3>
                <p className="text-sm text-green-800 italic">
                    Planning a barangay fiesta, birthday, or corporate event in Labrador? Don't settle for "ice-lan." Our food-grade purified ice cubes ensure your guests stay refreshed without any health risks.
                </p>
            </div>

            <p className="pt-6 border-t border-gray-100/50 font-medium text-slate-900">
              Ready to upgrade your business's ice quality? Visit us in Loois, Labrador, or message Seaside today to set up a regular delivery schedule for your purified ice needs.
            </p>
          </div>

          <footer className="mt-12 pt-8 border-t border-gray-100/50 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="text-sm text-slate-600">
               © {new Date().getFullYear()} Seaside Purified Water
             </div>
             <div className="flex gap-4">
               <Link href="/contact" className="text-green-700 hover:underline text-sm font-bold">Contact Us</Link>
               <Link href="/terms" className="text-green-700 hover:underline text-sm font-bold">Terms of Service</Link>
             </div>
          </footer>
        </article>
      </main>
    </div>
  );
}