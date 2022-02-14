import { requiredCerts } from "./requiredCerts";
import { Redirect } from "./index";
import { RedirectType } from "./RedirectType";
import { URL } from "url";

describe("requiredCerts", () => {
  test.each([
    {
      redirects: [
        new Redirect(
          new URL("https://test1.douglas-naphas.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
      ],
      expected: ["*.douglas-naphas.org"],
    },
    {
      redirects: [
        new Redirect(
          new URL("https://test1.douglas-naphas.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://douglas-naphas.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
      ],
      expected: ["douglas-naphas.org", "*.douglas-naphas.org"],
    },
    {
      redirects: [
        new Redirect(
          new URL("https://test1.bbb.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://test1.aaa.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://test1.douglas-naphas.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://douglas-naphas.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
      ],
      expected: [
        "douglas-naphas.org",
        "*.aaa.org",
        "*.bbb.org",
        "*.douglas-naphas.org",
      ],
    },
    {
      redirects: [
        new Redirect(
          new URL("https://test1.bbb.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://test1.aaa.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://r.zzz.com"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://test1.douglas-naphas.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://douglas-naphas.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://zzz.com"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
      ],
      expected: [
        "douglas-naphas.org",
        "zzz.com",
        "*.aaa.org",
        "*.bbb.org",
        "*.douglas-naphas.org",
        "*.zzz.com",
      ],
    },
    {
      redirects: [
        new Redirect(
          new URL("https://test1.bbb.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://test1.aaa.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://r.zzz.com"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://test1.douglas-naphas.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://douglas-naphas.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://abc.def.ghi.com"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://zzz.com"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
      ],
      expected: [
        "douglas-naphas.org",
        "zzz.com",
        "*.aaa.org",
        "*.bbb.org",
        "*.douglas-naphas.org",
        "*.ghi.com",
        "*.zzz.com",
      ],
    },
    {
      redirects: [
        new Redirect(
          new URL("https://test1.bbb.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://test1.aaa.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://ghi.com"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://r.zzz.com"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://test1.douglas-naphas.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://douglas-naphas.org"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://abc.def.ghi.com"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://zzz.com"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
      ],
      expected: [
        "douglas-naphas.org",
        "ghi.com",
        "zzz.com",
        "*.aaa.org",
        "*.bbb.org",
        "*.douglas-naphas.org",
        "*.ghi.com",
        "*.zzz.com",
      ],
    },
    {
      redirects: [
        new Redirect(
          new URL("https://www.newspaper.co.uk"),
          new URL("https://elsewhere.com"),
          RedirectType.FOUND
        ),
      ],
      expected: ["*.newspaper.co.uk"],
    },
  ])("requiredCerts($redirects) -> $expected", ({ redirects, expected }) => {
    const assertNonEmptyRedirectArray: (
      input: unknown
    ) => asserts input is [Redirect, ...Redirect[]] = (
      input: any
    ): asserts input is [Redirect, ...Redirect[]] => {
      if (!Array.isArray(input)) {
        throw new Error("input is not an array");
      }
      if (input.length < 1) {
        throw new Error("input length < 1");
      }
    };
    assertNonEmptyRedirectArray(redirects);
    expect(requiredCerts(redirects)).toEqual(expected);
  });
});
