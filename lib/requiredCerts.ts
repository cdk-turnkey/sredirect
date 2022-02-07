import { assert } from "console";
import { Redirect } from "./index";
import { RedirectType } from "./RedirectType";
export function requiredCerts(redirects: [Redirect, ...Redirect[]]) {
  const slds = redirects.reduce((prev, curr) => {
    const SECOND_LEVEL_DOMAIN_NAME_POSITION = -2;
    const names = curr.from.split(".").filter((name) => name !== "");
    const sld = names.slice(SECOND_LEVEL_DOMAIN_NAME_POSITION).join(".");
    if (names.length > 2) {
      return prev.add(`*.${sld}`);
    }
    return prev.add(sld);
  }, new Set());
  return Array.from(slds).sort((a, b) => {
    function assertString(input: unknown): asserts input is string {
      assert(typeof input === "string");
    }
    assertString(a);
    if (a.match(/[*]/)) {
      return 1;
    }
    return -1;
  });
}

// can you get certs where you include the trailing '.' for the root domain?
