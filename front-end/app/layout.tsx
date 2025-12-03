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
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
        >
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
            fbq('track', 'PageView');
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
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
        >
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
              var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
              ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
              ttq.load('D4NLVR3C77U7MI8IPG2G');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
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
