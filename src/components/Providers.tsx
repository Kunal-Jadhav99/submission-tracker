"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "hsl(222 47% 10%)",
              border: "1px solid hsl(217 33% 20%)",
              color: "hsl(210 40% 98%)",
            },
          }}
          richColors
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
