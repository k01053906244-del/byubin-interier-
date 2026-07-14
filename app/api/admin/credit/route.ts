import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증 토큰이 없습니다.' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    
    // 이메일이 관리자 계정인지 확인
    if (decodedToken.email !== 'byubin@futureworks.com') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { targetUid, action, amount, tier } = await req.json();

    if (!targetUid) {
      return NextResponse.json({ error: '대상 사용자 UID가 필요합니다.' }, { status: 400 });
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(targetUid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const currentCredits = userDoc.data()?.credits ?? 0;
    let newCredits = currentCredits;
    let newTier = userDoc.data()?.tier ?? 'free';

    if (action === 'add') {
      const addAmount = Number(amount) || 0;
      newCredits = currentCredits + addAmount;
      newTier = tier || 'premium';
    } else if (action === 'reset') {
      newCredits = 0;
      newTier = 'free';
    } else {
      return NextResponse.json({ error: '잘못된 액션입니다.' }, { status: 400 });
    }

    await userRef.update({
      credits: newCredits,
      tier: newTier,
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true, credits: newCredits, tier: newTier });
  } catch (error: any) {
    console.error('Admin Credit API error:', error);
    return NextResponse.json({ error: error.message || '서버 오류' }, { status: 500 });
  }
}
