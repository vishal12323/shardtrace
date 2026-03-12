import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "ShardTrace POC",
  description: "Verifiable sharded inference prototype"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

