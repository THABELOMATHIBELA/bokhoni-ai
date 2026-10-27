
import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bokhoni AI | From Ideas to Impact",
  description:
    "Bokhoni AI is an innovation and enterprise intelligence platform supporting research, ideas, projects, entrepreneurship and practical innovation.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
                  B
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  Bokhoni AI
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Loading your workspace...
                </p>
              </div>
            </div>
          }
        >
          {children}
        </Suspense>
      </body>
    </html>
  );
}
