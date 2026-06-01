import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge, SurfaceCard } from "@/components/page-primitives";

export function MetricCard({
  label,
  value,
  helper,
  helperTone = "positive",
  active,
}: {
  label: string;
  value: string;
  helper?: string;
  helperTone?: "positive" | "negative" | "neutral";
  active?: boolean;
}) {
  return (
    <SurfaceCard className={cn(active && "border-[#8EA5FF] bg-[#EEF1FF]")}>
      <div className="p-4 xl:p-5">
        <p className={cn("text-[13px] font-semibold uppercase text-[#6C7079]", active && "text-[#3150FF]")}>
          {label}
        </p>
        <p className="mt-2 text-[19px] font-semibold tracking-[-0.04em] text-[#16181D] xl:text-[20px]">{value}</p>
        {helper ? (
          <p
            className={cn(
              "mt-2 text-[12px] font-medium",
              helperTone === "positive" && "text-[#228473]",
              helperTone === "negative" && "text-[#C1122F]",
              helperTone === "neutral" && "text-[#7B8088]",
            )}
          >
            {helper}
          </p>
        ) : null}
      </div>
    </SurfaceCard>
  );
}

export function ToolbarSearch({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex min-w-[240px] flex-1 items-center gap-3 rounded-[16px] border border-[#E6E7EC] bg-white px-4 py-3.5">
      <Search className="h-5 w-5 text-[#7D828C]" />
      <input
        className="min-w-0 flex-1 bg-transparent text-[15px] text-[#16181D] outline-none placeholder:text-[#8C9098]"
        placeholder={placeholder}
      />
    </div>
  );
}

export function ToolbarSearchField({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex min-w-[240px] flex-1 items-center gap-3 rounded-[16px] border border-[#E6E7EC] bg-white px-4 py-3.5">
      <Search className="h-5 w-5 text-[#7D828C]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-[#16181D] outline-none placeholder:text-[#8C9098]"
        placeholder={placeholder}
      />
    </div>
  );
}

export function ToolbarButton({
  children,
  withChevron = false,
  subtle = false,
  onClick,
}: {
  children: React.ReactNode;
  withChevron?: boolean;
  subtle?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-[46px] items-center gap-3 rounded-[14px] border border-[#E6E7EC] bg-white px-5 text-[14px] font-medium text-[#16181D]",
        subtle && "text-[#6F7380]",
      )}
    >
      {children}
      {withChevron ? <ChevronDown className="h-4 w-4" /> : null}
    </button>
  );
}

export function ToolbarSelect({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[] | string[];
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="inline-flex h-[46px] appearance-none items-center rounded-[14px] border border-[#E6E7EC] bg-white px-5 pr-10 text-[14px] font-medium text-[#16181D] outline-none transition focus:border-[#8EA5FF] focus:ring-2 focus:ring-[#E5ECFF]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#16181D]" />
    </div>
  );
}

export function SegmentTabs({
  items,
  active,
  onChange,
}: {
  items: string[];
  active: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-[14px] border border-[#E6E7EC] bg-white p-1">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange?.(item)}
          className={cn(
            "rounded-[10px] px-4 py-2 text-[14px] font-medium",
            active === item ? "bg-[#3150FF] text-white" : "text-[#20232B]",
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function MediaThumb({
  swatch,
  icon = "▶",
}: {
  swatch: string;
  icon?: string;
}) {
  return (
    <div className="flex h-[40px] w-[64px] items-center justify-center rounded-[8px]" style={{ backgroundColor: swatch }}>
      <span className="ml-1 text-[21px] text-white">{icon}</span>
    </div>
  );
}

export function AvatarCircle({
  text,
  color,
}: {
  text: string;
  color: string;
}) {
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {text}
    </div>
  );
}

export function ProgressTrack({
  value,
  color = "#3150FF",
  background = "#E8EBF4",
  height = "h-[4px]",
}: {
  value: number;
  color?: string;
  background?: string;
  height?: string;
}) {
  return (
    <div className={cn("w-full rounded-full", height)} style={{ backgroundColor: background }}>
      <div className={cn("rounded-full", height)} style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

export function SparkLine({
  value,
  color = "#3150FF",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-[4px] w-[120px] rounded-full bg-[#ECEEF4]">
        <div className="h-[4px] rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-[12px] font-semibold text-[#3150FF]">{value}%</span>
    </div>
  );
}

export function DrawerPanel({
  title,
  subtitle,
  children,
  footer,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <SurfaceCard>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[14px] font-semibold uppercase tracking-[0.02em] text-[#7B8088]">{title}</p>
            {subtitle ? <p className="mt-1 text-[13px] text-[#8C9098]">{subtitle}</p> : null}
          </div>
          {footer}
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </SurfaceCard>
  );
}

export function DataCardRow({
  title,
  subtitle,
  swatch,
  badge,
  badgeTone,
  trailing,
}: {
  title: string;
  subtitle: string;
  swatch: string;
  badge?: string;
  badgeTone?: "ready" | "error" | "purple" | "cyan" | "blue" | "gray";
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <MediaThumb swatch={swatch} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-[#16181D]">{title}</p>
        <p className="mt-0.5 text-[13px] text-[#737884]">{subtitle}</p>
      </div>
      {badge && badgeTone ? <StatusBadge tone={badgeTone}>{badge}</StatusBadge> : null}
      {trailing}
    </div>
  );
}

export function CountryCell({
  flag,
  country,
  subtitle,
  share,
}: {
  flag: string;
  country: string;
  subtitle?: string;
  share?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-[19px]">{flag}</span>
        <div>
          <p className="text-[15px] font-semibold text-[#16181D]">{country}</p>
          {subtitle ? <p className="text-[13px] text-[#7D828B]">{subtitle}</p> : null}
        </div>
      </div>
      {typeof share === "number" ? <SparkLine value={share} /> : null}
    </div>
  );
}

export function FauxBars({
  values,
  highlightIndex,
  max = 100,
  yLabels = ["0", "100K", "200K", "300K"],
  xLabels = ["Jan", "Dec"],
}: {
  values: number[];
  highlightIndex: number;
  max?: number;
  yLabels?: string[];
  xLabels?: string[];
}) {
  return (
    <div className="relative">
      <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-4">
        <div className="space-y-[34px] pt-3 text-[12px] text-[#6F7380]">
          {[...yLabels].reverse().map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>
        <div>
          <div className="relative h-[180px] rounded-[18px] bg-white">
            <div className="absolute inset-0 flex flex-col justify-between py-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="border-t border-dashed border-[#E6E8EE]" />
              ))}
            </div>
            <div className="absolute left-0 right-0 top-1/2 flex items-center gap-3">
              <span className="rounded-[8px] bg-[#223B9A] px-2 py-1 text-[12px] text-white">Avg</span>
              <div className="w-full border-t border-dotted border-[#666D7A]" />
            </div>
            <div className="absolute inset-x-4 bottom-4 top-4 flex items-end gap-3">
              {values.map((value, index) => (
                <div key={`${value}-${index}`} className="relative flex-1">
                  <div
                    className={cn(
                      "w-full rounded-[10px] bg-[#F1F2F6]",
                      index === highlightIndex && "bg-[#3150FF]",
                    )}
                    style={{ height: `${(value / max) * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex justify-between px-2 text-[12px] text-[#6F7380]">
            <span>{xLabels[0]}</span>
            <span>{xLabels[1]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FileStatusRow({
  name,
  status,
  progress,
}: {
  name: string;
  status: "uploaded" | "progress" | "ready";
  progress?: number;
}) {
  return (
    <div className="rounded-[16px] border border-[#E6E7EC] bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <p className="truncate text-[15px] font-semibold text-[#16181D]">{name}</p>
        {status === "progress" ? (
          <span className="text-[12px] font-semibold text-[#3150FF]">{progress}%</span>
        ) : (
          <StatusBadge tone="ready">{status === "ready" ? "Ready" : "Uploaded"}</StatusBadge>
        )}
      </div>
      {status === "progress" ? (
        <div className="mt-3">
          <ProgressTrack value={progress ?? 68} />
        </div>
      ) : null}
    </div>
  );
}

export function ExportButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex h-[44px] items-center gap-2 rounded-[12px] border border-[#E6E7EC] bg-white px-4 text-[13px] font-medium text-[#20232B]"
    >
      {children}
    </button>
  );
}

export function DrawerAssetHeader({
  swatch,
  title,
  subtitle,
  tag,
}: {
  swatch: string;
  title: string;
  subtitle: string;
  tag?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <MediaThumb swatch={swatch} />
      <div>
        <p className="text-[15px] font-semibold text-[#16181D]">{title}</p>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-[13px] text-[#757A84]">{subtitle}</p>
          {tag ? <StatusBadge tone="purple">{tag}</StatusBadge> : null}
        </div>
      </div>
    </div>
  );
}

export function FlagMetric({
  flag,
  label,
  value,
  share,
}: {
  flag: string;
  label: string;
  value: string;
  share: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#ECEEF3] py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="text-[17px]">{flag}</span>
        <div>
          <p className="text-[15px] font-semibold text-[#16181D]">{label}</p>
          <p className="text-[13px] text-[#737884]">{value}</p>
        </div>
      </div>
      <SparkLine value={share} />
    </div>
  );
}

export function ProviderStatus({
  label,
  subtitle,
  status,
}: {
  label: string;
  subtitle: string;
  status: "Healthy" | "Down";
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#ECEEF3] py-5 last:border-b-0">
      <div>
        <p className="text-[14px] font-semibold text-[#16181D]">{label}</p>
        <p className={cn("mt-1 text-[13px]", status === "Down" ? "text-[#B4233A]" : "text-[#767C86]")}>{subtitle}</p>
      </div>
      <div className={cn("flex items-center gap-2 text-[12px]", status === "Down" ? "text-[#B4233A]" : "text-[#1F8A78]")}>
        <span className={cn("h-[6px] w-[6px] rounded-full", status === "Down" ? "bg-[#B4233A]" : "bg-[#1F8A78]")} />
        {status}
      </div>
    </div>
  );
}
