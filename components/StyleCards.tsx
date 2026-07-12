'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { STYLES } from '@/lib/constants';
import Reveal from './Reveal';

/** 스타일 갤러리 카드. 클릭 시 상세 팝업 모달을 띄우고, 모달 내 버튼 클릭 시 스튜디오로 스크롤하며 스타일을 자동 선택한다. */
export default function StyleCards() {
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);

  // 모달이 열려있을 때 바디 스크롤 방지
  useEffect(() => {
    if (selectedStyleId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedStyleId]);

  const pickStyle = (styleId: string) => {
    window.dispatchEvent(new CustomEvent('reroom:style', { detail: styleId }));
    document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        {STYLES.map((style, i) => (
          <Reveal key={style.id} delay={i * 60}>
            <button
              type="button"
              onClick={() => setSelectedStyleId(style.id)}
              className="group flex h-full w-full cursor-pointer flex-col justify-between rounded-2xl border border-line bg-paper p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-lift"
            >
              <div className="flex items-center gap-1.5">
                {style.swatch.map((color) => (
                  <span
                    key={color}
                    className="h-5 w-5 rounded-full border border-ink/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="mt-8">
                <h3 className="font-display text-lg font-bold text-ink">
                  {style.label}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                  {style.desc}
                </p>
                <p className="mt-4 text-xs font-semibold text-clay opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  자세히 보기 & 디자인하기 →
                </p>
              </div>
            </button>
          </Reveal>
        ))}
      </div>

      {/* 스타일 상세 보기 팝업 모달 */}
      {selectedStyleId && (() => {
        const style = STYLES.find((s) => s.id === selectedStyleId);
        if (!style) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
            {/* 뒷배경 클릭 시 닫기 */}
            <div 
              className="absolute inset-0 cursor-default" 
              onClick={() => setSelectedStyleId(null)} 
            />
            
            {/* 모달 콘텐트 */}
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-paper-raised p-6 shadow-deep animate-fade-in md:p-8">
              {/* 닫기 버튼 */}
              <button
                type="button"
                onClick={() => setSelectedStyleId(null)}
                className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-ink/5 text-ink transition-colors hover:bg-ink/10 active:scale-95 z-10"
                aria-label="닫기"
              >
                ✕
              </button>

              {/* 이미지 */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line-strong shadow-sm">
                <Image
                  src={style.image}
                  alt={`${style.label} 스타일 예시`}
                  fill
                  className="object-cover"
                />
              </div>

              {/* 텍스트 세부사항 */}
              <div className="mt-6 flex flex-col gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[10px] font-bold text-clay uppercase tracking-wider">
                      {style.id.replace('_', ' ')}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-ink-faint" />
                    <h3 className="text-lg font-extrabold text-ink">
                      {style.label} 스타일
                    </h3>
                  </div>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-ink-soft md:text-sm">
                    {style.descLong}
                  </p>
                </div>

                {/* 컬러 칩 매칭 정보 */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-soft">
                  <span className="rounded bg-sand px-2 py-0.5 text-[10px] text-ink">
                    추천 컬러 칩
                  </span>
                  <div className="flex items-center gap-2.5">
                    {style.swatch.map((color, idx) => (
                      <span key={color} className="flex items-center gap-1">
                        <span
                          className="h-3 w-3 rounded-full border border-ink/10"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[11px]">{style.colors[idx]}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* 이 스타일로 시작하기 버튼 */}
                <button
                  type="button"
                  onClick={() => {
                    pickStyle(style.id);
                    setSelectedStyleId(null);
                  }}
                  className="mt-2 w-full cursor-pointer rounded-2xl bg-ink py-4 text-sm font-bold text-paper shadow-lift transition-all duration-300 hover:bg-clay active:scale-[0.99]"
                >
                  이 스타일로 디자인 시작하기
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
