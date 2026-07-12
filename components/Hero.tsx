import CompareSlider from './CompareSlider';
import Reveal from './Reveal';

const STATS = [
  { value: '10초', label: '평균 생성 시간' },
  { value: '8가지', label: '인테리어 스타일' },
  { value: '2회', label: '무료 체험' },
];

export default function Hero() {
  return (
    <section id="top" className="relative w-full overflow-hidden">
      {/* 은은한 배경 글로우 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[840px] -translate-x-1/2 rounded-full bg-clay-soft opacity-60 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-20 text-center md:pt-28">
        <Reveal className="flex flex-col items-center">
          <p className="mb-6 flex items-center gap-2 rounded-full border border-line bg-paper-raised px-4 py-1.5 text-xs font-medium tracking-wide text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-clay" />
            AI 인테리어 리디자인 스튜디오
          </p>

          <h1 className="font-display max-w-3xl text-4xl font-bold leading-[1.3] tracking-tight text-ink md:text-6xl md:leading-[1.25]">
            사진 한 장만 넣으면
            <br />
            내집을 <em className="not-italic text-clay">내맘대로 인테리어AI~</em>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-relaxed text-ink-soft md:text-lg">
            방 사진을 올리고 원하는 스타일을 고르면, AI가 10초 만에 공간을 다시
            디자인합니다. 벽과 창문 구조는 그대로, 분위기는 완전히 새롭게.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#studio"
              className="rounded-full bg-ink px-8 py-4 text-sm font-semibold text-paper shadow-lift transition-all duration-300 hover:-translate-y-0.5 hover:bg-clay"
            >
              지금 무료로 디자인하기
            </a>
            <a
              href="#styles"
              className="rounded-full border border-line-strong bg-paper-raised px-8 py-4 text-sm font-semibold text-ink transition-all duration-300 hover:border-ink"
            >
              스타일 둘러보기
            </a>
          </div>

          <dl className="mt-12 flex items-center divide-x divide-line">
            {STATS.map((stat) => (
              <div key={stat.label} className="px-6 sm:px-9">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-xl font-bold text-ink md:text-2xl">
                  {stat.value}
                </dd>
                <dd className="mt-1 text-[11px] tracking-wide text-ink-faint">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* 쇼케이스 슬라이더 */}
        <Reveal delay={150} className="mt-16 w-full max-w-4xl">
          <CompareSlider
            beforeSrc="/living_room_before.png?v=3"
            afterSrc="/living_room_after.png?v=3"
            beforeAlt="리디자인 전 거실"
            afterAlt="재팬디 스타일로 리디자인된 거실"
            priority
          />
          <p className="mt-4 text-xs text-ink-faint">
            핸들을 좌우로 드래그해 재팬디 스타일 변신을 직접 확인해 보세요.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
