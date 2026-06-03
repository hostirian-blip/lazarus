import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Lazarus — Lead Resurrection Platform",
  description: "Your dead leads aren't dead. They're money you left behind.",
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
