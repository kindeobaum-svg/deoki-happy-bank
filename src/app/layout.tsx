import type { Metadata, Viewport } from "next";
import { Gaegu, Jua, Noto_Sans_KR } from "next/font/google";
import { AppProvider } from "@/hooks/useAppStore";
import { NavBar } from "@/components/NavBar";
import { AppShell } from "@/components/AppShell";
import { PWARegister } from "@/components/PWARegister";
import { APP_NAME, DAYCARE_NAME } from "@/lib/branding";
import "./globals.css";

const gaegu = Gaegu({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-gaegu",
});

const jua = Jua({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-jua",
});

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: `${APP_NAME} | ${DAYCARE_NAME}`,
  description: `학부모와 함께하는 따뜻한 ${DAYCARE_NAME} — 알림장, 행복숲 통장, 우리 아이의 하루`,
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#163d28",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${gaegu.variable} ${jua.variable} ${noto.variable} h-full`}>
      <body className="app-bg min-h-full antialiased">
        <AppProvider>
          <PWARegister />
          <div className="app-frame mx-auto min-h-full w-full max-w-lg">
            <NavBar />
            <AppShell>{children}</AppShell>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
