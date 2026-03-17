import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Truck, ShieldCheck, Users, Star, HelpCircle } from 'lucide-react';

export default function WhySeasideTrusted() {
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
        <title>Why Seaside is the Most Trusted Water Delivery in Labrador, Pangasinan | Seaside</title>
        <meta name="description" content="Discover why families and businesses in Labrador, Pangasinan choose Seaside for their purified water delivery, ice tubes, and superior customer service." />
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
              Why Seaside is the Most Trusted Water Delivery in Labrador, Pangasinan
            </h1>
            <div className="flex items-center text-sm text-slate-500">
              <span>By Seaside Editorial Team</span>
              <span className="mx-2">•</span>
              <span>7 min read</span>
            </div>
          </header>

          <div className="space-y-8 text-slate-700 leading-relaxed text-lg">
            <p>
              In the bustling, tight-knit community of Labrador, Pangasinan, finding a water refilling station is not difficult. Finding one that you can unequivocally trust with your family's health, however, is a different story. Over the years, Seaside Purified Water Refilling Station has grown from a local business into a household staple. From the meticulous care we take in our purification process to our friendly delivery riders navigating the barangays, Seaside has become synonymous with reliability and purity.
            </p>
            <p>
              But what exactly sets Seaside apart from the rest? Let’s dive into the reasons why hundreds of families and local businesses choose us as their primary hydration partner.
            </p>

            <h2 className="text-2xl font-bold text-green-900 mt-8 mb-4">1. Uncompromising 21-Stage Purification</h2>
            <p>
              While standard refilling stations might use a basic 5-stage or 7-stage filter, Seaside utilizes an industrial-grade <strong>21-stage Reverse Osmosis and UV sterilization system</strong>. We believe that "good enough" is never good enough when it comes to drinking water. Our rigorous multi-stage setup ensures the total elimination of rust, heavy metals, microscopic bacteria, and volatile organic compounds. By the time the water hits your container, it is nothing but crisp, clean, and perfectly balanced hydration. We regularly test our water to ensure it meets and exceeds national health standards, providing you with verifiable peace of mind.
            </p>

            <h2 className="text-2xl font-bold text-green-900 mt-8 mb-4">2. Strict Hygiene and Container Sanitization</h2>
            <p>
              The purest water in the world means nothing if it is stored in a dirty container. At Seaside, our staff undergoes rigorous hygiene training. When you bring your 5-gallon rounds or slim jugs to our station in Loois, they don't just get refilled. They go through a specialized washing station where they are scrubbed, rinsed with purified water, and sanitized. We wear protective gear and seal your bottles immediately to prevent any airborne contamination during transit. Our commitment to cleanliness extends to our delivery vehicles and equipment, ensuring your water remains pristine from our station to your doorstep.
            </p>

            <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100/50 my-8 flex flex-col md:flex-row items-center gap-6 backdrop-blur-sm">
              <div className="flex-shrink-0 bg-white p-4 rounded-full shadow-sm">
                <Truck className="w-12 h-12 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-900 mb-2">Fast, Reliable Door-to-Door Delivery Across Labrador</h3>
                <p>
                  We understand that running out of water disrupts your entire household or business. Our dedicated delivery fleet operates efficiently across Labrador, covering all barangays from Ambuetel to San Jose, to ensure you never go thirsty. Rain or shine, our dedicated delivery personnel are known for their polite demeanor, punctuality, and willingness to carry those heavy 5-gallon jugs right into your kitchen or office. We offer flexible scheduling options to fit your busy life.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-green-900 mt-8 mb-4">3. Complete Product Range for Households and Businesses</h2>
            <p>
              Seaside isn't just for households. We are the trusted partner for local sari-sari stores, restaurants, cafes, and catering services throughout Labrador. Aside from our convenient 5-gallon refills, we supply readily sealed <strong>PET bottles</strong> (perfect for retail, events, and personal use) and <strong>Purified Ice Tubes</strong>. Because our ice is made from the exact same 21-stage purified water, businesses can serve cold beverages without worrying about compromising the taste of the drink or the health of their customers. This comprehensive offering makes us a one-stop shop for all your hydration needs.
            </p>

            <h2 className="text-2xl font-bold text-green-900 mt-8 mb-4">4. Community First, Always: Our Local Commitment</h2>
            <p>
              We are proudly local. Operating out of Labrador means we treat our customers like neighbors—because you are. Our roots are deeply embedded in the Pangasinan community, and we are committed to its well-being. Our Point of Sale (POS) system allows us to offer flexible "Charge to Account" (Utang) setups for our most trusted and long-standing clients, recognizing the realities of local commerce and daily life. We listen to your feedback, adapt our delivery schedules to your needs, and constantly strive to give back to the community through various initiatives. When you choose Seaside, you support a local business that cares about its people.
            </p>

            <h2 className="text-2xl font-bold text-green-900 mt-8 mb-4">What Our Customers Say: Testimonials</h2>
            <div className="bg-yellow-50/50 p-6 rounded-2xl border border-yellow-100/50 my-8 backdrop-blur-sm">
                <div className="space-y-6">
                    <div className="flex items-start">
                        <Star className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0" />
                        <p className="text-slate-700 italic">"Seaside has been our go-to for years. Their water is consistently clean, and the delivery is always on time. Highly recommended for families in Loois!" - Maria S., Loois, Labrador</p>
                    </div>
                    <div className="flex items-start">
                        <Star className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0" />
                        <p className="text-slate-700 italic">"As a small cafe owner, the quality of my ice is crucial. Seaside's purified ice tubes are crystal clear and never affect the taste of my drinks. Plus, their bulk delivery is a lifesaaver!" - John D., Poblacion, Labrador</p>
                    </div>
                    <div className="flex items-start">
                        <Star className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0" />
                        <p className="text-slate-700 italic">"The best water delivery service in Labrador. The staff are always friendly, and the water tastes amazing. It's peace of mind for my family's health." - Elena R., San Jose, Labrador</p>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-green-900 mt-8 mb-4">The Seaside Promise: Pure Trust, Delivered</h2>
            <p>
              Trust is earned drop by drop, and through consistent, reliable service. At Seaside Purified Water Refilling Station, we earn that trust every day by maintaining our machines flawlessly, training our staff meticulously, and delivering your water with a smile. We are more than just a water station; we are a partner in your health and well-being. If you haven't made the switch yet, we invite you to taste the Seaside difference today and join the growing number of satisfied customers across Labrador, Pangasinan.
            </p>

            <hr className="my-12 border-gray-200" />

            {/* --- FAQ SECTION --- */}
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100/50 my-8 backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <HelpCircle className="w-7 h-7 mr-3 text-green-600" />
                    Common Questions About Our Delivery Service
                </h3>
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-slate-800 text-lg">What are your delivery hours?</h4>
                        <p className="text-slate-700 mt-1">Our standard delivery hours are Monday to Saturday, from 8:00 AM to 5:00 PM. We strive to accommodate special requests whenever possible. Please contact us directly for urgent deliveries outside these hours.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-800 text-lg">Which areas in Labrador do you deliver to?</h4>
                        <p className="text-slate-700 mt-1">We proudly offer door-to-door delivery to all barangays within Labrador, Pangasinan, including Loois, Poblacion, San Jose, and more. We also serve some neighboring municipalities. Please inquire with our team for specific service areas.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-800 text-lg">How can I place an order for delivery?</h4>
                        <p className="text-slate-700 mt-1">You can place an order by sending us a message on our official Facebook page, or by calling/texting our dedicated delivery hotline. Our friendly staff will confirm your order and schedule your delivery promptly.</p>
                    </div>
                </div>
            </div>

            <p className="font-medium text-slate-900 text-center pt-8">
              Experience the convenience and purity of Seaside Water Delivery. <Link href="/#contact" className="text-green-600 hover:underline">Place your order today!</Link>
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
