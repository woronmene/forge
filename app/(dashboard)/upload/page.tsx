"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { uploadPageConfigs, UploadTypeTab } from "@/features/uploads/data";
import type { UploadType } from "@/types/dashboard";

export default function UploadPage() {
  const [activeType, setActiveType] = useState<UploadType>("movie");
  const config = useMemo(() => uploadPageConfigs[activeType], [activeType]);

  return (
    <DashboardShell title="Upload Content" description="Add new media assets to the platform">
      <div className="px-4 py-5 md:px-6 xl:px-8 xl:py-6">
        <div className="flex flex-wrap items-center gap-3">
          {(["movie", "series", "album", "mix", "trailer"] as UploadType[]).map((type) => (
            <UploadTypeTab key={type} type={type} active={type === activeType} onClick={() => setActiveType(type)} />
          ))}
          <button type="button" className="ml-1 text-[15px] font-semibold text-[#3150FF] underline underline-offset-2">
            Change type
          </button>
        </div>

        <div className="mt-5 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_500px]">
          <div className="min-w-0 space-y-5">
            {config.topSections.map((section) => (
              <div key={section.title}>{section.body}</div>
            ))}
          </div>

          <div className="min-w-0 space-y-5">{config.rightRail}</div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-[#E7E8ED] bg-white/95 px-4 py-4 backdrop-blur md:px-6 xl:px-8">
        <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch">
          <div className="flex flex-wrap items-center gap-3 max-md:w-full">
            <button
              type="button"
              className="rounded-full bg-[#3150FF] px-5 py-3.5 text-[14px] font-medium text-white shadow-[0_10px_28px_rgba(49,80,255,0.22)] max-md:flex-1"
            >
              Save &amp; start processing
            </button>
            <button
              type="button"
              className="rounded-full border border-[#E6E7EC] bg-white px-5 py-3.5 text-[14px] font-medium text-[#16181D] max-md:flex-1"
            >
              Save as Draft
            </button>
          </div>
          <button type="button" className="text-[14px] font-medium text-[#7C818B] max-md:self-end">
            {config.footerNotice}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
