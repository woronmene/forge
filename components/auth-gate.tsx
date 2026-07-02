"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { type PropsWithChildren, useEffect, useState } from "react";
import { bootstrapForgeSession } from "@/services/auth";
import { getForgeAccessToken, getForgeRefreshToken } from "@/services/auth/storage";

export function AuthGate({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready">("checking");

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      const accessToken = getForgeAccessToken();
      if (accessToken) {
        if (!cancelled) {
          setStatus("ready");
        }
        return;
      }

      if (getForgeRefreshToken()) {
        const session = await bootstrapForgeSession();
        if (session) {
          if (!cancelled) {
            setStatus("ready");
          }
          return;
        }
      }

      if (!cancelled) {
        router.replace(`/?next=${encodeURIComponent(pathname)}`);
      }
    }

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (status !== "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FCFCFE] px-6">
        <div className="flex items-center gap-3 rounded-full border border-[#E6E7EC] bg-white px-5 py-3 text-[14px] font-medium text-[#4D5058] shadow-[0_10px_40px_rgba(17,24,39,0.06)]">
          <LoaderCircle className="h-4 w-4 animate-spin text-[#3150FF]" />
          Validating admin session
        </div>
      </div>
    );
  }

  return children;
}
