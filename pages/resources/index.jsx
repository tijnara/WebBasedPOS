import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Droplets, Shield, Sun, Snowflake, Truck, Microscope, HeartPulse, AlertTriangle } from 'lucide-react';

const articles = [
  {
    title: "Why 21 Stages Matter: The Science of Pure Water in Labrador",
    href: "/resources/benefits-of-21-stage-purified-water",
    description: "Discover why our 21-stage purification process is the gold standard for drinking water in Labrador, Pangasinan.",
    icon: Droplets
  },
  {
    title: "How to Clean and Maintain Your Water Containers",
    href: "/resources/maintaining-your-water-containers-at-home",
    description: "Learn expert tips on maintaining your 5-gallon slim and round water containers to ensure your purified water stays fresh and safe.",
    icon: Shield
  },
  {
    title: "Summer Hydration Tips for Labrador Families",
    href: "/resources/staying-hydrated-in-labrador-summer-tips",
    description: "Expert advice on staying hydrated during the intense summer heat in Labrador, Pangasinan.",
    icon: Sun
  },
  {
    title: "Why Purified Ice is a Must for Labrador Businesses",
    href: "/resources/purified-ice-why-it-is-safer-for-your-business",
    description: "Discover why using Seaside's 21-stage purified ice is essential for food safety and customer satisfaction.",
    icon: Snowflake
  },
  {
    title: "Trusted Water Delivery in Labrador",
    href: "/resources/why-seaside-is-the-trusted-water-delivery-in-labrador",
    description: "Discover why Seaside is the leading door-to-door purified water delivery service in Labrador, Pangasinan.",
    icon: Truck
  },
  {
    title: "The Importance of Regular Water Testing",
    href: "/resources/the-importance-of-regular-water-testing",
    description: "Learn how Seaside maintains the highest safety standards through regular testing and 21-stage filtration.",
    icon: Microscope
  },
  {
    title: "Purified Water and Kidney Health",
    href: "/resources/how-reverse-osmosis-protects-your-kidneys",
    description: "Discover how purified water helps reduce the workload on your kidneys by removing harmful contaminants.",
    icon: HeartPulse
  },
  {
    title: "Signs Your Home Water Dispenser Needs Cleaning",
    href: "/resources/signs-your-home-water-dispenser-needs-cleaning",
    description: "Identify the warning signs that your home water dispenser needs cleaning to keep your water safe.",
    icon: AlertTriangle
  }
];

export default function ResourcesPage() {
  return (
      <>
        <style>{`
        .responsive-bg {
          background-image: url('/resourceswallpapermob.png');
        }
        @media (min-width: 768px) {
          .responsive-bg {
            background-image: url('/resourceswallpaper.png');
          }
        }
      `}</style>

        <div
            className="min-h-screen font-sans responsive-page bg-cover bg-center bg-no-repeat bg-fixed responsive-bg"
        >
          <div className="max-w-5xl mx-auto p-6 md:p-12">
            <Head>
              <title>Resources | Seaside Purified Water Labrador</title>
              <meta name="description" content="Explore articles and resources about water purity, health, and local hydration tips from Seaside." />
            </Head>

            <div className="mb-12 text-center bg-white/50 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-white/20" style={{ backgroundColor: '#FFFFFF80' }}>
              <Link href="/" className="inline-flex items-center text-green-700 hover:text-green-900 font-semibold mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
              <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 mb-3 tracking-tight">
                 <span style={{
                   background: 'linear-gradient(to right, #8DB600, #0d9488)', // Apple green to teal
                   WebkitBackgroundClip: 'text',
                   WebkitTextFillColor: 'transparent',
                   backgroundClip: 'text',
                   color: 'transparent'
                 }}>SEASIDE</span> Knowledge Hub
              </h1>
              <p className="text-lg text-slate-800 max-w-2xl mx-auto">
                A collection of articles to help you understand the importance of pure water for your family's health and well-being.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map(article => {
                const Icon = article.icon;
                return (
                    <Link
                        key={article.href}
                        href={article.href}
                        className="group block bg-white/50 backdrop-blur-sm p-7 rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                        style={{ backgroundColor: '#FFFFFF80' }}
                    >
                      <div className="mb-4">
                        <Icon className="w-8 h-8 text-green-500 group-hover:text-green-600 transition-colors" />
                      </div>
                      <h2 className="text-xl font-bold text-green-900 mb-2 leading-snug">
                        {article.title}
                      </h2>
                      <p className="text-slate-700 text-sm mb-6">
                        {article.description}
                      </p>
                      <span className="inline-flex items-center text-green-800 font-semibold text-sm">
                    Read Article <BookOpen className="w-4 h-4 ml-2" />
                  </span>
                    </Link>
                )
              })}
            </div>
          </div>
        </div>
      </>
  );
}