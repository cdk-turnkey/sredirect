import { URL } from "url";
import { isSubdomain } from "./isSubdomain";

export const zoneNames = (urls: URL[]): string[] => {
  const urlsSorted = urls.sort((a, b) => {
    if (a.hostname.length < b.hostname.length) {
      return -1;
    }
    if (a.hostname.length > b.hostname.length) {
      return 1;
    }
    return 0;
  });
  const s: Set<string> = new Set();
  urls.reduce((acc, curr) => {
    for (const e of s) {
      if (isSubdomain(curr, new URL(`https://${e}`))) {
        return acc;
      }
    }
    return acc.add(curr.hostname);
  }, s);
  return Array.from(s);
};
