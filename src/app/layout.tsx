import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Viewport, type Metadata } from "next";

import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/providers/auth-provider";

export const metadata: Metadata = {
  title: "CaptureScape",
  description: "Capture your memories",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <TRPCReactProvider>
          <AuthProvider>{children} </AuthProvider>
        </TRPCReactProvider>
        <Toaster />
      </body>
    </html>
  );
}
