// pages/_app.js
import '../styles/globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

function MyApp({ Component, pageProps }) {
  return (
    <main className={inter.className}>
      <Component {...pageProps} />
    </main>
  );
}

import { DashboardProvider } from '../contexts/DashboardContext';

function MyApp({ Component, pageProps }) {
  return (
    <DashboardProvider>
      <Component {...pageProps} />
    </DashboardProvider>
  );
}

export default MyApp;