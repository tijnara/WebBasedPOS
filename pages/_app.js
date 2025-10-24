import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  // Render the page component provided by Next.js
  return <Component {...pageProps} />;
}
