'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import Link from 'next/link';

interface UserData {
  uid: string;
  email: string;
  credits: number;
  tier: string;
  createdAt: string;
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [actionLoadingMap, setActionLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user && user.email === 'byubin@futureworks.com') {
        setIsAdmin(true);
        fetchUsers();
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setErrorMsg(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('로그인 중 오류가 발생했습니다: ' + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUsers([]);
      setIsAdmin(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchUsers = async (emailToSearch?: string) => {
    setIsLoadingUsers(true);
    setErrorMsg(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('인증 토큰을 가져올 수 없습니다.');

      const url = emailToSearch
        ? `/api/admin/users?email=${encodeURIComponent(emailToSearch)}`
        : '/api/admin/users';

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '사용자 조회를 실패했습니다.');

      setUsers(data.users || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchEmail);
  };

  const handleCreditAction = async (targetUid: string, action: 'add' | 'reset', amount?: number) => {
    setActionLoadingMap((prev) => ({ ...prev, [targetUid]: true }));
    setErrorMsg(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('인증 토큰을 가져올 수 없습니다.');

      const res = await fetch('/api/admin/credit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          targetUid,
          action,
          amount,
          tier: action === 'add' ? 'premium' : 'free',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '크레딧 업데이트를 실패했습니다.');

      // UI 갱신
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.uid === targetUid ? { ...u, credits: data.credits, tier: data.tier } : u
        )
      );
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [targetUid]: false }));
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
        <p className="text-sm font-semibold">관리자 권한 확인 중...</p>
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper p-6 text-center text-ink">
        <div className="max-w-md rounded-3xl border border-line bg-paper-raised p-8 shadow-lift">
          <h1 className="font-display text-2xl font-bold text-ink">관리자 페이지 보호</h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            이 페이지는 관리자 전용 대시보드입니다. <br />
            관리자 계정(<code className="bg-ink/5 px-1 py-0.5 rounded text-clay">byubin@futureworks.com</code>)으로 로그인해 주세요.
          </p>
          {currentUser ? (
            <div className="mt-6 flex flex-col gap-3">
              <p className="text-xs text-ink-faint">현재 로그인: {currentUser.email}</p>
              <button
                onClick={handleLogout}
                className="w-full cursor-pointer rounded-xl border border-line-strong bg-paper px-4 py-2.5 text-xs font-bold hover:bg-sand"
              >
                다른 계정으로 로그인 (로그아웃)
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="mt-6 w-full cursor-pointer rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-paper hover:bg-clay"
            >
              구글 계정으로 로그인
            </button>
          )}
          <div className="mt-4">
            <Link href="/" className="text-xs text-ink-faint underline hover:text-ink">
              메인 화면으로 가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper py-12 text-ink">
      <div className="mx-auto max-w-5xl px-6">
        {/* 헤더 */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              👑 안대장의 관리자 대시보드
            </h1>
            <p className="mt-1 text-xs text-ink-soft">인테리어 AI 서비스 크레딧 수동 충전 시스템</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-line bg-paper-raised px-4 py-2 text-xs font-bold text-ink-soft hover:text-ink"
            >
              메인 홈 가기
            </Link>
            <button
              onClick={handleLogout}
              className="cursor-pointer rounded-xl bg-clay px-4 py-2 text-xs font-bold text-paper hover:bg-clay-deep"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 에러 알림 */}
        {errorMsg && (
          <div className="mt-6 rounded-xl border border-clay/30 bg-clay-soft p-4 text-xs leading-relaxed text-clay-deep">
            {errorMsg}
          </div>
        )}

        {/* 검색 폼 */}
        <form onSubmit={handleSearch} className="mt-8 flex gap-2">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="가입자 이메일 주소를 입력해 주세요"
            className="w-full rounded-xl border border-line bg-paper-raised px-4 py-3 text-sm text-ink placeholder-ink-faint focus:border-clay focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoadingUsers}
            className="shrink-0 cursor-pointer rounded-xl bg-ink px-6 py-3 text-sm font-bold text-paper hover:bg-clay"
          >
            {isLoadingUsers ? '검색 중...' : '검색'}
          </button>
          {searchEmail && (
            <button
              type="button"
              onClick={() => {
                setSearchEmail('');
                fetchUsers();
              }}
              className="cursor-pointer rounded-xl border border-line px-4 text-xs font-bold text-ink-soft hover:bg-sand"
            >
              초기화
            </button>
          )}
        </form>

        {/* 사용자 리스트 */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-soft">
              {searchEmail ? '검색 결과' : '최근 가입자 (최대 20명)'}
            </h2>
            <button
              onClick={() => fetchUsers(searchEmail)}
              className="text-xs text-clay hover:underline"
            >
              새로고침
            </button>
          </div>

          {isLoadingUsers ? (
            <div className="mt-4 py-12 text-center text-xs text-ink-faint">
              데이터를 불러오는 중입니다...
            </div>
          ) : users.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-line py-12 text-center text-xs text-ink-faint">
              조회된 사용자가 없습니다.
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              {users.map((userData) => {
                const isLoading = actionLoadingMap[userData.uid] || false;
                return (
                  <div
                    key={userData.uid}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-line bg-paper-raised p-5 shadow-sm sm:flex-row sm:items-center"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-ink">{userData.email}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            userData.tier === 'premium'
                              ? 'bg-clay text-paper'
                              : 'bg-sand text-ink-soft'
                          }`}
                        >
                          {userData.tier}
                        </span>
                      </div>
                      <span className="text-[10px] text-ink-faint">UID: {userData.uid}</span>
                      <span className="text-[10px] text-ink-faint">
                        가입일: {userData.createdAt ? new Date(userData.createdAt).toLocaleString() : '정보 없음'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1 bg-paper px-3 py-1.5 rounded-lg border border-line">
                        <span className="text-[10px] font-bold text-ink-soft">잔여 크레딧:</span>
                        <span className="text-sm font-extrabold text-clay">{userData.credits}회</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCreditAction(userData.uid, 'add', 50)}
                          disabled={isLoading}
                          className="cursor-pointer rounded-lg bg-ink/5 px-3 py-2 text-xs font-bold text-ink hover:bg-sand"
                        >
                          +50
                        </button>
                        <button
                          onClick={() => handleCreditAction(userData.uid, 'add', 100)}
                          disabled={isLoading}
                          className="cursor-pointer rounded-lg bg-ink px-3 py-2 text-xs font-bold text-paper hover:bg-clay"
                        >
                          +100 (추천)
                        </button>
                        <button
                          onClick={() => handleCreditAction(userData.uid, 'add', 300)}
                          disabled={isLoading}
                          className="cursor-pointer rounded-lg bg-ink/5 px-3 py-2 text-xs font-bold text-ink hover:bg-sand"
                        >
                          +300
                        </button>
                        <button
                          onClick={() => handleCreditAction(userData.uid, 'reset')}
                          disabled={isLoading}
                          className="cursor-pointer rounded-lg border border-line-strong bg-paper px-3 py-2 text-xs font-bold text-clay hover:bg-clay-soft"
                        >
                          초기화
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
