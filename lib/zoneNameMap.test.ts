import { zoneNameMap } from "./zoneNameMap";
import { URL } from "url";

describe("zoneNames", () => {
  test.each([
    {
      description: "1",
      domainNames: ["fromme.com"],
      expected: (() => {
        const m = new Map<string, string>();
        m.set("fromme.com", "fromme.com");
        return m;
      })(),
    },
    {
      description: "2",
      domainNames: ["a.com", "c.b.a.com", "e.d.c.b.a.com"],
      expected: (() => {
        const m = new Map<string, string>();
        m.set("a.com", "a.com");
        m.set("c.b.a.com", "a.com");
        m.set("e.d.c.b.a.com", "a.com");
        return m;
      })(),
    },
  ])("$description", ({ domainNames, expected }) => {
    expect(zoneNameMap(domainNames)).toEqual(expected);
  });
});
