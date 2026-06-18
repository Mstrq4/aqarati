import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'عقاراتي | Aqarati - دفتر عقاراتك الذكي',
  description: 'أسرع طريقة لحفظ العروض العقارية ومشاركتها ومتابعتها. منصة عقاراتي للوسطاء والمكاتب العقارية في السعودية.',
  keywords: 'عقارات, عقاراتي, وسيط عقاري, تطبيق عقاري, السعودية, عقار, فلل, شقق, اراضي, aqarati, real estate saudi',
  authors: [{ name: 'عقاراتي | Aqarati' }],
  openGraph: {
    title: 'عقاراتي - دفتر عقاراتك الذكي',
    description: 'أسرع طريقة لحفظ العروض العقارية ومشاركتها ومتابعتها',
    type: 'website',
    locale: 'ar_SA',
    siteName: 'عقاراتي',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'عقاراتي - دفتر عقاراتك الذكي',
    description: 'أسرع طريقة لحفظ العروض العقارية ومشاركتها ومتابعتها',
    images: ['/og-image.png'],
  },
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <meta name="theme-color" content="#020907" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="font-arabic">{children}</body>
    </html>
  );
}
