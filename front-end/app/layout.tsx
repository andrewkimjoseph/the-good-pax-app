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
    icon: [
      { url: '/thegoodpaxapp.svg?v=2', type: 'image/svg+xml', sizes: 'any' },
      { url: '/favicon.ico?v=2', type: 'image/x-icon' }
    ],
    apple: [
      { url: '/thegoodpaxapp.svg?v=2', sizes: '180x180', type: 'image/svg+xml' }
    ],
    shortcut: '/thegoodpaxapp.svg?v=2',
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/thegoodpaxapp.svg?v=2" type="image/svg+xml" sizes="any" />
        <link rel="icon" href="/favicon.ico?v=2" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/thegoodpaxapp.svg?v=2" sizes="180x180" />
        <link rel="shortcut icon" href="/thegoodpaxapp.svg?v=2" type="image/svg+xml" />
        <meta name="msapplication-TileImage" content="/thegoodpaxapp.svg?v=2" />
        <meta name="msapplication-TileColor" content="#18aefa" />
        <meta name="theme-color" content="#18aefa" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          background: 'linear-gradient(90deg, #FF9C4C 0%, #FF5C86 100%)',
          minHeight: '100vh',
        }}
      >
        <div className="min-h-screen flex justify-center">
          <div className="w-full max-w-lg bg-white shadow-xl relative">
            <Providers>
              <div className="pb-48">
                {children}
              </div>
            </Providers>
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
