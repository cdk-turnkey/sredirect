import { assert } from "console";
import { Redirect } from "./index";
import { RedirectType } from "./RedirectType";
const psl = require("psl");
export function requiredCerts(redirects: [Redirect, ...Redirect[]]) {
  const slds = redirects.reduce((prev, curr) => {
    const parsedFromDomain = psl.parse(curr.from.hostname);
    const sld = psl.get(curr.from.hostname);
    if (
      parsedFromDomain.subdomain &&
      parsedFromDomain.subdomain.split &&
      parsedFromDomain.subdomain.split(".").length > 0
    ) {
      return prev.add(`*.${sld}`);
    }
    return prev.add(sld);
  }, new Set());
  return Array.from(slds)
    .sort()
    .reverse()
    .sort((a, b) => {
      function assertString(input: unknown): asserts input is string {
        assert(typeof input === "string");
      }
      assertString(a);
      assertString(b);
      if (a.match(/[*]/) && !b.match(/[*]/)) {
        return 1;
      }
      return a < b ? -1 : 0;
    });
}

// can you get certs where you include the trailing '.' for the root domain?
