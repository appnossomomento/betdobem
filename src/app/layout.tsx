import type { Metadata } from "next";
import { readdirSync } from "fs";
import path from "path";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const tabTitle = "Bet do Bem - Proteja seu patrimônio";

function shareImage() {
  const dir = path.join(process.cwd(), "public", "logo-bet-do-bem");
  const known = new Set(["logoprincpal-semtexto.png", "logoprincipal-branco.png", "logoprincipal-completo.png"]);
  const file = readdirSync(dir).find((name) => /\.(png|jpe?g|webp)$/i.test(name) && !known.has(name.toLowerCase()));
  return file ? `/logo-bet-do-bem/${encodeURIComponent(file)}` : null;
}

const image = shareImage();

export const metadata: Metadata = {
  metadataBase: new URL("https://betdobem.vercel.app"),
  title: { default: tabTitle, template: "%s" },
  description: "BETdoBEM",
  ...(image ? { openGraph: { images: [{ url: image, alt: tabTitle }] } } : {}),
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
