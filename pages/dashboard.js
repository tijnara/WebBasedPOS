import dynamic from 'next/dynamic';
const DashboardPage = dynamic(() => import('../src/components/pages/DashboardPage'), { ssr: false });
export default DashboardPage;

