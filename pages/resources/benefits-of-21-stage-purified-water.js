import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Droplets } from 'lucide-react';

export default function Article() {
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
      <article className="max-w-4xl mx-auto p-6 md:p-12 bg-white/50 backdrop-blur-sm min-h-screen shadow-lg" style={{ backgroundColor: '#FFFFFF80' }}>
        <Head>
          <title>Benefits of 21-Stage Purified Water | Seaside Labrador</title>
          <meta name="description" content="Discover why Seaside's 21-stage purification process is the gold standard for drinking water in Labrador, Pangasinan." />
        </Head>

        <Link href="/resources" className="inline-flex items-center text-green-700 hover:text-green-800 font-medium mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Resources
        </Link>

        <h1 className="text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
          Why 21 Stages Matter: The Science of Pure Water in Labrador
        </h1>

        <div className="prose prose-green max-w-none text-slate-800 leading-relaxed space-y-6">
          <p className="text-lg font-medium">
            When it comes to your family's health, not all water is created equal. At Seaside Purified Water Refilling Station in Loois, Labrador, we employ a rigorous 21-stage purification process to ensure every drop is crystal clear and safe.
          </p>

          <h2 className="text-2xl font-bold text-green-900 mt-8">The Journey to Purity</h2>
          <p>
            Our process starts with multi-media filtration to remove large particles and sediments. This is followed by activated carbon stages that eliminate chlorine and organic chemicals that affect taste and odor.
          </p>

          <div className="bg-lime-50/50 backdrop-blur-sm p-6 rounded-2xl border border-lime-100/50">
            <h3 className="text-xl font-bold text-green-800 mb-3 flex items-center">
              <Droplets className="mr-2" /> Key Benefits for Labrador Families:
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Elimination of Contaminants:</strong> Removes 99.9% of bacteria, viruses, and heavy metals common in local groundwater.</li>
              <li><strong>Consistent Quality:</strong> Unlike basic filters, our 21-stage system provides a multi-layered defense against pollutants.</li>
              <li><strong>Improved Taste:</strong> By stripping away impurities, we provide water that enhances the flavor of your cooking and coffee.</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-green-900 mt-8">Reverse Osmosis: The Heart of Seaside</h2>
          <p>
            At the center of our station is the industrial Reverse Osmosis (RO) membrane. This stage forces water through a microscopic semi-permeable membrane, allowing only pure H2O molecules to pass through while flushing away dissolved solids and salts.
          </p>

          <p>
            For the residents of Labrador and neighboring municipalities, this means peace of mind. Whether you are mixing formula for a newborn or simply staying hydrated during a hot Pangasinan afternoon, Seaside Purified Water is the trusted choice.
          </p>
        </div>
      </article>
    </div>
  );
}