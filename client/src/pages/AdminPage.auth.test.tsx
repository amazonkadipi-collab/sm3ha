// @vitest-environment jsdom
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  adminLoginCard: vi.fn(() => (
    <div data-testid="admin-login-card">
      <input aria-label="اسم المستخدم" />
      <input aria-label="كلمة المرور" />
      <button type="button">دخول admin</button>
    </div>
  )),
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: mocks.useAuth }));
vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AdminLoginCard: mocks.adminLoginCard,
}));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ admin: { listCatalog: { invalidate: vi.fn() } } }),
    admin: {
      listCatalog: { useQuery: () => ({ data: [], isLoading: false }) },
      previewImport: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      commitImport: { useMutation: () => ({ mutate: vi.fn(), isPending: false, data: null }) },
      setSongStatus: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    youtube: { search: { useQuery: () => ({ data: undefined, isFetching: false, isError: false }) } },
  },
}));

import AdminPage from "./AdminPage";

describe("Admin access gate", () => {
  beforeEach(() => {
    mocks.useAuth.mockReset();
    mocks.adminLoginCard.mockClear();
  });

  it("offers credential login to a signed-in non-admin instead of blocking the route", () => {
    mocks.useAuth.mockReturnValue({ user: { role: "user" }, loading: false });

    render(<AdminPage />);

    expect(screen.getByTestId("admin-login-card")).toBeTruthy();
    expect(screen.getByRole("button", { name: "دخول admin" })).toBeTruthy();
    expect(mocks.adminLoginCard).toHaveBeenCalledTimes(1);
  });
});
