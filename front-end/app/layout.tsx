import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "@/components/Providers";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "The Good Pax App",
  description: "Canvassing x GoodDollar",
  icons: {
    icon: "/thegoodpaxapp.svg",
    apple: "/thegoodpaxapp.svg",
    shortcut: "/thegoodpaxapp.svg",
  },
  other: {
    "fc:miniapp":
      '{"version":"1","imageUrl":"/logo.png","button":{"title":"🚩 Start","action":{"type":"launch_miniapp","name":"The Good Pax App","url":"/","splashImageUrl":"/logo.png","splashBackgroundColor":"#f5f0ec"}}}',
    "fc:frame":
      '{"version":"1","imageUrl":"/logo.png","button":{"title":"🚩 Start","action":{"type":"launch_frame","name":"The Good Pax App","url":"/","splashImageUrl":"/logo.png","splashBackgroundColor":"#f5f0ec"}}}',
  },
};

export const viewport = {
  themeColor: "#18aefa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          background: "linear-gradient(90deg, #FF9C4C 0%, #FF5C86 100%)",
          minHeight: "100vh",
        }}
      >
        <div className="min-h-screen flex justify-center">
          <div className="w-full max-w-lg bg-white shadow-xl relative">
            <Providers>
              <div className="pb-48">{children}</div>
            </Providers>
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
