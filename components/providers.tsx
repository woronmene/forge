"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { type PropsWithChildren, useEffect, useState } from "react";
import { setForgeTokenProvider } from "@/services/api/client";

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    setForgeTokenProvider(() => {
      if (typeof window === "undefined") {
        return null;
      }

      return window.localStorage.getItem("forge_access_token") ?? window.sessionStorage.getItem("forge_access_token");
    });

    return () => setForgeTokenProvider(null);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
