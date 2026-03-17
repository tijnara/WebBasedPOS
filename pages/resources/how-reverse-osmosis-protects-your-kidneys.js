import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, HeartPulse, Activity } from 'lucide-react';

export default function HealthArticle() {
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
        <article className="bg-white/50 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8 md:p-12" style={{ backgroundColor: '#FFFFFF80' }}>
          <header className="mb-10">
            <Link href="/resources" className="inline-flex items-center text-green-700 hover:text-green-800 font-medium mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Resources
            </Link>
            <div className="flex items-center gap-2 text-red-600 mb-4 font-bold uppercase tracking-widest text-xs">
              <HeartPulse className="w-4 h-4" />
              Health & Wellness
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              The Kidney Connection: How Purified Water Supports Your Internal Filters
            </h1>
          </header>

          <div className="prose prose-green max-w-none text-slate-800 leading-relaxed space-y-6">
            <p className="text-lg">
              Your kidneys are your body's natural filtration system, working tirelessly to remove waste and excess fluids. However, when the water you drink contains high levels of heavy metals, salts, or impurities, your kidneys have to work significantly harder. At <strong>Seaside Purified Water</strong> in Labrador, our <strong>Reverse Osmosis (RO)</strong> process acts as a "pre-filter" for your body.
            </p>

            <h2 className="text-2xl font-bold text-green-950 mt-12 mb-4">The Science of Reverse Osmosis</h2>
            <p>
              Reverse Osmosis is one of the most effective ways to remove dissolved solids that are invisible to the naked eye. This includes contaminants like lead, arsenic, and excess sodium. For residents of <strong>Pangasinan</strong>, where groundwater can sometimes be "hard" (high in calcium and magnesium), RO water provides a lighter alternative that is easier on the digestive and renal systems.
            </p>

            <div className="bg-red-50/50 backdrop-blur-sm p-6 rounded-2xl border border-red-100/50 my-8">
              <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-red-600" />
                Why Purity Matters for Your Kidneys
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-sm text-red-800">
                <li><strong>Reduced Mineral Load:</strong> Lowers the risk of kidney stones by reducing excess calcium intake from hard water.</li>
                <li><strong>Chemical-Free:</strong> Eliminates chlorine and pesticide residues found in some agricultural water tables.</li>
                <li><strong>Optimal Hydration:</strong> Pure water is absorbed more efficiently, aiding the kidneys in flushing out toxins.</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-green-950 mt-12 mb-4">A Family-First Approach</h2>
            <p>
              Protecting kidney health is a lifelong journey that starts in childhood. By providing your children with <strong>Seaside’s 21-stage purified water</strong>, you are establishing healthy habits that protect their vital organs from a young age.
            </p>

            <p className="pt-6 border-t border-gray-100/50 font-medium text-slate-900">
              Investing in purified water is an investment in your family's long-term health. Visit us in Loois, Labrador, to learn more about our process.
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}