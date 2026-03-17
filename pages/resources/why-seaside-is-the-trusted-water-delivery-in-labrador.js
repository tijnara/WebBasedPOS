import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Truck, Clock, ShieldCheck } from 'lucide-react';

export default function DeliveryArticle() {
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
          <header className="mb-10 text-center">
            <Link href="/resources" className="inline-flex items-center text-green-700 hover:text-green-800 font-medium mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Resources
            </Link>
            <div className="flex justify-center mb-4"><Truck className="w-12 h-12 text-green-600" /></div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Why Seaside is the Trusted Name for Water Delivery in Labrador
            </h1>
            <p className="text-sm text-slate-600 mt-6 italic">Pure Water, Delivered Straight to Your Doorstep.</p>
          </header>

          <div className="prose prose-green max-w-none text-slate-800 leading-relaxed space-y-6">
            <p className="text-lg">
              In the busy households of <strong>Labrador, Pangasinan</strong>, convenience is just as important as quality. Carrying heavy 5-gallon containers from a station to your home is a chore of the past. At <strong>Seaside Purified Water Refilling Station</strong>, we’ve built a reputation as the most reliable door-to-door delivery service in the municipality.
            </p>

            <h2 className="text-2xl font-bold text-green-950 mt-12 mb-4">Promptness You Can Count On</h2>
            <p>
              We understand that running out of drinking water is a major inconvenience for any family. That is why our delivery team in <strong>Loois</strong> is optimized for speed. Whether you are located in the town proper or neighboring barangays, we strive to fulfill orders within hours of your message.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
              <div className="bg-lime-50/50 backdrop-blur-sm p-6 rounded-2xl border border-lime-100/50 flex flex-col items-center text-center">
                <Clock className="w-8 h-8 text-green-700 mb-2" />
                <h4 className="font-bold text-green-900">Flexible Scheduling</h4>
                <p className="text-sm">We deliver during peak morning and afternoon hours to match your household routine.</p>
              </div>
              <div className="bg-blue-50/50 backdrop-blur-sm p-6 rounded-2xl border border-blue-100/50 flex flex-col items-center text-center">
                <ShieldCheck className="w-8 h-8 text-blue-700 mb-2" />
                <h4 className="font-bold text-blue-900">Hygienic Handling</h4>
                <p className="text-sm">Our riders are trained to handle your containers with care, ensuring the caps and seals remain untouched.</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-green-950 mt-12 mb-4">Serving the Entire Labrador Community</h2>
            <p>
              From residential homes to local businesses and schools, Seaside provides <strong>21-stage purified water</strong> wherever it is needed. Our delivery route covers the broad expanse of Labrador, ensuring that every family has access to safe, healthy hydration without the physical strain of transport.
            </p>

            <p className="pt-6 border-t border-gray-100/50 font-medium text-slate-900">
              Ready to schedule your next delivery? Contact Seaside via our official Facebook page or message us directly to experience the best water service in Labrador.
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}