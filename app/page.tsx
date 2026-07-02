"use client";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { SurfaceCard, fieldSurfaceClassName } from "@/components/page-primitives";
import { cn } from "@/lib/utils";
import { bootstrapForgeSession, loginAdmin } from "@/services/auth";
import { getForgeAccessToken, getForgeRefreshToken, persistForgeSession } from "@/services/auth/storage";

function parseAuthError(error: unknown) {
  if (error instanceof AxiosError) {
    const detail = error.response?.data;
    if (typeof detail === "string") {
      return detail;
    }

    if (detail && typeof detail === "object" && "detail" in detail && typeof detail.detail === "string") {
      return detail.detail;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "We could not sign you in with those credentials.";
}

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const nextPath = useMemo(() => {
    const next = searchParams.get("next");
    return next && next.startsWith("/") ? next : "/upload";
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (getForgeAccessToken()) {
        router.replace(nextPath);
        return;
      }

      if (getForgeRefreshToken()) {
        const session = await bootstrapForgeSession();
        if (session) {
          router.replace(nextPath);
          return;
        }
      }

      if (!cancelled) {
        setIsBootstrapping(false);
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [nextPath, router]);

  const loginMutation = useMutation({
    mutationFn: loginAdmin,
    onSuccess: (session) => {
      persistForgeSession(session, rememberMe ? "local" : "session");
      router.replace(nextPath);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginMutation.mutate({
      username,
      password,
    });
  }

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#EEF1FF_0%,_#FCFCFE_42%,_#F7F8FB_100%)] px-6">
        <div className="flex items-center gap-3 rounded-full border border-[#E6E7EC] bg-white px-5 py-3 text-[14px] font-medium text-[#4D5058] shadow-[0_12px_36px_rgba(17,24,39,0.08)]">
          <LoaderCircle className="h-4 w-4 animate-spin text-[#3150FF]" />
          Restoring admin session
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(88,110,255,0.16)_0%,_rgba(250,251,255,0.92)_34%,_#F6F7FB_68%,_#F1F3F8_100%)] px-6 py-10 text-[#16181D]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[linear-gradient(180deg,rgba(49,80,255,0.08),rgba(49,80,255,0))]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[520px] items-center justify-center">
        <SurfaceCard className="w-full overflow-hidden border-[#DCE2F1] bg-white/92 shadow-[0_24px_90px_rgba(17,24,39,0.10)] backdrop-blur-xl">
          <div className="border-b border-[#E8EBF5] px-7 pb-6 pt-7 text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#3150FF]">Admin Access</p>
            <div className="mt-4 inline-flex items-end gap-1">
              <span className="text-[46px] font-bold leading-none tracking-[-0.07em] text-[#0A0A0A] sm:text-[54px]">
                forge
              </span>
              <span className="mb-1 text-[46px] font-bold leading-none text-[#3150FF] sm:text-[54px]">.</span>
            </div>
            <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.05em] text-[#16181D]">Sign in</h1>
            <p className="mt-2 text-[14px] text-[#6A707C]">Use your admin credentials to continue.</p>
          </div>

          <form className="space-y-5 px-7 py-7" onSubmit={handleSubmit}>
            <div className="space-y-2.5">
              <label className="block text-[14px] font-medium tracking-[-0.02em] text-[#4D5058]" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter admin username or email"
                className={cn(fieldSurfaceClassName, "min-h-[54px]")}
              />
            </div>

            <div className="space-y-2.5">
              <label className="block text-[14px] font-medium tracking-[-0.02em] text-[#4D5058]" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
                className={cn(fieldSurfaceClassName, "min-h-[54px]")}
              />
            </div>

            <label className="flex items-center gap-3 text-[14px] text-[#555B65]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-[#CBD2E3] text-[#3150FF] focus:ring-[#3150FF]"
              />
              Keep me signed in on this device
            </label>

            {loginMutation.isError ? (
              <div className="rounded-[14px] border border-[#F3CFD7] bg-[#FFF4F6] px-4 py-3 text-[14px] text-[#B4233A]">
                {parseAuthError(loginMutation.error)}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#3150FF] px-5 text-[15px] font-semibold text-white transition hover:bg-[#2846EA] disabled:cursor-not-allowed disabled:bg-[#A9B7FF]"
            >
              {loginMutation.isPending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Signing in
                </>
              ) : (
                <>
                  Continue to dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </SurfaceCard>
      </div>
    </main>
  );
}
