import Reveal from './Reveal';

const FAQS = [
  {
    q: '무료로 몇 번까지 사용할 수 있나요?',
    a: '누구나 2회까지 무료로 체험할 수 있습니다. 이후에는 "내 API 키로 무제한 사용" 모드를 켜고 Google AI Studio에서 1분 만에 무료 발급받은 개인 API 키를 등록하면 제한 없이 이용할 수 있습니다.',
  },
  {
    q: '내 방 구조가 바뀌어 버리지는 않나요?',
    a: '아니요. 벽, 창문, 문, 천장과 카메라 구도 같은 건축 요소는 그대로 유지하도록 설계되어 있습니다. 가구, 조명, 색감, 소품만 선택한 스타일에 맞춰 다시 디자인됩니다.',
  },
  {
    q: '업로드한 사진과 API 키는 어디에 저장되나요?',
    a: '사진은 생성 요청 처리에만 사용되며 서버에 저장되지 않습니다. 개인 API 키는 브라우저 로컬 스토리지에만 보관되고 서버 로그에 남지 않습니다.',
  },
  {
    q: '결과물 화질은 어느 정도인가요?',
    a: '고화질 실사 렌더링 PNG로 제공되며, 완성 후 바로 다운로드할 수 있습니다. 같은 사진으로 다른 스타일을 연속해서 실험할 수도 있습니다.',
  },
];

export default function Faq() {
  return (
    <section className="w-full border-t border-line bg-paper-raised">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.24em] text-clay">
            FAQ
          </p>
          <h2 className="font-display mt-3 text-center text-3xl font-bold tracking-tight text-ink md:text-4xl">
            자주 묻는 질문
          </h2>
        </Reveal>

        <Reveal delay={100} className="mt-12 flex flex-col gap-3">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-line bg-paper px-6 py-5 transition-colors open:border-line-strong"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span className="text-lg font-light text-ink-faint transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">{faq.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
