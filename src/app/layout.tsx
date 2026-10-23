import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const tabTitle = "BETdoBEM - Projeta seu Patrimônio!";
const shareText = "Proteja sua banca de moedas fictícias, com reset de patrimônio a cada semana e odds atualizadas!";

const shareImage = "https://betdobem.vercel.app/logo-bet-do-bem/logo-share.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://betdobem.vercel.app"),
  title: { default: tabTitle, template: "%s" },
  description: shareText,
  openGraph: {
    title: tabTitle,
    description: shareText,
    images: [{ url: shareImage, width: 1678, height: 937, alt: tabTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: tabTitle,
    description: shareText,
    images: [shareImage],
  },
  applicationName: "BETdoBEM",
  appleWebApp: { capable: true, title: "BETdoBEM", statusBarStyle: "black-translucent" },
  icons: { apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
