import Reveal from './Reveal';
import StyleCards from './StyleCards';

export default function StyleGallery() {
  return (
    <section id="styles" className="w-full border-t border-line bg-paper-raised">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-clay">
            Styles
          </p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
            여덟 가지 시선으로 보는 우리 집
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft md:text-base">
            정제된 미니멀부터 한옥의 고요함까지. 같은 공간이 스타일에 따라 어떻게
            달라지는지 골라 보세요.
          </p>
        </Reveal>

        <StyleCards />
      </div>
    </section>
  );
}
