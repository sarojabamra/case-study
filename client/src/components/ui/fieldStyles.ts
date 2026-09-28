import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

export type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const controlClass =
  "w-full border bg-canvas px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-ink";

export type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
};
