import { Redirect } from "./index";
import { RedirectType } from "./RedirectType";
export function requiredCerts(redirects: [Redirect, ...Redirect[]]) {
  return ["*.douglas-naphas.org"];
}
