import { URL } from "url";
import { isSubdomain } from "./isSubdomain";

export const zoneNameMap = (domainNames: string[]): Map<string, string> => {
  return domainNames
    .sort((a, b) => {
      if (a.length < b.length) {
        return -1;
      }
      if (a.length > b.length) {
        return 1;
      }
      return 0;
    })
    .reduce((domainNameMap, domainName) => {
      for (const zoneName of domainNameMap.values()) {
        if (
          isSubdomain(
            new URL(`https://${domainName}`),
            new URL(`https://${zoneName}`)
          )
        ) {
          return domainNameMap.set(domainName, zoneName);
        }
      }
      return domainNameMap.set(domainName, domainName);
    }, new Map<string, string>());
};
