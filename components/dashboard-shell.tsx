"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellDot, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { navigationSections } from "@/constants/navigation";
import { cn } from "@/lib/utils";

type ShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

function RoundIconButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E6E7EC] bg-white text-[#111827] shadow-[0_4px_18px_rgba(17,24,39,0.05)] transition hover:border-[#D6D8E3]"
    >
      {children}
    </button>
  );
}

function SidebarNavigation({
  pathname,
  onNavigate,
  showBrand = true,
}: {
  pathname: string;
  onNavigate?: () => void;
  showBrand?: boolean;
}) {
  return (
    <>
      {showBrand ? (
        <div className="border-b border-[#EDEEF2] px-7 py-6">
          <Link href="/upload" className="inline-flex items-end gap-1" onClick={onNavigate}>
            <span className="text-[40px] font-bold leading-none tracking-[-0.06em] text-[#0A0A0A] xl:text-[44px]">
              forge
            </span>
            <span className="mb-1 text-[40px] font-bold leading-none text-[#3150FF] xl:text-[44px]">.</span>
          </Link>
        </div>
      ) : null}

      <nav className="flex-1 space-y-8 px-4 py-7">
        {navigationSections.map((section) => (
          <div key={section.title}>
            <p className="px-5 text-[12px] font-medium uppercase tracking-[0.02em] text-[#A1A1AA] xl:px-7">
              {section.title}
            </p>
            <div className="mt-4 space-y-1">
              {section.items.map((item) => {
                const isActive =
                  item.href !== "#" && (pathname === item.href || pathname.startsWith(`${item.href}/`));
                const iconSrc = isActive && item.activeIcon ? item.activeIcon : item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.disabled ? "#" : item.href}
                    onClick={item.disabled ? undefined : onNavigate}
                    className={cn(
                      "flex items-center justify-between rounded-[14px] px-4 py-3 transition xl:px-[14px]",
                      item.disabled
                        ? "cursor-default opacity-45"
                        : isActive
                          ? "bg-[#EEF0FF] text-[#3150FF]"
                          : "text-[#66686F] hover:bg-[#F8F8FC]",
                    )}
                    aria-disabled={item.disabled}
                  >
                    <span className="flex items-center gap-3">
                      <Image src={iconSrc} alt="" width={20} height={20} />
                      <span className="text-[15px] font-medium tracking-[-0.02em] xl:text-[16px]">
                        {item.label}
                      </span>
                    </span>

                    {item.badge ? (
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[12px] font-medium leading-none",
                          isActive ? "bg-[#E3E8FF] text-[#3150FF]" : "bg-[#FFE7E8] text-[#FF5D63]",
                          item.badge === "12.4k" && !isActive && "bg-[#EEF0FF] text-[#3150FF]",
                        )}
                      >
                        {item.badge}
                      </span>
                    ) : null}

                    {item.disabledLabel ? (
                      <span className="rounded-full border border-[#F0F0F0] px-3 py-1 text-[12px] text-[#C0C2CA]">
                        {item.disabledLabel}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-[#EDEEF2] px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 overflow-hidden rounded-full bg-[#F1F2F6]">
            <Image
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80"
              alt="Johnny Jackson"
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#16181D]">Johnny Jackson</p>
            <p className="text-[12px] text-[#8A8E98]">Content Admin</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function DashboardShell({ title, description, children }: ShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-white text-[#0A0A0A]">
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#16181D]/40"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation overlay"
          />
          <aside className="relative z-10 flex h-full w-[294px] max-w-[85vw] flex-col overflow-y-auto border-r border-[#E6E7EC] bg-white shadow-[0_20px_60px_rgba(17,24,39,0.18)]">
            <div className="flex items-center justify-between border-b border-[#EDEEF2] px-7 py-5">
              <Link href="/upload" className="inline-flex items-end gap-1" onClick={() => setMobileNavOpen(false)}>
                <span className="text-[36px] font-bold leading-none tracking-[-0.06em] text-[#0A0A0A]">
                  forge
                </span>
                <span className="mb-1 text-[36px] font-bold leading-none text-[#3150FF]">.</span>
              </Link>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E6E7EC] bg-white text-[#111827] shadow-[0_4px_18px_rgba(17,24,39,0.05)] transition hover:border-[#D6D8E3]"
                aria-label="Close menu"
                onClick={() => setMobileNavOpen(false)}
              >
                <X className="h-5 w-5 stroke-[1.8]" />
              </button>
            </div>
            <SidebarNavigation pathname={pathname} onNavigate={() => setMobileNavOpen(false)} showBrand={false} />
          </aside>
        </div>
      ) : null}

      <div className="grid h-full lg:grid-cols-[288px_minmax(0,1fr)] xl:grid-cols-[314px_minmax(0,1fr)]">
        <aside className="hidden h-full overflow-y-auto border-r border-[#E6E7EC] bg-white lg:flex lg:flex-col">
          <SidebarNavigation pathname={pathname} />
        </aside>

        <div className="flex min-h-0 flex-col overflow-hidden">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#EDEEF2] px-4 py-4 md:px-7 xl:px-8">
            <div className="flex min-w-0 items-start gap-3">
              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E6E7EC] bg-white text-[#111827] shadow-[0_4px_18px_rgba(17,24,39,0.05)] transition hover:border-[#D6D8E3] lg:hidden"
                aria-label="Open navigation menu"
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu className="h-5 w-5 stroke-[1.8]" />
              </button>
              <div className="min-w-0">
              <h1 className="text-[18px] font-semibold tracking-[-0.03em] text-[#16181D]">{title}</h1>
              <p className="mt-1 text-[13px] text-[#767A84]">{description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RoundIconButton>
                <Search className="h-5 w-5 stroke-[1.8]" />
              </RoundIconButton>
              <RoundIconButton>
                <BellDot className="h-5 w-5 stroke-[1.8]" />
              </RoundIconButton>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#FCFCFE]">{children}</main>
        </div>
      </div>
    </div>
  );
}
