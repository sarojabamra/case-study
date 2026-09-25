import type { ButtonHTMLAttributes } from "react";

import { joinClassNames } from "@/utils/classNames";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function Chip({ active = false, className, type = "button", ...props }: ChipProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        "shrink-0 cursor-pointer border px-3 py-1.5 text-sm transition-colors",
        active ? "border-accent bg-accent text-white" : "border-line-strong bg-canvas text-ink hover:border-ink hover:bg-surface",
        className,
      )}
      {...props}
    />
  );
}
