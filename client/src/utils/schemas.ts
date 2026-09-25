import { z } from "zod";

const usernamePattern = /^[A-Za-z0-9_-]{3,32}$/;
const namePattern = /^[A-Za-z0-9]+(?:[ -][A-Za-z0-9]+)*$/;

export const usernameSchema = z
  .string()
  .trim()
  .min(1, "Enter a username.")
  .regex(usernamePattern, "Use 3–32 letters, numbers, _ or -.");

export const passwordSchema = z
  .string()
  .min(1, "Enter a password.")
  .refine(
    (value) => value.length >= 8 && value.length <= 64 && /[A-Za-z]/.test(value) && /\d/.test(value),
    "Use 8 or more characters, with a letter and a number.",
  );

export const credentialsSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

const lettersOnlyPattern = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
const lettersOnlyMessage = "Use letters only. Spaces, hyphens, and apostrophes are allowed. No numbers.";

function lettersOnlyField(empty: string, max = 80) {
  return z
    .string()
    .trim()
    .min(1, empty)
    .max(max, lettersOnlyMessage)
    .regex(lettersOnlyPattern, lettersOnlyMessage);
}

export const fullNameSchema = lettersOnlyField("Enter your full name.").refine(
  (value) => value.length >= 2,
  "Enter at least 2 letters.",
);

export const signupSchema = credentialsSchema.extend({
  full_name: fullNameSchema,
});

export const profileSchema = z.object({
  full_name: fullNameSchema,
});

export const changePasswordSchema = z
  .object({
    current_password: passwordSchema,
    new_password: passwordSchema,
    confirm_new_password: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.new_password === values.confirm_new_password, {
    message: "New passwords do not match.",
    path: ["confirm_new_password"],
  })
  .refine((values) => values.current_password !== values.new_password, {
    message: "New password must be different from your current password.",
    path: ["new_password"],
  });

function labeledName(empty: string, format: string, max: number, pattern?: RegExp) {
  return z
    .string()
    .trim()
    .min(1, empty)
    .max(max, format)
    .refine((value) => value.length >= 2 && (pattern ? pattern.test(value) : true), format);
}

export const brandNameSchema = labeledName(
  "Enter a brand name.",
  "Use 2–40 letters, numbers, spaces, or hyphens.",
  40,
  namePattern,
);

export const categoryNameSchema = labeledName(
  "Enter a category name.",
  "Use 2–40 letters, numbers, spaces, or hyphens.",
  40,
  namePattern,
);

export const productNameSchema = labeledName("Enter a product name.", "Use 2–80 characters.", 80);

export const priceSchema = z
  .string()
  .trim()
  .min(1, "Enter a price greater than 0.")
  .refine((value) => {
    if (!/^\d+(\.\d{1,2})?$/.test(value)) {
      return false;
    }
    const amount = Number(value);
    return amount > 0 && amount <= 999999.99;
  }, "Enter a price greater than 0, with at most 2 decimal places.");

export const stockSchema = z
  .string()
  .trim()
  .min(1, "Enter a whole number from 0 to 100000.")
  .refine((value) => /^\d+$/.test(value) && Number(value) <= 100000, "Enter a whole number from 0 to 100000.");

export const productSchema = z.object({
  name: productNameSchema,
  price: priceSchema,
  quantity: stockSchema,
  category_id: z.string().min(1, "Choose a category."),
});

export const categorySchema = z.object({
  name: categoryNameSchema,
});

export const brandSchema = z.object({
  name: brandNameSchema,
});

export const staffSchema = credentialsSchema;

export function orderQuantitySchema(available: number) {
  return z
    .string()
    .trim()
    .min(1, "Enter at least 1.")
    .refine((value) => /^\d+$/.test(value) && Number(value) >= 1, "Enter at least 1.")
    .refine((value) => Number(value) <= available, `Only ${available} left.`);
}

export const addressFormSchema = z
  .object({
    label: z.string(),
    recipient_name: lettersOnlyField("Enter the recipient name."),
    line1: z.string().trim().min(1, "Enter address line 1."),
    line2: z.string(),
    city: lettersOnlyField("Enter a city.", 60),
    state: lettersOnlyField("Enter a state or region.", 60),
    postal_code: z.string().trim().min(1, "Enter a postal code."),
    country: z.enum(["IN", "US"], { message: "Choose a country." }),
    phone: z.string(),
  })
  .superRefine((data, ctx) => {
    const postalCode = data.postal_code.trim();
    if (data.country === "IN" && !/^\d{6}$/.test(postalCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid 6-digit PIN code.",
        path: ["postal_code"],
      });
    }
    if (data.country === "US" && !/^\d{5}(-\d{4})?$/.test(postalCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid US ZIP code (5 or 9 digits).",
        path: ["postal_code"],
      });
    }
  });

export function safeNext(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return null;
  }
  return value;
}
