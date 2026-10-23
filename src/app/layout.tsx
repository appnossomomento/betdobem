import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const tabTitle = "BETdoBEM - Projeta seu Patrimônio!";

const shareImage = "https://betdobem.vercel.app/logo-bet-do-bem/logo-share.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://betdobem.vercel.app"),
  title: { default: tabTitle, template: "%s" },
  description: "BETdoBEM",
  openGraph: {
    title: tabTitle,
    description: "BETdoBEM",
    images: [{ url: shareImage, width: 1678, height: 937, alt: tabTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: tabTitle,
    images: [shareImage],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {children}
      </body>
    </html>
  );
}
