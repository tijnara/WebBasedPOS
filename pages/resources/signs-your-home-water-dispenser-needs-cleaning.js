import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Sparkles } from 'lucide-react';

export default function DispenserHygieneArticle() {
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
            <div className="flex items-center gap-2 text-amber-600 mb-4 font-bold uppercase tracking-widest text-xs">
              <AlertTriangle className="w-4 h-4" />
              Hygiene Alert
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Is Your Dispenser Contaminating Your Water? 5 Warning Signs to Watch For
            </h1>
          </header>

          <div className="prose prose-green max-w-none text-slate-800 leading-relaxed space-y-6">
            <p className="text-lg">
              You buy the best water from <strong>Seaside Labrador</strong>, but if your home dispenser is dirty, you are losing the benefits of purification. Many families in <strong>Pangasinan</strong> forget that the water dispenser (hot/cold unit) requires deep cleaning at least every three months.
            </p>

            <h2 className="text-2xl font-bold text-green-950 mt-12 mb-4">The Red Flags of a Dirty Dispenser</h2>
            
            <div className="space-y-4">
              <div className="flex gap-4 p-4 rounded-xl bg-amber-50/50 backdrop-blur-sm border border-amber-100/50">
                <div className="font-bold text-amber-700">1.</div>
                <div>
                  <h4 className="font-bold text-slate-900">Strange Taste or Odor</h4>
                  <p className="text-sm">If your water suddenly tastes metallic or "swampy," bacteria or mold may have settled in the internal reservoir.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-xl bg-amber-50/50 backdrop-blur-sm border border-amber-100/50">
                <div className="font-bold text-amber-700">2.</div>
                <div>
                  <h4 className="font-bold text-slate-900">Slow Flow Rate</h4>
                  <p className="text-sm">Mineral buildup or biofilm can clog the spigot, causing the water to dispense much slower than usual.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-xl bg-amber-50/50 backdrop-blur-sm border border-amber-100/50">
                <div className="font-bold text-slate-900">3.</div>
                <div>
                  <h4 className="font-bold text-slate-900">Visible Particles</h4>
                  <p className="text-sm">Black or green specks in your glass are a major warning sign of algae growth inside the pipes.</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-green-950 mt-12 mb-4">Simple Maintenance Tips</h2>
            <p>
              To ensure your <strong>21-stage purified water</strong> stays fresh, wipe the "seat" where the bottle rests every time you change a jug. Every few months, drain the entire unit and flush it with a solution of water and white vinegar to descale and sanitize the interior.
            </p>

            <div className="bg-lime-50/50 backdrop-blur-sm p-6 rounded-2xl border border-lime-100/50 flex items-start gap-4">
                <Sparkles className="w-6 h-6 text-green-600 shrink-0" />
                <p className="text-sm text-green-900 italic">
                  <strong>Pro Tip:</strong> Keep your dispenser away from direct windows. Sunlight hitting the bottle can accelerate the growth of green algae, even in high-quality purified water.
                </p>
            </div>

            <p className="pt-6 border-t border-gray-100/50 font-medium text-slate-900">
              Maintain your home equipment to keep the Seaside standard alive in your kitchen. For any questions, visit our team in Loois, Labrador!
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}