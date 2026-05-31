import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GiveawayApp } from "@/components/GiveawayApp";
import "./globals.css";

export const metadata: Metadata = {
  title: "Comment Giveaway Picker",
  description: "Pick random comment winners from Instagram, X, YouTube and more with mention filters",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
