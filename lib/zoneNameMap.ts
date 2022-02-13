import { URL } from "url";
import { isSubdomain } from "./isSubdomain";

export const zoneNameMap = (domainNames: string[]): Map<string, string> => {
  return domainNames.reduce((domainNameMap, domainName) => {
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
