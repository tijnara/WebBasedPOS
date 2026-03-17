import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Droplet, ShieldAlert, CheckCircle } from 'lucide-react';

export default function MaintainingContainers() {
  return (
    <div
      className="min-h-screen text-slate-800 font-sans selection:bg-lime-200"
      style={{
        backgroundImage: "url('/seaside_bg2.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <Head>
        <title>The Complete Guide to Maintaining Your Water Containers | Seaside</title>
        <meta name="description" content="Learn how to properly clean, sanitize, and store your 5-gallon water containers at home to ensure your Seaside purified water stays fresh and safe." />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <Link href="/resources" className="inline-flex items-center text-green-700 hover:text-green-800 font-medium mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Resources
        </Link>

        <article
          className="rounded-3xl shadow-lg border border-white/20 p-8 md:p-12 backdrop-blur-sm"
          style={{ backgroundColor: '#FFFFFFBF' }}
        >
          <header className="mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
              The Complete Guide to Maintaining Your Water Containers at Home
            </h1>
            <div className="flex items-center text-sm text-slate-500">
              <span>By Seaside Editorial Team</span>
              <span className="mx-2">•</span>
              <span>4 min read</span>
            </div>
          </header>

          <div className="space-y-8 text-slate-700 leading-relaxed text-lg">
            <p>
              At Seaside Water Refilling Station, we go to extraordinary lengths to ensure that the water leaving our 21-stage filtration system is flawlessly pure. However, maintaining that purity doesn't stop once the water leaves our facility in Labrador, Pangasinan. The way you handle, store, and maintain your 5-gallon rounds and slim containers at home plays a massive role in the quality of the water your family drinks.
            </p>
            <p>
              Many people assume that because the water inside the jug is purified, the jug itself doesn't need much attention. Unfortunately, this is a dangerous myth. Microscopic bacteria, airborne dust, and even algae can compromise your water if your containers are not properly cared for. In this guide, we break down exactly how to maintain your water containers to keep your Seaside water tasting crisp and fresh.
            </p>

            <h2 className="text-2xl font-bold text-green-900 mt-8 mb-4">The Invisible Enemy: Biofilm and Algae</h2>
            <p>
              If you’ve ever felt a slippery, slimy coating on the inside of a water bottle, you’ve encountered a biofilm. Biofilms are complex colonies of bacteria that excrete a sticky substance to anchor themselves to the plastic walls of your container. While our 21-stage process removes bacteria from the water, opening a container exposes it to the air in your home, which naturally carries microscopic organic matter.
            </p>
            <p>
              Furthermore, if your water container is exposed to direct sunlight, it creates a greenhouse effect. Even trace amounts of harmless natural organic matter can rapidly bloom into green algae when exposed to warmth and UV light from the sun. Once algae or biofilm take hold, simply rinsing the bottle with water will not remove them.
            </p>

            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50 my-8 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-blue-900 mb-3 flex items-center">
                <ShieldAlert className="w-6 h-6 mr-2 text-blue-600" /> 
                How to Store Your Water Containers
              </h3>
              <p className="mb-4">Proper storage is your first line of defense against contamination. Follow these golden rules for storing your Seaside water jugs:</p>
              <ul className="list-disc pl-6 space-y-3">
                <li><strong>Keep them in the dark:</strong> Never store your water containers in direct sunlight or near a window. UV light accelerates the growth of algae. Store them in a cool, shaded area like a pantry or a shaded corner of your kitchen.</li>
                <li><strong>Keep them away from strong odors:</strong> Polycarbonate and PET plastics are slightly permeable over time. Storing your water near strong-smelling substances like gasoline, paint, strong cleaning chemicals, or even pungent cooking ingredients can cause the water to absorb those odors and alter its taste.</li>
                <li><strong>Elevate them:</strong> Do not store your water containers directly on bare concrete or dirt floors, as temperature fluctuations can cause condensation and attract pests. Place them on a wooden pallet, a dedicated plastic rack, or a tiled surface.</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-green-900 mt-8 mb-4">How to Clean Your Containers Before Refilling</h2>
            <p>
              While our staff at Seaside thoroughly washes and sanitizes every container before refilling it, your pre-cleaning efforts at home significantly reduce the risk of deep-seated contamination. Here is a simple, effective way to clean your 5-gallon jugs:
            </p>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-2">Step 1: The Baking Soda Scrub</h3>
            <p>
              Baking soda is a natural, non-toxic abrasive that neutralizes odors. Pour two tablespoons of baking soda and a cup of warm water into the empty container. Cap it securely and shake it vigorously for one minute, ensuring the mixture coats all the interior walls. Dump the mixture out and rinse thoroughly with clean tap water.
            </p>

            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-2">Step 2: The Vinegar Disinfectant</h3>
            <p>
              For a natural disinfectant, white vinegar is excellent. Add one cup of white vinegar and one cup of water to the container. Swirl it around so it coats the entire inside and let it sit for about 10 minutes. Vinegar's acidity kills most common household bacteria and mold spores.
            </p>

            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-2">Step 3: The Final Rinse</h3>
            <p>
              This is the most crucial step. Rinse the container out at least three times with clean water until there is absolutely no smell of vinegar left. Cap the bottle with its original cover to prevent dust from getting in while you transport it back to Seaside for a refill.
            </p>

            <h2 className="text-2xl font-bold text-green-900 mt-8 mb-4">Knowing When to Replace Your Jugs</h2>
            <p>
              No water container lasts forever. Over time, plastic degrades, becomes scratched, and develops micro-abrasions that are impossible to clean properly. Bacteria love to hide in these tiny scratches. As a general rule of thumb, you should replace your 5-gallon rounds or slim jugs every 12 to 18 months, or immediately if you notice any of the following:
            </p>
            <ul className="list-disc pl-6 space-y-3 mt-4">
              <li>The plastic has become heavily clouded or opaque.</li>
              <li>There are visible, deep scratches on the inside of the bottle.</li>
              <li>The bottle has a lingering smell even after a thorough vinegar and baking soda wash.</li>
              <li>The plastic has become brittle or has sustained cracks or leaks.</li>
            </ul>

            <div className="flex items-center p-4 bg-green-50/50 rounded-xl mt-8 border border-green-100/50 backdrop-blur-sm">
              <CheckCircle className="w-8 h-8 text-green-600 mr-4 flex-shrink-0" />
              <p className="text-sm font-medium text-green-900">
                At Seaside, we sell brand new, high-quality, BPA-free containers. If you think it's time for an upgrade, let our staff know during your next visit or delivery!
              </p>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
