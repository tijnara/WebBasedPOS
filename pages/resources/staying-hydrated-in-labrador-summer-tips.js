import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Sun, Thermometer, Droplets, Utensils } from 'lucide-react';

export default function SummerHydrationArticle() {
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
            <div className="flex items-center gap-2 text-orange-600 mb-4 font-bold uppercase tracking-widest text-xs">
              <Sun className="w-4 h-4" />
              Seasonal Health Advice
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Beat the Pangasinan Heat: Essential Summer Hydration Tips
            </h1>
            <p className="text-sm text-slate-600 mt-6 italic">
              Last Updated: March 2024 • 7 min read
            </p>
          </header>

          <div className="prose prose-green max-w-none text-slate-800 leading-relaxed space-y-6">
            <p className="text-lg">
              As the summer sun settles over <strong>Labrador, Pangasinan</strong>, temperatures can soar, making hydration more critical than ever. At <strong>Seaside Purified Water Refilling Station</strong>, we see firsthand how the demand for pure, refreshing water peaks during these months. Staying hydrated isn't just about quenching thirst; it’s about maintaining your energy, focus, and overall well-being.
            </p>

            <h2 className="text-2xl font-bold text-green-950 mt-12 mb-4">Understanding Summer Dehydration</h2>
            <p>
              In the humid tropical climate of Labrador, your body loses fluids rapidly through sweat. Dehydration can creep up on you, manifesting as headaches, fatigue, or dizziness. By the time you feel thirsty, you are likely already slightly dehydrated. For active families and local workers, consistent water intake is the first line of defense against heat exhaustion.
            </p>

            {/* Practical Advice Box */}
            <div className="bg-orange-50/50 backdrop-blur-sm rounded-2xl border border-orange-100/50 p-6 my-8">
              <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center">
                <Thermometer className="w-5 h-5 mr-2 text-orange-600" />
                Hydration Best Practices
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                    <div className="bg-white p-1 h-fit rounded shadow-sm"><Droplets className="w-4 h-4 text-blue-500" /></div>
                    <div>
                        <h4 className="font-bold text-orange-800">Don't Wait for Thirst</h4>
                        <p className="text-sm">Sip water consistently throughout the day. Aim for at least 8 to 10 glasses, and more if you are spending time outdoors in Loois or neighboring areas.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white p-1 h-fit rounded shadow-sm"><Utensils className="w-4 h-4 text-green-500" /></div>
                    <div>
                        <h4 className="font-bold text-orange-800">Eat Hydrating Foods</h4>
                        <p className="text-sm">Incorporate local fruits like watermelon, cucumber, and singkamas into your diet. These have high water content and provide essential vitamins.</p>
                    </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-green-950 mt-12 mb-4">The Seaside Advantage</h2>
            <p>
              During the summer, the quality of your water matters as much as the quantity. Tap water can sometimes carry a heavy chlorine taste or sediments that make it less palatable. <strong>Seaside’s 21-stage purified water</strong> is processed to remove these impurities, resulting in a crisp, clean taste that encourages you to drink more.
            </p>
            <p>
                Our <strong>purified ice tubes</strong> are also a local favorite for cooling down drinks safely. Because they are made from the same high-quality filtered water, you don't have to worry about contaminants melting into your beverage.
            </p>

            <h2 className="text-2xl font-bold text-green-950 mt-12 mb-4">Tips for Kids and Seniors</h2>
            <p>
              Children and the elderly are most at risk during Pangasinan summers. Encourage kids to carry reusable <strong>Seaside PET bottles</strong> to school or play. For seniors, keep a 5-gallon slim container within easy reach at home to ensure they stay hydrated without needing to lift heavy jugs.
            </p>

            <div className="bg-blue-50/50 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6 my-8">
                <h3 className="text-xl font-bold text-blue-900 mb-2">Pro Tip: Cold vs. Room Temp</h3>
                <p className="text-sm text-blue-700">
                    While an ice-cold glass of water feels amazing, room-temperature water is actually absorbed faster by your body. If you’re feeling overheated, try starting with cool water rather than freezing cold to avoid shocking your system.
                </p>
            </div>

            <p className="pt-6 border-t border-gray-100/50 font-medium text-slate-900">
              Don't let the heat get the best of you. Visit Seaside in Loois, Labrador, for your daily refill, or contact us for reliable door-to-door delivery.
            </p>
          </div>

          <footer className="mt-12 pt-8 border-t border-gray-100/50 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="text-sm text-slate-600">
               © {new Date().getFullYear()} Seaside Purified Water
             </div>
             <div className="flex gap-4">
               <Link href="/contact" className="text-green-700 hover:underline text-sm font-bold">Contact Us</Link>
               <Link href="/privacy" className="text-green-700 hover:underline text-sm font-bold">Privacy Policy</Link>
             </div>
          </footer>
        </article>
      </main>
    </div>
  );
}