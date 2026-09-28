import { controlClass, SelectFieldProps } from "@/components/ui/fieldStyles";
import { joinClassNames } from "@/utils/classNames";

export default function SelectField({ label, error, id, children, className, ...props }: SelectFieldProps) {
  const selectId = id ?? props.name;
  return (
    <div className={className}>
      <label htmlFor={selectId} className="mb-1.5 block text-sm">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className={joinClassNames(controlClass, error ? "border-danger" : "border-line-strong")}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p id={`${selectId}-error`} role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
