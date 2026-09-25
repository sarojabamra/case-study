import { changePasswordSchema, profileSchema } from "@/utils/schemas";

describe("profileSchema", () => {
  it("accepts a valid full name", () => {
    const result = profileSchema.safeParse({ full_name: "Jane Doe" });
    expect(result.success).toBe(true);
  });

  it("rejects names with digits", () => {
    const result = profileSchema.safeParse({ full_name: "Jane2" });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("requires matching new passwords", () => {
    const result = changePasswordSchema.safeParse({
      current_password: "oldpass99",
      new_password: "newpass99",
      confirm_new_password: "different",
    });
    expect(result.success).toBe(false);
  });

  it("rejects reusing the current password", () => {
    const result = changePasswordSchema.safeParse({
      current_password: "samepass1",
      new_password: "samepass1",
      confirm_new_password: "samepass1",
    });
    expect(result.success).toBe(false);
  });
});
