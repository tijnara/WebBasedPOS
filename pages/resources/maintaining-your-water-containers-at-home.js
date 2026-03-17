import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, AlertTriangle, Shield } from 'lucide-react';

export default function ContainerMaintenanceArticle() {
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
            <div className="flex items-center gap-2 text-green-600 mb-4 font-bold uppercase tracking-widest text-xs">
              <Shield className="w-4 h-4" />
              Hygiene & Safety Guide
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Maintaining Your Water Containers at Home: A Guide for Labrador Families
            </h1>
            <p className="text-sm text-slate-600 mt-6 italic">
              Last Updated: March 2024 • 8 min read
            </p>
          </header>

          <div className="prose prose-green max-w-none text-slate-800 leading-relaxed space-y-6">
            <p className="text-lg">
              At <strong>Seaside Purified Water Refilling Station</strong>, we take immense pride in our 21-stage filtration process. However, the safety of your drinking water doesn't end at our station in Loois, Labrador. Once you take your 5-gallon slim or round containers home, maintaining their hygiene is the final step in protecting your family's health.
            </p>

            <h2 className="text-2xl font-bold text-green-950 mt-12 mb-4">Why Container Hygiene Matters</h2>
            <p>
              Even the purest water can become contaminated if stored in a dirty container. Over time, moisture left in empty jugs can encourage the growth of biofilm or bacteria. For our customers in <strong>Labrador and neighboring Pangasinan municipalities</strong>, following a strict cleaning routine ensures that the "crystal clear" quality you expect from Seaside remains intact until the very last drop.
            </p>

            {/* Practical Steps Box */}
            <div className="bg-lime-50/50 backdrop-blur-sm rounded-2xl border border-lime-100/50 p-6 my-8">
              <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                The 3-Step Home Cleaning Routine
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-green-800">1. Pre-Refill Rinse</h4>
                  <p className="text-sm">Before bringing your jugs back to Seaside, rinse them with a small amount of purified water. Avoid using tap water for the final rinse as it may introduce minerals or chlorine residues.</p>
                </div>
                <div>
                  <h4 className="font-bold text-green-800">2. External Sanitization</h4>
                  <p className="text-sm">Wipe the outside of the container, especially the handle and the neck, with a food-safe disinfectant. This prevents dirt from transferring to our filling taps.</p>
                </div>
                <div>
                  <h4 className="font-bold text-green-800">3. Proper Storage</h4>
                  <p className="text-sm">Store your containers in a cool, dry place away from direct sunlight. Sunlight can promote the growth of algae, even in purified water.</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-green-950 mt-12 mb-4">Cleaning the 5-Gallon Slim vs. Round Jugs</h2>
            <p>
              Whether you prefer the space-saving <strong>Slim container</strong> with a faucet or the traditional <strong>Round jug</strong>, each has specific needs:
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong>Slim Containers:</strong> Pay special attention to the faucet (gripo). Detach it once a month and soak it in a mild vinegar-water solution to prevent mineral buildup and bacteria.</li>
              <li><strong>Round Containers:</strong> These are easier to scrub internally with a long-handled brush. Ensure the brush is used <em>only</em> for your water containers to avoid cross-contamination.</li>
            </ul>

            {/* Warning Section */}
            <div className="bg-red-50/50 backdrop-blur-sm rounded-2xl border border-red-100/50 p-6 my-8">
              <h3 className="text-xl font-bold text-red-800 mb-2 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                What to Avoid
              </h3>
              <p className="text-sm text-red-700">
                Never use strong-scented dish soaps or industrial bleach. These can leave behind chemical residues that alter the taste of your water and may be harmful if swallowed. If you notice persistent green spots (algae) or a "musty" smell, it is time to replace the container entirely.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-green-950 mt-12 mb-4">Our Commitment at Seaside</h2>
            <p>
              While we encourage home maintenance, remember that <strong>Seaside Purified Water Refilling Station</strong> provides professional sanitization before every refill. Our team uses high-grade, food-safe sanitizing solutions to ensure your containers are ready for our 21-stage purified water.
            </p>

            <p className="pt-6 border-t border-gray-100/50 font-medium text-slate-900">
              Need a new container or a professional deep clean? Visit us in Loois, Labrador, Pangasinan, or message us for delivery.
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