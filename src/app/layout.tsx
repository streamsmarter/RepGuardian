import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreamSmarter",
  description: "AI-powered business growth and customer engagement platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster
            richColors
            theme="dark"
            position="top-right"
            toastOptions={{
              classNames: {
                toast:
                  "!bg-[#1a1919] !border !border-white/8 !text-white !shadow-[0_18px_50px_-20px_rgba(0,0,0,0.75)]",
                title: "!text-white",
                description: "!text-[#adaaaa]",
                actionButton:
                  "!bg-[#262626] !text-white !border !border-white/10 hover:!bg-[#2d2d2d]",
                cancelButton:
                  "!bg-[#262626] !text-white !border !border-white/10 hover:!bg-[#2d2d2d]",
                success:
                  "!bg-[#1a1919] !border-primary/20",
                error:
                  "!bg-[#1a1919] !border-destructive/20",
                warning:
                  "!bg-[#1a1919] !border-amber-500/20",
                info:
                  "!bg-[#1a1919] !border-[#77C6DC]/20",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
