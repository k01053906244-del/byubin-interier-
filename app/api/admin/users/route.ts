import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim();

    const db = getAdminDb();
    let query: any = db.collection('users');

    if (email) {
      query = query.where('email', '==', email);
    } else {
      query = query.orderBy('createdAt', 'desc').limit(20);
    }

    const snapshot = await query.get();
    const users = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      };
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: error.message || '서버 오류' }, { status: 500 });
  }
}
