// @vitest-environment jsdom
import React from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("./contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }),
}));
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
  useLocation: () => ["/", vi.fn()] as const,
}));
vi.mock("@/lib/trpc", () => ({ trpc: { observability: { track: { useMutation: () => ({ mutate: vi.fn() }) } } } }));

let PublicLayout: typeof import("./App").PublicLayout;
beforeAll(async () => { PublicLayout = (await import("./App")).PublicLayout; });

beforeEach(() => { document.body.innerHTML = ""; });

describe("public shell runtime", () => {
  it("opens and closes the mobile menu and exposes its links", () => {
    render(<PublicLayout><div>محتوى</div></PublicLayout>);
    const toggle = screen.getByRole("button", { name: "فتح القائمة" });
    const navigation = screen.getByRole("navigation", { name: "التنقل الرئيسي" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "إغلاق القائمة" }).getAttribute("aria-expanded")).toBe("true");
    expect(navigation.className).toContain("flex");
    fireEvent.click(screen.getAllByRole("link", { name: "جديد البحث" })[0]);
    expect(screen.getByRole("button", { name: "فتح القائمة" }).getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps the reference-style footer destinations available", () => {
    render(<PublicLayout><div>محتوى</div></PublicLayout>);
    expect(screen.getAllByRole("link", { name: "جديد البحث" }).some(link => link.getAttribute("href") === "/trending")).toBe(true);
    expect(screen.getByRole("link", { name: "اتصل بنا" }).getAttribute("href")).toBe("/contact");
    expect(screen.getByRole("link", { name: "طلبات السحب" }).getAttribute("href")).toBe("/dmca");
  });
});
