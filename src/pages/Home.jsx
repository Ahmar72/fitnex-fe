import Hero from '../sections/Hero.jsx';
import Features from '../sections/Features.jsx';
import Explorer from '../sections/Explorer.jsx';
import Showcase from '../sections/Showcase.jsx';
import Programs from '../sections/Programs.jsx';
import { CTA, FAQ, HowItWorks, Stats } from '../sections/Misc.jsx';
import { useData } from '../context/DataContext.jsx';

export default function Home() {
  const { ready } = useData();
  return (
    <>
      <Hero />
      <Stats />
      <Features />
      {ready && <Explorer />}
      {ready && <Showcase />}
      <HowItWorks />
      {ready && <Programs />}
      <FAQ />
      {ready && <CTA />}
    </>
  );
}
