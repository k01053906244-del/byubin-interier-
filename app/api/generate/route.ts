import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { DAILY_IP_LIMIT, ROOM_TYPES, STYLES } from '@/lib/constants';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const maxDuration = 60;

// IP당 일일 제한을 관리하기 위한 인메모리 맵
// key: IP주소, value: { count: number, resetAt: number }
const ipLimits = new Map<string, { count: number; resetAt: number }>();

function getIpUsage(ip: string): { allowed: boolean } {
  const now = Date.now();
  const limit = ipLimits.get(ip);

  // 첫 요청이거나 24시간 윈도우가 지난 경우 초기화
  if (!limit || now > limit.resetAt) {
    ipLimits.set(ip, { count: 0, resetAt: now + 24 * 60 * 60 * 1000 });
    return { allowed: true };
  }

  return { allowed: limit.count < DAILY_IP_LIMIT };
}

// 생성 성공 시에만 카운트를 차감해 실패한 요청이 횟수를 소모하지 않도록 한다
function consumeIpUsage(ip: string) {
  const limit = ipLimits.get(ip);
  if (limit) limit.count += 1;
}

export async function POST(req: NextRequest) {
  let byokKey: any = null;
  try {
    // 요청 용량 제한 체크 (~8MB)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: '업로드 요청 크기가 제한(8MB)을 초과했습니다. 이미지 해상도를 줄여주세요.' },
        { status: 413 }
      );
    }

    const body = await req.json();
    byokKey = body.byokKey;
    const { image, roomTypeId, styleId } = body;

    const authHeader = req.headers.get('Authorization');
    let uid = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await getAdminAuth().verifyIdToken(idToken);
        uid = decodedToken.uid;
      } catch (err) {
        console.error('Token verification failed:', err);
      }
    }

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: '인테리어 디자인을 입힐 원본 방 사진을 업로드해 주세요.' },
        { status: 400 }
      );
    }

    const roomType = ROOM_TYPES.find((r) => r.id === roomTypeId);
    const style = STYLES.find((s) => s.id === styleId);
    if (!roomType || !style) {
      return NextResponse.json(
        { error: '공간 유형과 인테리어 스타일을 선택해 주세요.' },
        { status: 400 }
      );
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    // API 키 결정 (BYOK 우선, 없으면 서버 환경변수 키)
    const apiKey = (typeof byokKey === 'string' && byokKey.trim()) || process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json(
        { error: '서버의 GEMINI_API_KEY가 설정되지 않았습니다. "내 API 키" 모드를 켜고 개인 키를 입력해 주세요.' },
        { status: 500 }
      );
    }

    // 데모 모드(서버 제공 키)인 경우에만 일일 제한 또는 크레딧 검증
    const isDemoMode = !byokKey;
    let userRef: any = null;
    let adminDbInstance: any = null;
    
    if (isDemoMode) {
      if (uid) {
        try {
          adminDbInstance = getAdminDb();
          userRef = adminDbInstance.collection('users').doc(uid);
          const userDoc = await userRef.get();
          const credits = userDoc.data()?.credits || 0;
          
          if (credits <= 0) {
            return NextResponse.json(
              { error: '크레딧이 부족합니다. 프리미엄(수동 계좌이체) 업그레이드가 필요합니다.' },
              { status: 403 }
            );
          }
        } catch (err) {
          console.error("Firebase Admin DB Error:", err);
          return NextResponse.json(
            { error: '서버 환경변수(FIREBASE_SERVICE_ACCOUNT_KEY)가 설정되지 않아 크레딧을 확인할 수 없습니다. 관리자에게 문의하세요.' },
            { status: 500 }
          );
        }
      } else {
        // 비로그인 IP 기반 검증 (Fallback)
        const referer = req.headers.get('referer') || '';
        const isFromPortal = 
          referer.includes('byubinfutureworks.web.app') || 
          referer.includes('byubinfutureworks.firebaseapp.com') ||
          referer.includes('localhost:') || 
          referer.includes('127.0.0.1:');

        if (!isFromPortal && !getIpUsage(ip).allowed) {
          return NextResponse.json(
            {
              error: `데모 일일 제한(IP당 하루 ${DAILY_IP_LIMIT}회)을 초과했습니다. 로그인하여 무료 크레딧을 이용해 보세요.`,
            },
            { status: 429 }
          );
        }
      }
    }

    // base64 및 mimeType 파싱
    let mimeType = 'image/jpeg';
    let base64Image = image;

    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        base64Image = match[2];
      }
    }

    // 이미지 base64 바이트 사이즈 검증 (~8MB)
    if (base64Image.length > 8 * 1024 * 1024 * 1.33) {
      return NextResponse.json(
        { error: '업로드 이미지 용량이 8MB를 초과합니다. 더 작은 이미지를 업로드해 주세요.' },
        { status: 413 }
      );
    }

    const instruction = `Redesign this ${roomType.prompt} interior in ${style.prompt}. Keep the room architecture — walls, windows, doors, ceiling and camera perspective — exactly the same. Replace furniture, lighting, color palette and decor to match the target style. Photorealistic interior photography, natural lighting, high detail.`;

    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [
        {
          role: 'user',
          parts: [{ inlineData: { mimeType, data: base64Image } }, { text: instruction }],
        },
      ],
    });

    const candidate = res.candidates?.[0];

    if (candidate?.finishReason === 'SAFETY') {
      return NextResponse.json(
        { error: '안전 정책에 의해 이미지 생성이 차단되었습니다. 다른 사진을 사용해 주세요.' },
        { status: 400 }
      );
    }

    const part = candidate?.content?.parts?.find((p) => p.inlineData);
    const imageBase64 = part?.inlineData?.data;

    if (!imageBase64) {
      return NextResponse.json(
        { error: '이미지 생성이 실패했거나 차단되었습니다. 다른 공간 유형이나 스타일을 선택해 주세요.' },
        { status: 400 }
      );
    }

    if (isDemoMode) {
      if (uid && userRef && adminDbInstance) {
        // 성공 시 트랜잭션으로 크레딧 차감
        await adminDbInstance.runTransaction(async (t: any) => {
          const doc = await t.get(userRef);
          const currentCredits = doc.data()?.credits || 0;
          if (currentCredits > 0) {
            t.update(userRef, { credits: currentCredits - 1 });
          }
        });
      } else {
        consumeIpUsage(ip);
      }
    }

    return NextResponse.json({ image: imageBase64 });
  } catch (error) {
    console.error('Gemini Generate API Error:', error);
    const errMsg = error instanceof Error ? error.message : '';

    if (
      errMsg.includes('API_KEY_INVALID') ||
      errMsg.includes('API key not valid') ||
      errMsg.includes('invalid api key')
    ) {
      return NextResponse.json(
        { error: 'API 키가 잘못되었습니다. 발급받은 유효한 API 키를 정확히 입력해 주세요.' },
        { status: 401 }
      );
    }

    if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('429')) {
      const isLimitZero = errMsg.includes('limit: 0') || errMsg.includes('limit:0');
      const isDepleted = errMsg.includes('prepayment') || errMsg.includes('depleted') || errMsg.includes('credit');
      if (byokKey) {
        if (isDepleted) {
          return NextResponse.json(
            {
              error: '입력하신 개인 API 키의 선결제 크레딧이 모두 소진되었습니다. Google AI Studio(https://aistudio.google.com/)에서 프로젝트의 결제 잔액을 충전한 뒤 다시 시도해 주세요.',
            },
            { status: 429 }
          );
        } else if (isLimitZero) {
          return NextResponse.json(
            {
              error: '입력하신 개인 API 키의 이미지 생성 한도가 0회로 제한되어 있습니다. Gemini 이미지 모델(gemini-3.1-flash-image)은 Google AI Studio에서 결제 계정(Billing)이 연동된 프로젝트의 API 키가 필요합니다. 결제 수단을 연동한 뒤 다시 시도해 주세요.',
            },
            { status: 429 }
          );
        } else {
          return NextResponse.json(
            {
              error: '개인 API 키의 요청 할당량을 초과했습니다. 잠시 후 다시 시도해 주세요. (무료 키는 분당/일일 생성 제한이 엄격합니다)',
            },
            { status: 429 }
          );
        }
      } else {
        if (isDepleted) {
          return NextResponse.json(
            {
              error: '서버 데모 API 키의 선결제 크레딧이 소진되었습니다. 무제한 사용을 위해 "내 API 키로 무제한 사용" 모드를 켜고 개인 API 키를 등록해 주세요.',
            },
            { status: 429 }
          );
        } else if (isLimitZero) {
          return NextResponse.json(
            {
              error: '서버 데모 API 키의 이미지 생성 한도가 초과되었습니다. 무제한 사용을 위해 "내 API 키로 무제한 사용" 모드를 켜고, Google AI Studio에서 결제 계정이 연동된 개인 API 키를 등록해 주세요.',
            },
            { status: 429 }
          );
        } else {
          return NextResponse.json(
            {
              error: '데모 API 키의 일일 무료 요청 할당량을 초과했습니다. 무제한 사용을 위해 "내 API 키로 무제한 사용" 모드를 켜고 개인 API 키를 등록해 주세요.',
            },
            { status: 429 }
          );
        }
      }
    }

    if (errMsg.includes('SAFETY') || errMsg.includes('safety') || errMsg.includes('blocked')) {
      return NextResponse.json(
        { error: '안전 필터에 의해 생성이 거부되었습니다. 다른 사진이나 스타일로 시도해 주세요.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `인테리어 생성 실패: ${errMsg || '알 수 없는 서버 내부 오류'}` },
      { status: 500 }
    );
  }
}
