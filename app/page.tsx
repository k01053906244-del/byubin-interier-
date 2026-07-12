import Header from '@/components/Header';
import Hero from '@/components/Hero';
import StyleGallery from '@/components/StyleGallery';
import HowItWorks from '@/components/HowItWorks';
import Studio from '@/components/Studio';
import Faq from '@/components/Faq';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <StyleGallery />
        <HowItWorks />
        <Studio />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
