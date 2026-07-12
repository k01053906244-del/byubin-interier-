import type { Metadata } from "next";
import { Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const notoSerif = Noto_Serif_KR({
  weight: ["400", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-noto-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://reroom-ai.vercel.app"),
  title: "뷰빈LIFE 내맘대로 인테리어AI — 사진 한 장으로 완성하는 AI 인테리어 리디자인",
  description:
    "방 사진을 올리고 스타일을 고르면, AI가 10초 만에 공간을 다시 디자인합니다. 벽과 창문 구조는 그대로, 분위기는 완전히 새롭게.",
  openGraph: {
    title: "뷰빈LIFE 내맘대로 인테리어AI — 사진 한 장으로 완성하는 AI 인테리어 리디자인",
    description:
      "방 사진을 올리고 스타일을 고르면, AI가 10초 만에 공간을 다시 디자인합니다.",
    url: "https://reroom-ai.vercel.app",
    siteName: "뷰빈LIFE 내맘대로 인테리어AI",
    images: [
      {
        url: "/living_room_after.png",
        width: 1200,
        height: 1200,
        alt: "뷰빈LIFE 내맘대로 인테리어AI 재팬디 스타일 리디자인 쇼케이스",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`h-full antialiased ${notoSerif.variable}`}>
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans">
        {children}
      </body>
    </html>
  );
}
