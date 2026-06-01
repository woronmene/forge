import { cn } from "@/lib/utils";

export const fieldSurfaceClassName =
  "w-full rounded-[14px] border border-[#E6E7EC] bg-white px-4 text-[15px] text-[#16181D] outline-none transition placeholder:text-[#A1A1AA] focus:border-[#8EA5FF] focus:ring-2 focus:ring-[#E5ECFF]";

export function SurfaceCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-[18px] border border-[#E7E8ED] bg-white", className)}>
      {children}
    </section>
  );
}

export function FieldLabel({
  children,
  required,
  mutedSuffix,
}: {
  children: React.ReactNode;
  required?: boolean;
  mutedSuffix?: string;
}) {
  return (
    <label className="mb-2.5 block text-[14px] font-medium tracking-[-0.02em] text-[#4D5058]">
      {children}
      {required ? <span className="ml-1 text-[#F04438]">*</span> : null}
      {mutedSuffix ? <span className="font-normal text-[#A1A1AA]"> {mutedSuffix}</span> : null}
    </label>
  );
}

export function InputLike({
  className,
  children,
  muted,
  withIcon,
}: {
  className?: string;
  children: React.ReactNode;
  muted?: boolean;
  withIcon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[52px] items-center rounded-[14px] border border-[#E6E7EC] bg-white px-4 text-[15px] font-medium text-[#16181D]",
        muted && "font-normal text-[#A1A1AA]",
        className,
      )}
    >
      <div className="flex-1">{children}</div>
      {withIcon ? <div className="ml-3 text-[#16181D]">{withIcon}</div> : null}
    </div>
  );
}

export function TextField({
  className,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  className?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "url" | "number";
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={cn(fieldSurfaceClassName, "min-h-[52px]", className)}
    />
  );
}

export function TextAreaField({
  className,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  className?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(fieldSurfaceClassName, "min-h-[124px] py-4 leading-7 resize-none", className)}
    />
  );
}

export function SelectField({
  className,
  value,
  onChange,
  options,
}: {
  className?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[] | string[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(fieldSurfaceClassName, "min-h-[52px] appearance-none pr-10", className)}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[20px] font-semibold tracking-[-0.05em] text-[#16181D] xl:text-[21px]">{children}</h2>;
}

export function StatusBadge({
  tone,
  children,
}: {
  tone: "ready" | "error" | "purple" | "cyan" | "blue" | "gray";
  children: React.ReactNode;
}) {
  const toneClass = {
    ready: "border-[#BFE7DD] bg-[#EEFBF7] text-[#1F8A78]",
    error: "border-[#F7C9D1] bg-[#FFF0F3] text-[#B4233A]",
    purple: "border-[#E5E1FF] bg-[#F5F2FF] text-[#6A50D8]",
    cyan: "border-[#BCEDE5] bg-[#ECFBF8] text-[#167F72]",
    blue: "border-[#CFE0FF] bg-[#EFF5FF] text-[#336BEB]",
    gray: "border-[#E5E7EB] bg-[#FAFAFA] text-[#868B94]",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[8px] border px-[10px] py-[5px] text-[12px] font-medium leading-none",
        toneClass,
      )}
    >
      {(tone === "ready" || tone === "error") && (
        <span className={cn("h-[7px] w-[7px] rounded-full", tone === "ready" ? "bg-[#1F8A78]" : "bg-[#B4233A]")} />
      )}
      {children}
    </span>
  );
}
