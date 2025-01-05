// pages/_app.js
import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { DashboardProvider } from '../contexts/DashboardContext';

const inter = Inter({ subsets: ['latin'] });

function MyApp({ Component, pageProps }) {
  return (
    <DashboardProvider>
      <main className={inter.className}>
        <Component {...pageProps} />
      </main>
    </DashboardProvider>
  );
}

export default MyApp;