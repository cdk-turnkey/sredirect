import { zoneNames } from "./zoneNames";
import { URL } from "url";

describe("zoneNames", () => {
  test.each([
    {
      description: "minimal, just fromme.com",
      urls: [new URL("https://fromme.com")],
      expected: ["fromme.com"],
    },
    {
      description: "a tree under a second-level domain",
      urls: [
        new URL("https://a.com"),
        new URL("https://c.b.a.com"),
        new URL("https://e.d.c.b.a.com"),
      ],
      expected: ["a.com"],
    },
    {
      description: "subdomain comes before parent domain in the list",
      urls: [
        new URL("https://test-302.douglas-naphas.org"),
        new URL("https://douglas-naphas.org"),
      ],
      expected: ["douglas-naphas.org"],
    },
  ])("$description", ({ urls, expected }) => {
    expect(zoneNames(urls)).toEqual(expected);
  });
});
