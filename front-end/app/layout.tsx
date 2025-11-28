import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "@/components/Providers";
import { ConditionalHeader } from "@/components/ConditionalHeader";
import { Footer } from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next"

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
      '{"version":"1","imageUrl":"https://thegoodpax.app/thegoodpaxapp.png","button":{"title":"🚩 Start","action":{"type":"launch_miniapp","name":"The Good Pax App","url":"https://thegoodpax.app","splashImageUrl":"https://thegoodpax.app/thegoodpaxapp.png","splashBackgroundColor":"#f5f0ec"}}}',
    "fc:frame":
      '{"version":"1","imageUrl":"https://thegoodpax.app/thegoodpaxapp.png","button":{"title":"🚩 Start","action":{"type":"launch_frame","name":"The Good Pax App","url":"https://thegoodpax.app","splashImageUrl":"https://thegoodpax.app/thegoodpaxapp.png","splashBackgroundColor":"#f5f0ec"}}}',
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
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '2561878580879293');
          `}
        </Script>
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{display: 'none'}}
            src="https://www.facebook.com/tr?id=2561878580879293&noscript=1"
            alt=""
          />
        </noscript>
        <div className="min-h-screen flex justify-center">
          <div className="w-full max-w-lg bg-white shadow-xl relative">
            <Providers>
              <ConditionalHeader />
              <div className="pb-32">{children}</div>
            </Providers>
            <Footer />
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
