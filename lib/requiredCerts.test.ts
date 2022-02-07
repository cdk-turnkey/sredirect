import { requiredCerts } from "./requiredCerts";
import { Redirect } from "./index";
import { RedirectType } from "./RedirectType";

describe("requiredCerts", () => {
  test.each([
    {
      redirects: [
        new Redirect(
          "test1.douglas-naphas.org",
          "https://example.com",
          RedirectType.FOUND
        ),
      ],
      expected: ["*.douglas-naphas.org"],
    },
    {
      redirects: [
        new Redirect(
          "test1.douglas-naphas.org",
          "https://example.com",
          RedirectType.FOUND
        ),
        new Redirect(
          "douglas-naphas.org",
          "https://example.com",
          RedirectType.FOUND
        ),
      ],
      expected: ["douglas-naphas.org", "*.douglas-naphas.org"],
    },
    {
      redirects: [
        new Redirect(
          "test1.bbb.org",
          "https://example.com",
          RedirectType.FOUND
        ),
        new Redirect(
          "test1.aaa.org",
          "https://example.com",
          RedirectType.FOUND
        ),
        new Redirect(
          "test1.douglas-naphas.org",
          "https://example.com",
          RedirectType.FOUND
        ),
        new Redirect(
          "douglas-naphas.org",
          "https://example.com",
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
          "test1.bbb.org",
          "https://example.com",
          RedirectType.FOUND
        ),
        new Redirect(
          "test1.aaa.org",
          "https://example.com",
          RedirectType.FOUND
        ),
        new Redirect("r.zzz.com", "https://example.com", RedirectType.FOUND),
        new Redirect(
          "test1.douglas-naphas.org",
          "https://example.com",
          RedirectType.FOUND
        ),
        new Redirect(
          "douglas-naphas.org",
          "https://example.com",
          RedirectType.FOUND
        ),
        new Redirect("zzz.com", "https://example.com", RedirectType.FOUND),
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
          "test1.bbb.org",
          "https://example.com",
          RedirectType.FOUND
        ),
        new Redirect(
          "test1.aaa.org",
          "https://example.com",
          RedirectType.FOUND
        ),
        new Redirect("r.zzz.com", "https://example.com", RedirectType.FOUND),
        new Redirect(
          "test1.douglas-naphas.org",
          "https://example.com",
          RedirectType.FOUND
        ),
        new Redirect(
          "douglas-naphas.org",
          "https://example.com",
          RedirectType.FOUND
        ),
        new Redirect(
          "abc.def.ghi.com",
          "https://example.com",
          RedirectType.FOUND
        ),
        new Redirect("zzz.com", "https://example.com", RedirectType.FOUND),
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
          "test1.bbb.org",
          "https://example.com",
          RedirectType.FOUND
        ),
        new Redirect(
          "test1.aaa.org",
          "https://example.com",
          RedirectType.FOUND
        ),
        new Redirect("ghi.com", "https://example.com", RedirectType.FOUND),
        new Redirect("r.zzz.com", "https://example.com", RedirectType.FOUND),
        new Redirect(
          "test1.douglas-naphas.org",
          "https://example.com",
          RedirectType.FOUND
        ),
        new Redirect(
          "douglas-naphas.org",
          "https://example.com",
          RedirectType.FOUND
        ),
        new Redirect(
          "abc.def.ghi.com",
          "https://example.com",
          RedirectType.FOUND
        ),
        new Redirect("zzz.com", "https://example.com", RedirectType.FOUND),
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
