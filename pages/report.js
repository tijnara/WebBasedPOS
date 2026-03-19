import dynamic from 'next/dynamic';

// Dynamically import the ReportPage so Chart.js isn't bundled on the initial load
const ReportPage = dynamic(() => import('../src/components/pages/ReportPage'), {
    ssr: false
});

export default function Report() {
    return <ReportPage />;
}