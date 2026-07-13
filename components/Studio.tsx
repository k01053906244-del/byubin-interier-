'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { FREE_GENERATIONS, ROOM_TYPES, STYLES } from '@/lib/constants';
import { useLocalStorage } from '@/lib/useLocalStorage';
import CompareSlider from './CompareSlider';
import Reveal from './Reveal';
import { signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

const LOADING_STATUSES = [
  '공간 구조 분석 중...',
  '스타일 요소 배치 중...',
  '조명 및 색상 튜닝 중...',
  '최종 고화질 렌더링 중...',
];

export default function Studio() {
  // 입력 상태
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState(ROOM_TYPES[0].id);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 무료 체험 횟수 + BYOK (localStorage와 동기화)
  const [freeCountRaw, setFreeCountRaw] = useLocalStorage(
    'reroom_free_generations',
    String(FREE_GENERATIONS)
  );
  const [byokModeRaw, setByokModeRaw] = useLocalStorage('reroom_byok_mode', 'false');
  const byokMode = byokModeRaw === 'true';
  const [byokKey, setByokKey] = useLocalStorage('reroom_byok_key', '');

  // Firebase Auth & Credits
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          // 신규 유저 가입 시 2 크레딧 제공
          await setDoc(userRef, { credits: 2, createdAt: new Date() });
        }
        
        // 실시간 크레딧 구독
        const unsubs = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setCredits(docSnap.data().credits || 0);
          }
        });
        return () => unsubs();
      } else {
        setCredits(0);
      }
    });
    return () => unsubscribe();
  }, []);

  // 생성 상태
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // 스타일 갤러리 카드에서 스타일을 미리 선택했을 때
    const onPickStyle = (e: Event) => {
      const styleId = (e as CustomEvent<string>).detail;
      if (STYLES.some((s) => s.id === styleId)) {
        setSelectedStyle(styleId);
        setResultImage(null);
      }
    };
    window.addEventListener('reroom:style', onPickStyle);
    return () => window.removeEventListener('reroom:style', onPickStyle);
  }, []);

  const handleByokToggle = () => setByokModeRaw(String(!byokMode));

  // 업로드 이미지 전처리 — Canvas로 긴 쪽 1024px 다운스케일
  const handleImageFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('이미지 파일(JPG, PNG, WebP)만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('파일 크기는 10MB를 초과할 수 없습니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 1024;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setUploadedImage(canvas.toDataURL('image/jpeg', 0.85));
          setResultImage(null);
          setErrorMsg(null);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setErrorMsg(null);
    } catch (err) {
      console.error(err);
      setErrorMsg('로그인 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      setErrorMsg('공간 인테리어를 위해 먼저 사진을 업로드해 주세요.');
      return;
    }
    
    if (!byokMode) {
      if (!user) {
        setErrorMsg('로그인 후 무료 체험(2회) 및 프리미엄 기능을 이용하실 수 있습니다.');
        handleLogin();
        return;
      }
      if (credits <= 0) {
        setErrorMsg('크레딧이 모두 소진되었습니다. 프리미엄으로 업그레이드(수동 입금 확인) 후 어드민에게 문의하세요.');
        return;
      }
    }

    if (byokMode && !byokKey.trim()) {
      setErrorMsg('API 키가 입력되지 않았습니다. AI Studio에서 발급받은 API 키를 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setResultImage(null);
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_STATUSES.length);
    }, 2500);
    const startTime = Date.now();

    try {
      let idToken = null;
      if (user && !byokMode) {
        idToken = await user.getIdToken();
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken && { 'Authorization': `Bearer ${idToken}` })
        },
        body: JSON.stringify({
          image: uploadedImage,
          roomTypeId: selectedRoom,
          styleId: selectedStyle,
          byokKey: byokMode ? byokKey.trim() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '이미지 생성에 실패했습니다.');
      }

      setResultImage(`data:image/png;base64,${data.image}`);
      setGenerationTime(Number(((Date.now() - startTime) / 1000).toFixed(1)));

    } catch (err) {
      console.error(err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : '인테리어 생성 중 오류가 발생했습니다. 다시 시도해 주세요.'
      );
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `viewbin_life_${selectedRoom}_${selectedStyle}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetResult = () => {
    setResultImage(null);
    setGenerationTime(null);
  };

  const resetAll = () => {
    setUploadedImage(null);
    setResultImage(null);
    setGenerationTime(null);
    setErrorMsg(null);
  };

  return (
    <section id="studio" className="w-full scroll-mt-16 border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-clay">
                Studio
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
                나의 리디자인 스튜디오
              </h2>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="rounded-full border border-line bg-paper-raised px-4 py-2 text-xs font-semibold text-ink-soft">
                {byokMode
                  ? '내 API 키로 무제한 사용 중'
                  : isAuthLoading
                  ? '로딩 중...'
                  : user
                  ? `남은 크레딧: ${credits}회`
                  : '로그인 후 이용 가능'}
              </span>
              {user ? (
                <button onClick={handleLogout} className="text-xs text-ink-faint underline hover:text-ink">
                  로그아웃
                </button>
              ) : (
                <button onClick={handleLogin} className="text-xs font-bold text-clay hover:underline">
                  구글로 시작하기
                </button>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={100} className="mt-10">
          <div className="rounded-3xl border border-line bg-paper-raised p-6 shadow-lift md:p-10">
            {resultImage && uploadedImage ? (
              /* ── 생성 완료 결과 ── */
              <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 animate-fade-in">
                <div className="text-center">
                  <span className="rounded-full bg-clay px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-paper">
                    Redesign Complete
                  </span>
                  <h3 className="font-display mt-4 text-2xl font-bold text-ink">
                    새로운 공간이 완성되었습니다
                  </h3>
                  <p className="mt-1.5 text-xs text-ink-faint">
                    {STYLES.find((s) => s.id === selectedStyle)?.label} 스타일 · 생성 소요{' '}
                    {generationTime}초
                  </p>
                </div>

                <CompareSlider
                  beforeSrc={uploadedImage}
                  afterSrc={resultImage}
                  beforeAlt="업로드한 원본 공간"
                  afterAlt="리디자인된 공간"
                />

                <div className="flex w-full flex-wrap justify-center gap-3">
                  <button
                    onClick={handleDownload}
                    className="cursor-pointer rounded-full bg-ink px-8 py-3.5 text-sm font-semibold text-paper shadow-lift transition-all duration-200 hover:bg-clay active:scale-95"
                  >
                    고화질 PNG 다운로드
                  </button>
                  <button
                    onClick={resetResult}
                    className="cursor-pointer rounded-full border border-line-strong bg-paper-raised px-8 py-3.5 text-sm font-semibold text-ink transition-all duration-200 hover:border-ink active:scale-95"
                  >
                    다른 스타일로 다시 디자인
                  </button>
                  <button
                    onClick={resetAll}
                    className="cursor-pointer rounded-full px-6 py-3.5 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
                  >
                    다른 사진 업로드
                  </button>
                </div>
              </div>
            ) : (
              /* ── 입력 단계 ── */
              <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-12">
                {/* 01. 업로드 */}
                <div className="flex flex-col gap-3">
                  <label className="flex items-baseline gap-2 text-base font-bold text-ink">
                    <span className="font-display text-sm text-clay">01</span>
                    원본 공간 사진 업로드
                  </label>

                  {!uploadedImage ? (
                    <div
                      role="button"
                      tabIndex={0}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        if (e.dataTransfer.files?.[0]) handleImageFile(e.dataTransfer.files[0]);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                      className={`flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
                        isDragOver
                          ? 'scale-[0.99] border-clay bg-clay-soft'
                          : 'border-line-strong bg-paper hover:border-ink-faint'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                          e.target.value = '';
                        }}
                      />
                      <svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        className="text-ink-faint"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="9" cy="9" r="1.8" fill="currentColor" />
                        <path d="M4 17l5-5 4 4 3-3 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          파일을 드래그하거나 클릭해서 업로드
                        </p>
                        <p className="mt-1.5 text-xs text-ink-faint">
                          JPG · PNG · WebP, 최대 10MB
                          <br />
                          업로드 시 1024px로 자동 최적화됩니다
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line shadow-lift">
                      <Image src={uploadedImage} alt="업로드한 공간 미리보기" fill className="object-cover" />
                      <button
                        onClick={resetAll}
                        title="사진 삭제"
                        className="absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-ink/75 text-paper backdrop-blur-sm transition-all duration-200 hover:bg-ink active:scale-95"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* 02+03. 옵션 */}
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-3">
                    <label className="flex items-baseline gap-2 text-base font-bold text-ink">
                      <span className="font-display text-sm text-clay">02</span>
                      공간 유형
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ROOM_TYPES.map((room) => (
                        <button
                          key={room.id}
                          onClick={() => {
                            setSelectedRoom(room.id);
                            setErrorMsg(null);
                          }}
                          className={`cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                            selectedRoom === room.id
                              ? 'bg-ink text-paper shadow-lift'
                              : 'border border-line bg-paper text-ink-soft hover:border-line-strong hover:text-ink'
                          }`}
                        >
                          {room.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="flex items-baseline gap-2 text-base font-bold text-ink">
                      <span className="font-display text-sm text-clay">03</span>
                      디자인 스타일
                    </label>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                      {STYLES.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => {
                            setSelectedStyle(style.id);
                            setErrorMsg(null);
                          }}
                          className={`flex cursor-pointer flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all duration-200 ${
                            selectedStyle === style.id
                              ? 'border-clay bg-clay-soft shadow-lift'
                              : 'border-line bg-paper hover:-translate-y-0.5 hover:border-line-strong'
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            {style.swatch.map((color) => (
                              <span
                                key={color}
                                className="h-3 w-3 rounded-full border border-ink/10"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </span>
                          <span className="text-xs font-bold text-ink sm:text-sm">
                            {style.label}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* 선택된 디자인 스타일 인라인 프리뷰 카드 */}
                    {(() => {
                      const currentStyle = STYLES.find((s) => s.id === selectedStyle);
                      if (!currentStyle) return null;
                      return (
                        <div
                          key={currentStyle.id}
                          className="mt-4 flex flex-col gap-4 rounded-2xl border border-line bg-paper p-4 animate-fade-in sm:flex-row sm:items-center sm:gap-6"
                        >
                          {/* 스타일 예시 이미지 */}
                          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl border border-line-strong shadow-sm sm:w-40 sm:h-30">
                            <Image
                              src={currentStyle.image}
                              alt={`${currentStyle.label} 스타일 예시`}
                              fill
                              className="object-cover"
                            />
                          </div>

                          {/* 스타일 설명 및 상세 정보 */}
                          <div className="flex flex-col gap-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display text-[10px] font-bold text-clay uppercase tracking-wider">
                                  {currentStyle.id.replace('_', ' ')}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-ink-faint" />
                                <h4 className="text-sm font-extrabold text-ink">
                                  {currentStyle.label} 스타일
                                </h4>
                              </div>
                              <p className="mt-1.5 text-xs font-medium leading-relaxed text-ink-soft">
                                {currentStyle.descLong}
                              </p>
                            </div>

                            {/* 컬러 매칭 정보 */}
                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-ink-soft">
                              <span className="rounded bg-sand px-1.5 py-0.5 text-ink">
                                추천 컬러 칩
                              </span>
                              <div className="flex items-center gap-2.5">
                                {currentStyle.swatch.map((color, idx) => (
                                  <span key={color} className="flex items-center gap-1">
                                    <span
                                      className="h-2.5 w-2.5 rounded-full border border-ink/10"
                                      style={{ backgroundColor: color }}
                                    />
                                    <span>{currentStyle.colors[idx]}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* BYOK + 에러 + 생성 버튼 (전체 폭) */}
                <div className="flex flex-col gap-5 lg:col-span-2">
                  <div className="rounded-2xl border border-line bg-paper p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-ink">내 API 키로 무제한 사용</p>
                        <p className="mt-0.5 text-xs text-ink-soft">
                          개인 Gemini API 키를 등록하여 이용합니다. (이미지 모델은 결제 계정 연동 필요)
                        </p>
                      </div>
                      <button
                        onClick={handleByokToggle}
                        role="switch"
                        aria-checked={byokMode}
                        aria-label="내 API 키로 무제한 사용"
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-clay ${
                          byokMode ? 'bg-clay' : 'bg-line-strong'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-paper-raised shadow transition duration-200 ${
                            byokMode ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {byokMode && (
                      <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 animate-fade-in">
                        <div className="flex items-center justify-between text-xs">
                          <label htmlFor="byok-key" className="font-semibold text-ink-soft">
                            개인 Gemini API Key
                          </label>
                          <a
                            href="https://aistudio.google.com/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-clay underline underline-offset-2"
                          >
                            API 키 발급 및 결제 연동 (AI Studio)
                          </a>
                        </div>
                        <input
                          id="byok-key"
                          type="password"
                          value={byokKey}
                          onChange={(e) => setByokKey(e.target.value)}
                          placeholder="AI Studio에서 복사한 API Key를 입력해 주세요"
                          className="w-full rounded-xl border border-line bg-paper-raised px-4 py-3 text-sm text-ink placeholder-ink-faint transition-colors focus:border-clay focus:outline-none"
                        />
                        <p className="text-[10px] leading-relaxed text-ink-faint">
                          ※ 입력된 API 키는 브라우저 로컬 스토리지에만 보관되며, 서버 로그나 다른 곳에 절대 저장되지 않습니다.
                          <br />
                          ※ 중요: 이미지 생성 모델(<code className="bg-ink/5 px-1 py-0.5 rounded text-[9px]">gemini-3.1-flash-image</code>)은 무료 등급 API 키일 경우 호출 한도가 0회로 제한되므로, AI Studio 프로젝트에 결제 수단(Billing)이 연동되어 있어야 정상 작동합니다.
                        </p>
                      </div>
                    )}
                  </div>

                  {errorMsg && (
                    <div
                      role="alert"
                      className="rounded-xl border border-clay/30 bg-clay-soft p-4 text-xs leading-relaxed text-clay-deep"
                    >
                      {errorMsg}
                    </div>
                  )}

                  <button
                    onClick={handleGenerate}
                    disabled={isLoading || !uploadedImage}
                    className={`w-full rounded-2xl py-4 text-base font-bold transition-all duration-300 ${
                      isLoading || !uploadedImage
                        ? 'cursor-not-allowed bg-sand text-ink-faint'
                        : 'cursor-pointer bg-ink text-paper shadow-lift hover:-translate-y-0.5 hover:bg-clay active:scale-[0.99]'
                    }`}
                  >
                    {isLoading ? '새로운 인테리어 생성 중...' : '인테리어 디자인 생성하기'}
                  </button>

                  {isLoading && (
                    <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-paper py-8">
                      <div className="flex items-center gap-2">
                        {[0, 150, 300].map((delay) => (
                          <span
                            key={delay}
                            className="h-2 w-2 animate-bounce rounded-full bg-clay"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </div>
                      <p className="text-sm font-semibold text-ink" aria-live="polite">
                        {LOADING_STATUSES[loadingStep]}
                      </p>
                      <p className="text-xs text-ink-faint">
                        첫 생성에는 약 10초가 소요됩니다. 잠시만 기다려 주세요.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
