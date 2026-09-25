import type { UseFormReturn } from "react-hook-form";

import { Field, SelectField } from "@/components/Field";

export type AddressFormValues = {
  label: string;
  recipient_name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: "IN" | "US";
  phone: string;
};

export function AddressFormFields({
  form,
  idPrefix = "address",
}: {
  form: UseFormReturn<AddressFormValues>;
  idPrefix?: string;
}) {
  const errors = form.formState.errors;
  const country = form.watch("country");

  return (
    <>
      <Field
        label="Label (optional)"
        placeholder="Home, Office…"
        className="sm:col-span-2"
        id={`${idPrefix}-label`}
        error={errors.label?.message}
        {...form.register("label")}
      />
      <Field
        label="Recipient name"
        className="sm:col-span-2"
        id={`${idPrefix}-recipient`}
        error={errors.recipient_name?.message}
        {...form.register("recipient_name")}
      />
      <Field
        label="Address line 1"
        className="sm:col-span-2"
        id={`${idPrefix}-line1`}
        error={errors.line1?.message}
        {...form.register("line1")}
      />
      <Field
        label="Address line 2 (optional)"
        className="sm:col-span-2"
        id={`${idPrefix}-line2`}
        error={errors.line2?.message}
        {...form.register("line2")}
      />
      <Field label="City" id={`${idPrefix}-city`} error={errors.city?.message} {...form.register("city")} />
      <Field label="State" id={`${idPrefix}-state`} error={errors.state?.message} {...form.register("state")} />
      <Field
        label={country === "IN" ? "PIN code" : "Postal code"}
        inputMode="numeric"
        autoComplete="postal-code"
        id={`${idPrefix}-postal`}
        error={errors.postal_code?.message}
        {...form.register("postal_code")}
      />
      <SelectField label="Country" id={`${idPrefix}-country`} error={errors.country?.message} {...form.register("country")}>
        <option value="IN">India</option>
        <option value="US">United States</option>
      </SelectField>
      <Field
        label="Phone (optional)"
        className="sm:col-span-2"
        id={`${idPrefix}-phone`}
        error={errors.phone?.message}
        {...form.register("phone")}
      />
    </>
  );
}
