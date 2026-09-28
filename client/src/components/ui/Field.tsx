import { controlClass, FieldProps } from "@/components/ui/fieldStyles";
import { joinClassNames } from "@/utils/classNames";
import { forwardRef, useState } from "react";

const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, id, type, className, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? props.name;
  const secret = type === "password";

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={secret && visible ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={joinClassNames(controlClass, secret && "pr-16", error ? "border-danger" : "border-line-strong")}
          {...props}
          ref={ref}
        />
        {secret ? (
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted"
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? "Hide" : "Show"}
          </button>
        ) : null}
      </div>
      {hint && !error ? (
        <p id={`${inputId}-hint`} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export default Field;
