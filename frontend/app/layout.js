import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LoadingScreen from "./loading-screen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "NIRIKSHAN | Legal Metrology Compliance",
  description:
    "AI-powered Legal Metrology compliance inspections for enforcement officers.",
  icons: {
    icon: "/Firefly.png",
    shortcut: "/Firefly.png",
    apple: "/Firefly.png",
  },
  openGraph: {
    title: "NIRIKSHAN | Legal Metrology Compliance",
    description:
      "AI-powered Legal Metrology compliance inspections for enforcement officers.",
    images: ["/Firefly.png"],
  },
  twitter: {
    card: "summary",
    title: "NIRIKSHAN | Legal Metrology Compliance",
    description:
      "AI-powered Legal Metrology compliance inspections for enforcement officers.",
    images: ["/Firefly.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LoadingScreen>{children}</LoadingScreen>
      </body>
    </html>
  );
}
