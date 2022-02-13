import { URL } from "url";
/**
 * isSubdomain(new URL("https://a.b.c.com"), new URL("https://c.com")) // true
 */
export const isSubdomain = (a: URL, b: URL): boolean => {
  const aLabels = a.hostname.split(".").reverse();
  const bLabels = b.hostname.split(".").reverse();
  if (bLabels.length >= aLabels.length) {
    return false;
  }
  let mismatch = false;
  bLabels.forEach((bLabel, i) => {
    if (aLabels[i] != bLabel) {
      mismatch = true;
    }
  });
  return !mismatch;
};
