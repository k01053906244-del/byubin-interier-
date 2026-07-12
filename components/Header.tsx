export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex flex-col items-start leading-none gap-1">
          <span className="text-[10px] font-extrabold tracking-[0.15em] text-clay uppercase">
            뷰빈LIFE
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold tracking-tight text-ink">
              내맘대로 인테리어AI
            </span>
            <span className="rounded-full border border-line-strong px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
              Beta
            </span>
          </div>
        </a>

        <nav className="flex items-center gap-6 text-sm font-medium text-ink-soft">
          <a href="#styles" className="hidden transition-colors hover:text-ink sm:block">
            스타일
          </a>
          <a href="#how-it-works" className="hidden transition-colors hover:text-ink sm:block">
            사용 방법
          </a>
          <a
            href="#studio"
            className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper transition-all duration-200 hover:bg-clay"
          >
            디자인하기
          </a>
        </nav>
      </div>
    </header>
  );
}
