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
    {
      description: "3",
      domainNames: [
        "a.com",
        "c.b.a.com",
        "e.d.c.b.a.com",
        "rst.net",
        "www.my-domain.com",
        "my-other-domain.com",
        "www.my-other-domain.com",
      ],
      expected: (() => {
        const m = new Map<string, string>();
        m.set("a.com", "a.com");
        m.set("c.b.a.com", "a.com");
        m.set("e.d.c.b.a.com", "a.com");
        m.set("rst.net", "rst.net");
        m.set("www.my-domain.com", "www.my-domain.com");
        m.set("my-other-domain.com", "my-other-domain.com");
        m.set("www.my-other-domain.com", "my-other-domain.com");
        return m;
      })(),
    },
    {
      description: "4: subdomain listed before parent domain",
      domainNames: ["e.d.c.b.a.com", "a.com", "c.b.a.com", ],
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
