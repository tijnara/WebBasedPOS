import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Microscope, ClipboardCheck } from 'lucide-react';

export default function TestingArticle() {
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
            <div className="flex items-center gap-2 text-blue-600 mb-4 font-bold uppercase tracking-widest text-xs">
              <Microscope className="w-4 h-4" />
              Quality Assurance
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Beyond the Filter: The Critical Role of Regular Water Testing
            </h1>
          </header>

          <div className="prose prose-green max-w-none text-slate-800 leading-relaxed space-y-6">
            <p className="text-lg">
              At <strong>Seaside Purified Water</strong>, we believe that quality is not a one-time achievement, but a continuous commitment. For our customers in <strong>Labrador, Pangasinan</strong>, the safety of their drinking water is guaranteed not just by our <strong>21-stage filtration system</strong>, but by our rigorous testing protocols.
            </p>

            <h2 className="text-2xl font-bold text-green-950 mt-12 mb-4">Compliance with Health Standards</h2>
            <p>
              Operating a water refilling station in the Philippines requires strict adherence to the Philippine National Standards for Drinking Water (PNSDW). Regular microbiological and physical-chemical tests are mandatory. At Seaside, we go beyond simple compliance; we treat every test as an opportunity to ensure our "Pure Trust" promise is kept.
            </p>

            <div className="bg-slate-50/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/50 my-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                <ClipboardCheck className="w-5 h-5 mr-2 text-primary" />
                What We Monitor Daily
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <span className="font-bold text-primary">TDS (Total Dissolved Solids):</span> We monitor the mineral concentration levels daily to ensure our reverse osmosis system is functioning at 100% efficiency.
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="font-bold text-primary">pH Levels:</span> Maintaining a balanced pH is essential for the clean, crisp taste that Seaside is known for in Loois.
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="font-bold text-primary">Ozone Concentration:</span> Proper ozonation is the final guard against bacteria and viruses.
                </li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-green-950 mt-12 mb-4">Professional Laboratory Analysis</h2>
            <p>
              In addition to our in-house checks, we submit water samples to accredited third-party laboratories. These tests verify the absence of coliform bacteria and other harmful microorganisms. We proudly display our updated health certificates at our station in <strong>Labrador</strong>, so you can see the results for yourself.
            </p>

            <p className="font-medium text-slate-900">
              When you choose Seaside, you are choosing a partner dedicated to science-backed safety. Your health is our priority.
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}