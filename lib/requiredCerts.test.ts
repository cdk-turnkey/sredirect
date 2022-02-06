import { requiredCerts } from "./requiredCerts";
import { Redirect, RedirectType } from "./index";

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
