import { isSubdomain } from "./isSubdomain";
import { URL } from "url";

describe("isSubdomain", () => {
  test.each([
    {
      a: "https://a.b.c.com",
      b: "https://c.com",
      expected: true,
    },
    {
      a: "https://a.b.c.com",
      b: "https://a.com",
      expected: false,
    },
    {
      a: "https://xyz.co.uk",
      b: "https://xyz.co.uk",
      expected: false,
    },
    {
      a: "https://www.xyz.co.uk",
      b: "https://xyz.co.uk",
      expected: true,
    },
  ])(
    "isSubdomain(new URL($a), new URL($b)) -> $expected",
    ({ a, b, expected }) => {
      expect(isSubdomain(new URL(a), new URL(b))).toEqual(expected);
    }
  );
});
