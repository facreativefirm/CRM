import type { Metadata } from "next";
import { Outfit, Tiro_Bangla } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { Toaster } from "sonner";
import { SettingsBootstrap } from "@/components/SettingsBootstrap";
import { FloatingNotifications } from "@/components/shared/FloatingNotifications";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const tiroBangla = Tiro_Bangla({
  weight: "400",
  subsets: ["bengali"],
  variable: "--font-tiro-bangla",
});

export const metadata: Metadata = {
  title: "WHMCS CRM | Production Ready",
  description: "Next-gen WHMCS CRM for hosting and services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${tiroBangla.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsBootstrap>
            <LanguageProvider>
              {children}
              <FloatingNotifications />
              <Toaster richColors position="top-right" />
            </LanguageProvider>
          </SettingsBootstrap>
        </ThemeProvider>
      </body>
    </html>
  );
}
