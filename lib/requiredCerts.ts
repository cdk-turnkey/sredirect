import { Redirect, RedirectType } from "./index";
export function requiredCerts(redirects: [Redirect, ...Redirect[]]) {
  return ["*.douglas-naphas.org"];
}
