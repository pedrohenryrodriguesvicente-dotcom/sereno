import NavBar from '@/components/ui/NavBar';
import FrameSequence from '@/components/ui/FrameSequence';
import HeroOverlays from '@/components/sections/HeroOverlays';
import Intro from '@/components/sections/Intro';
import Cards from '@/components/sections/Cards';
import PowerOn from '@/components/sections/PowerOn';
import Specs from '@/components/sections/Specs';
import Signature from '@/components/sections/Signature';
import Footer from '@/components/sections/Footer';

const TOTAL_FRAMES = 150;

export default function Home() {
  return (
    <main className="relative bg-paper">
      <NavBar />

      {/* Hero: en móvil el scrubbing completo se recorre en 300vh (menos
          scroll de dedo); en desktop se mantienen los 500vh exactos. */}
      <FrameSequence
        id="inicio"
        framesPath="/frames/loop"
        totalFrames={TOTAL_FRAMES}
        heightClassName="h-[300vh] md:h-[500vh]"
      >
        <HeroOverlays />
      </FrameSequence>

      <Intro />
      <Cards />
      <PowerOn />
      <Specs />
      <Signature />
      <Footer />
    </main>
  );
}
