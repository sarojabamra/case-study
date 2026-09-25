import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import type { AddressPage, Me, UserAddress } from "@/services/types";
import { AccountPage } from "@/pages/AccountPage";

const mockUser: Me = {
  id: 1,
  username: "testuser",
  full_name: "Test User",
  role: "USER",
  tenant_id: null,
  tenant_name: null,
};

const homeAddress: UserAddress = {
  id: 10,
  label: "Home",
  recipient_name: "Test User",
  line1: "123 Main Street",
  line2: null,
  city: "Mumbai",
  state: "Maharashtra",
  postal_code: "400001",
  country: "IN",
  phone: "9000000000",
  is_default: true,
};

const officeAddress: UserAddress = {
  id: 11,
  label: "Office",
  recipient_name: "Test User",
  line1: "45 Park Lane",
  line2: null,
  city: "Pune",
  state: "Maharashtra",
  postal_code: "411001",
  country: "IN",
  phone: null,
  is_default: false,
};

const refreshUser = jest.fn<() => Promise<Me | null>>();
const apiMock = jest.fn();

jest.mock("@/utils/authSession", () => ({
  useAuth: () => ({
    user: mockUser,
    status: "ready" as const,
    studioNote: false,
    dismissStudioNote: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshUser,
  }),
}));

jest.mock("@/services/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

jest.mock("@/utils/title", () => ({
  useDocumentTitle: jest.fn(),
}));

jest.mock("@/utils/toast", () => ({
  toastStore: {
    success: jest.fn(),
    failure: jest.fn(),
  },
  toastFailure: jest.fn(),
}));

function renderAccountPage() {
  return render(
    <MemoryRouter>
      <AccountPage />
    </MemoryRouter>,
  );
}

function addressesResponse(addresses: UserAddress[]): AddressPage {
  return { addresses };
}

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  jest.clearAllMocks();
  refreshUser.mockResolvedValue(mockUser);

  apiMock.mockImplementation(async (path: string, options?: { method?: string; body?: string }) => {
    const method = options?.method ?? "GET";

    if (path === "/addresses/" && method === "GET") {
      return addressesResponse([homeAddress, officeAddress]);
    }

    if (path === "/auth/me" && method === "PATCH") {
      return { ...mockUser, full_name: JSON.parse(options!.body!).full_name };
    }

    if (path === "/auth/change-password" && method === "POST") {
      return { message: "Password updated successfully" };
    }

    if (path.startsWith("/addresses/") && method === "PUT") {
      const id = Number(path.split("/").pop());
      const body = options?.body ? JSON.parse(options.body) : {};
      const base = id === homeAddress.id ? homeAddress : officeAddress;
      return { ...base, ...body };
    }

    if (path.startsWith("/addresses/") && method === "DELETE") {
      return undefined;
    }

    if (path === "/addresses/" && method === "POST") {
      const body = JSON.parse(options!.body!);
      return {
        id: 99,
        label: body.label,
        recipient_name: body.recipient_name,
        line1: body.line1,
        line2: body.line2,
        city: body.city,
        state: body.state,
        postal_code: body.postal_code,
        country: body.country,
        phone: body.phone,
        is_default: body.is_default,
      } satisfies UserAddress;
    }

    throw new Error(`Unhandled api mock: ${method} ${path}`);
  });
});

describe("AccountPage", () => {
  it("shows only profile, addresses, and password sections", async () => {
    renderAccountPage();

    expect(await screen.findByRole("heading", { name: "Your account" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Saved addresses" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Password" })).toBeInTheDocument();

    expect(screen.queryByRole("link", { name: /orders/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /favourites/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /log out/i })).not.toBeInTheDocument();
  });

  it("saves profile changes", async () => {
    const user = userEvent.setup();
    renderAccountPage();

    const fullName = await screen.findByLabelText("Full name");
    await user.clear(fullName);
    await user.type(fullName, "Updated Name");
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ full_name: "Updated Name" }),
      });
    });
    expect(refreshUser).toHaveBeenCalled();
  });

  it("lists saved addresses with a default marker", async () => {
    renderAccountPage();

    expect(await screen.findByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Office")).toBeInTheDocument();
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Set as default" })).toBeInTheDocument();
  });

  it("sets another address as default", async () => {
    const user = userEvent.setup();
    renderAccountPage();

    await screen.findByText("Office");
    await user.click(screen.getByRole("button", { name: "Set as default" }));

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(`/addresses/${officeAddress.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_default: true }),
      });
    });
  });

  it("removes an address after confirmation", async () => {
    const user = userEvent.setup();
    renderAccountPage();

    await screen.findByText("Office");
    const officeCard = screen.getByText("Office").closest("li");
    expect(officeCard).not.toBeNull();
    await user.click(within(officeCard!).getByRole("button", { name: "Remove" }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(`/addresses/${officeAddress.id}`, { method: "DELETE" });
    });
  });

  it("updates password", async () => {
    const user = userEvent.setup();
    renderAccountPage();

    await screen.findByRole("heading", { name: "Password" });
    await user.type(screen.getByLabelText("Current password"), "password123");
    await user.type(screen.getByLabelText("New password"), "newpass99");
    await user.type(screen.getByLabelText("Confirm new password"), "newpass99");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: "password123",
          new_password: "newpass99",
        }),
      });
    });
  });

  it("creates a new address from the address form", async () => {
    const user = userEvent.setup();
    apiMock.mockImplementation(async (path: string, options?: { method?: string; body?: string }) => {
      const method = options?.method ?? "GET";
      if (path === "/addresses/" && method === "GET") {
        return addressesResponse([]);
      }
      if (path === "/addresses/" && method === "POST") {
        return {
          id: 99,
          label: "Work",
          recipient_name: "Test User",
          line1: "1 Market Road",
          line2: null,
          city: "Delhi",
          state: "Delhi",
          postal_code: "110001",
          country: "IN",
          phone: null,
          is_default: true,
        } satisfies UserAddress;
      }
      throw new Error(`Unhandled api mock: ${method} ${path}`);
    });

    renderAccountPage();

    await screen.findByText("No saved addresses yet.");
    await user.click(screen.getByRole("button", { name: "Add address" }));

    await user.type(screen.getByLabelText("Label (optional)"), "Work");
    await user.type(screen.getByLabelText("Recipient name"), "Test User");
    await user.type(screen.getByLabelText("Address line 1"), "1 Market Road");
    await user.type(screen.getByLabelText("City"), "Delhi");
    await user.type(screen.getByLabelText("State"), "Delhi");
    await user.type(screen.getByLabelText("PIN code"), "110001");
    await user.click(screen.getByRole("button", { name: "Save address" }));

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/addresses/",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"recipient_name":"Test User"'),
        }),
      );
    });
  });
});
