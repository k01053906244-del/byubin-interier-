import Reveal from './Reveal';

const STEPS = [
  {
    no: '01',
    title: '사진 업로드',
    desc: '바꾸고 싶은 공간의 사진을 올려 주세요. 브라우저에서 자동으로 최적화되어 안전하게 전송됩니다.',
  },
  {
    no: '02',
    title: '공간과 스타일 선택',
    desc: '거실부터 원룸까지 6가지 공간, 모던부터 한옥까지 8가지 스타일. 취향대로 조합하세요.',
  },
  {
    no: '03',
    title: '10초 뒤, 새로운 방',
    desc: '벽·창문·구도는 그대로 두고 가구와 조명, 색감만 바뀐 고화질 렌더링이 완성됩니다.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-clay">
            How it works
          </p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
            세 단계면 충분합니다
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.no} delay={i * 100}>
              <div className="flex h-full flex-col rounded-2xl border border-line bg-paper-raised p-7">
                <span className="font-display text-sm font-bold text-clay">
                  {step.no}
                </span>
                <h3 className="font-display mt-5 text-xl font-bold text-ink">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {step.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
