import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Microscope, ClipboardCheck, ShieldCheck, HelpCircle } from 'lucide-react';

export default function WaterTestingImportance() {
  return (
      <>
        <style>{`
        .responsive-bg {
          background-image: url('/the-importance-of-regular-water-testingmob.png');
        }
        @media (min-width: 768px) {
          .responsive-bg {
            background-image: url('/the-importance-of-regular-water-testing.png');
          }
        }
      `}</style>

        <div
            className="min-h-screen text-slate-800 font-sans selection:bg-lime-200 responsive-page bg-cover bg-center bg-no-repeat bg-fixed responsive-bg"
        >
          <Head>
            <title>The Critical Importance of Regular Water Testing | Seaside</title>
            <meta name="description" content="Learn why continuous water testing is essential for ensuring water safety and how Seaside adheres to strict quality standards in Labrador, Pangasinan." />
          </Head>

          <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
            <Link href="/resources" className="inline-flex items-center text-green-700 hover:text-green-800 font-medium mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Resources
            </Link>

            <article
                className="rounded-3xl shadow-lg p-8 md:p-12 backdrop-blur-sm"
                style={{ backgroundColor: '#FFFFFF80' }}
            >
              <header className="mb-10">
                <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
                  Beyond the Filter: The Critical Role of Regular Water Testing
                </h1>
                <div className="flex items-center text-sm text-slate-500">
                  <span>By Seaside Editorial Team</span>
                  <span className="mx-2">•</span>
                  <span>7 min read</span>
                </div>
              </header>

              <div className="space-y-8 text-slate-700 leading-relaxed text-lg">
                <p>
                  At Seaside Purified Water Refilling Station, our state-of-the-art 21-stage purification system is the heart of our operation. However, we believe that true quality assurance doesn't end with the equipment. It is a continuous, verifiable commitment. For our valued customers in Labrador, Pangasinan, the safety of their drinking water is guaranteed not just by our advanced filters, but by our rigorous, multi-layered testing protocols.
                </p>
                <p>
                  A water filter is only as good as its last check-up. Water sources can change, filters can degrade, and unforeseen contaminants can appear. Without regular testing, a water refilling station is operating on faith, not science. This is a risk we are unwilling to take with your family's health. Every drop of water you consume should be backed by scientific verification.
                </p>

                <h2 className="text-2xl font-bold text-green-900 mt-8 mb-4">Adherence to National Health Standards</h2>
                <p>
                  In the Philippines, water refilling stations are mandated to comply with the Philippine National Standards for Drinking Water (PNSDW). This comprehensive code of practice outlines the maximum acceptable levels for various physical, chemical, and microbiological parameters. At Seaside, we view these regulations not as a bureaucratic hurdle, but as the absolute minimum standard. We conduct tests more frequently and for more parameters than legally required because we believe in proactive safety and exceeding expectations. Our commitment goes beyond mere compliance; it's about delivering "Pure Trust."
                </p>

                <div className="bg-slate-50/50 p-6 rounded-2xl my-8 backdrop-blur-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                    <Microscope className="w-6 h-6 mr-2 text-blue-600" />
                    What We Test For: A Scientific Breakdown
                  </h3>
                  <p className="mb-4">Our testing regimen covers a broad spectrum of potential contaminants and water characteristics:</p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 mt-1 text-green-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-800">Microbiological Contaminants</h4>
                        <p className="text-sm">This is the most critical test for immediate health and safety. We rigorously screen for indicator organisms like Total Coliform, Fecal Coliform, and specifically <em>Escherichia coli (E. coli)</em>. The presence of these bacteria is a direct and alarming indicator of fecal contamination, which can lead to serious waterborne illnesses such as cholera, typhoid, and severe gastroenteritis. Our multi-barrier approach, including advanced UV and Ozone sterilization stages, is specifically designed to obliterate these pathogens, and our regular lab tests serve as the ultimate verification that the system is working perfectly, ensuring your water is biologically safe.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 mt-1 text-green-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-800">Total Dissolved Solids (TDS)</h4>
                        <p className="text-sm">TDS measures the combined concentration of all inorganic and organic substances dissolved in the water, including minerals, salts, and metals. Our industrial-grade Reverse Osmosis system is designed to drastically lower TDS by removing up to 99% of these dissolved impurities. We test our TDS levels daily to ensure the RO membrane is functioning at peak efficiency. For context, typical tap water in Pangasinan might have a TDS of 150-300 ppm (parts per million), while Seaside's purified water consistently measures under 10 ppm, indicating exceptional purity.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 mt-1 text-green-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-800">pH Level</h4>
                        <p className="text-sm">The pH level measures how acidic or alkaline the water is on a scale of 0 to 14, with 7 being neutral. Our purification process includes a final polishing stage with alkaline and bio-ceramic filters. This not only improves the taste but also raises the pH to a slightly alkaline level (typically 7.2-7.8), which many health experts believe helps balance the body's acidity. We meticulously test the pH to ensure a consistent, pleasant taste and optimal health benefits.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 mt-1 text-green-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-800">Heavy Metals and Chemicals</h4>
                        <p className="text-sm">Beyond general TDS, our comprehensive annual testing specifically targets dangerous heavy metals like lead, arsenic, cadmium, and mercury, which can leach into water from old pipes or industrial pollution. We also test for agricultural chemicals, pesticides, and chlorine byproducts. The effectiveness of our carbon filters and RO membranes is validated by the consistent absence of these harmful substances in our final product water.</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <h2 className="text-2xl font-bold text-green-900 mt-8 mb-4">Our Two-Tier Testing Protocol: A Commitment to Excellence</h2>
                <p>
                  To ensure end-to-end quality and maintain the highest standards of purity, we employ a rigorous two-tier approach to water testing. This layered verification process leaves no room for error.
                </p>
                <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-2">1. Daily In-House Monitoring and Quality Control</h3>
                <p>
                  Every morning, before our station opens its doors, our trained and certified technicians perform a series of meticulous in-house checks. Using highly calibrated digital meters, they test the TDS and pH levels of the water in our storage tanks. This provides us with an immediate, real-time snapshot of our system's performance. If the TDS level fluctuates even slightly above our strict internal baseline, or if the pH is not within our optimal range, production is immediately halted. The RO membranes are then inspected, backwashed, or replaced, and the entire system is re-calibrated until the water meets our stringent internal quality benchmarks. This daily vigilance is our first line of defense.
                </p>

                <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-2">2. Monthly Independent Third-Party Laboratory Analysis</h3>
                <p>
                  In addition to our daily internal checks, we submit water samples every month to a DOH-accredited, independent third-party laboratory. This external analysis provides an unbiased, comprehensive report on the microbiological safety of our water. These independent scientists conduct deep microbiological cultures to ensure absolutely zero coliform or E. coli are present in our product water. We proudly display these updated health certificates in our Loois, Labrador station for all our customers to see. This transparency and external validation are a core part of our "Pure Trust" promise, assuring you that our claims are backed by science.
                </p>

                <h2 className="text-2xl font-bold text-green-900 mt-8 mb-4">The Benefits of Verifiable Purity for Your Family</h2>
                <p>
                  Choosing Seaside means choosing water that is consistently tested and proven safe. This translates directly into tangible benefits for your family's health:
                </p>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>Protection from Waterborne Illnesses:</strong> Our rigorous testing ensures you are protected from bacteria and viruses that cause stomach upsets, diarrhea, and more serious diseases.</li>
                  <li><strong>Reduced Exposure to Harmful Chemicals:</strong> You can be confident that your water is free from chlorine, pesticides, and industrial pollutants.</li>
                  <li><strong>Peace of Mind:</strong> Knowing your drinking water is of the highest quality allows you to focus on what matters most – your family's well-being.</li>
                  <li><strong>Better Taste and Odor:</strong> Consistently pure water means consistently great-tasting water, encouraging better hydration habits for everyone.</li>
                </ul>

                {/* --- FAQ SECTION --- */}
                <div className="bg-slate-50/50 p-6 rounded-2xl my-8 backdrop-blur-sm">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <HelpCircle className="w-7 h-7 mr-3 text-green-600" />
                    Water Testing FAQs
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-slate-800 text-lg">Why is third-party testing so important?</h4>
                      <p className="text-slate-700 mt-1">Third-party testing provides an unbiased, independent verification of our water quality. It adds an extra layer of assurance that our internal quality control measures are effective and that our water consistently meets or exceeds national safety standards, building greater trust with our customers.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-lg">Can I see Seaside's latest water test results?</h4>
                      <p className="text-slate-700 mt-1">Absolutely! We believe in complete transparency. Our latest DOH-accredited laboratory test results are proudly displayed at our station in Loois, Labrador. We encourage all our customers to review them and ask any questions they may have.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-lg">How does water testing help maintain the 21-stage system?</h4>
                      <p className="text-slate-700 mt-1">Regular testing acts as a diagnostic tool. By continuously monitoring parameters like TDS and pH, we can detect any subtle changes that might indicate a filter needs replacement, an RO membrane needs cleaning, or a UV lamp is losing effectiveness. This proactive approach ensures our 21-stage system always operates at peak performance.</p>
                    </div>
                  </div>
                </div>

                <p className="font-medium text-slate-900 text-center pt-8">
                  When you choose Seaside, you're not just choosing filtered water; you're choosing tested, verified, and certified-safe hydration. Your family's health is our highest priority.
                </p>
              </div>
            </article>
          </main>
        </div>
      </>
  );
}