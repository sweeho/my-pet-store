import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readCookie } from "../../utils/cookies";
import { useCatalogLocale } from "./shared";

/**
 * UNIT TEST (jsdom)
 *
 * Covers useCatalogLocale() directly (PLAN.md § Definition of Done): the hook has
 * only ever been exercised through the four catalog page tests, so a resolution
 * order regression here would otherwise surface as confusing page-test failures.
 * Wrapped in MemoryRouter because the hook reads/writes the "locale" search param
 * via react-router's useSearchParams.
 */
function jsonResponse(body: unknown, init: { ok: boolean; status?: number } = { ok: true }) {
  return { ok: init.ok, status: init.status ?? (init.ok ? 200 : 400), json: async () => body };
}

const fetchMock = vi.fn();

function wrapperFor(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(MemoryRouter, { initialEntries: [initialEntry] }, children);
  };
}

function mockNoSession() {
  fetchMock.mockImplementation((url: string) => {
    if (url.startsWith("/api/customer")) {
      return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
    }
    throw new Error(`unexpected fetch: ${url}`);
  });
}

function mockSignedOn(preferredLanguage: string) {
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    if (url.startsWith("/api/customer") && (!init || init.method === undefined)) {
      return Promise.resolve(jsonResponse({ profile: { preferredLanguage } }));
    }
    if (url.startsWith("/api/customer") && init?.method === "PUT") {
      return Promise.resolve(jsonResponse({ profile: { preferredLanguage } }));
    }
    throw new Error(`unexpected fetch: ${url}`);
  });
}

describe("useCatalogLocale", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0]?.trim();
      if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  });

  it("RO-01: is null until the first resolution completes, when nothing is resolvable synchronously", async () => {
    mockNoSession();

    const { result } = renderHook(() => useCatalogLocale(), { wrapper: wrapperFor("/catalog") });

    expect(result.current.locale).toBeNull();

    await waitFor(() => expect(result.current.locale).toBe("en_US"));
  });

  it("RO-02: the locale search param resolves synchronously, without waiting on /api/customer", () => {
    mockNoSession();

    const { result } = renderHook(() => useCatalogLocale(), {
      wrapper: wrapperFor("/catalog?locale=zh_CN"),
    });

    expect(result.current.locale).toBe("zh_CN");
  });

  it("RO-03: the petstore_locale cookie resolves synchronously when no search param is present", () => {
    mockNoSession();
    document.cookie = "petstore_locale=ja_JP";

    const { result } = renderHook(() => useCatalogLocale(), { wrapper: wrapperFor("/catalog") });

    expect(result.current.locale).toBe("ja_JP");
  });

  it("RO-04: the search param wins over the cookie", () => {
    mockNoSession();
    document.cookie = "petstore_locale=ja_JP";

    const { result } = renderHook(() => useCatalogLocale(), {
      wrapper: wrapperFor("/catalog?locale=zh_CN"),
    });

    expect(result.current.locale).toBe("zh_CN");
  });

  it("RO-05: falls back to a signed-on customer's profile.preferredLanguage with no param or cookie", async () => {
    mockSignedOn("ja_JP");

    const { result } = renderHook(() => useCatalogLocale(), { wrapper: wrapperFor("/catalog") });

    await waitFor(() => expect(result.current.locale).toBe("ja_JP"));
  });

  it("RO-06: falls back to en_US with no param, no cookie, and no session", async () => {
    mockNoSession();

    const { result } = renderHook(() => useCatalogLocale(), { wrapper: wrapperFor("/catalog") });

    await waitFor(() => expect(result.current.locale).toBe("en_US"));
  });

  it("SL-01: setLocale writes the cookie, sets the search param, and sets document.documentElement.lang", async () => {
    mockNoSession();
    const { result } = renderHook(() => useCatalogLocale(), { wrapper: wrapperFor("/catalog") });
    await waitFor(() => expect(result.current.locale).toBe("en_US"));

    act(() => result.current.setLocale("ja_JP"));

    expect(readCookie("petstore_locale")).toBe("ja_JP");
    expect(document.documentElement.lang).toBe("ja_JP");
    await waitFor(() => expect(result.current.locale).toBe("ja_JP"));
  });

  it("SL-02: setLocale with no session never calls PUT /api/customer", async () => {
    mockNoSession();
    const { result } = renderHook(() => useCatalogLocale(), { wrapper: wrapperFor("/catalog") });
    await waitFor(() => expect(result.current.locale).toBe("en_US"));
    fetchMock.mockClear();

    act(() => result.current.setLocale("ja_JP"));

    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/customer",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("SL-03: setLocale while a session exists sends the new value to PUT /api/customer as profile.preferredLanguage", async () => {
    mockSignedOn("en_US");
    const { result } = renderHook(() => useCatalogLocale(), { wrapper: wrapperFor("/catalog") });
    await waitFor(() => expect(result.current.locale).toBe("en_US"));

    act(() => result.current.setLocale("zh_CN"));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/customer",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ profile: { preferredLanguage: "zh_CN" } }),
        }),
      ),
    );
  });

  it("SL-04: a 401 from the PUT leaves the chosen locale applied and raises no error state", async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.startsWith("/api/customer") && init?.method === "PUT") {
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      }
      if (url.startsWith("/api/customer")) {
        return Promise.resolve(jsonResponse({ profile: { preferredLanguage: "en_US" } }));
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    const { result } = renderHook(() => useCatalogLocale(), { wrapper: wrapperFor("/catalog") });
    await waitFor(() => expect(result.current.locale).toBe("en_US"));

    act(() => result.current.setLocale("zh_CN"));

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === "PUT")).toBe(true),
    );
    expect(result.current.locale).toBe("zh_CN");
  });
});
