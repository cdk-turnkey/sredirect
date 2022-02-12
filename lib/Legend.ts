import { Redirect } from ".";

export type LegendValue = [
  {
    querystring: { [index: string]: string };
    locationValue: string;
  }
];
export interface Legend {
  [index: string]: LegendValue;
}
export function legend2String(legend: Legend): string {
  let st = `{\n`;
  for (const [legendKey, legendValue] of Object.entries(legend)) {
    st += `  "${legendKey}": [\n`;
    for (const legendPair of legendValue) {
      st += `    {\n ` + `      querystring: {`;
      for (const [queryParamName, queryParamValue] of Object.entries(
        legendPair.querystring
      )) {
        st += `"${queryParamName}": "${queryParamValue}", `;
      }
      st +=
        `},\n` +
        `      locationValue: "${legendPair.locationValue}"\n` +
        `    },\n`;
    }
    st += `  ],\n`;
  }
  st += `}\n`;
  return st;
}
export const redirects2Legend = (
  redirects: [Redirect, ...Redirect[]]
): Legend => {
  const legend: any = {};
  redirects.forEach((redirect) => {
    if (!legend[redirect.from.hostname]) {
      legend[redirect.from.hostname] = [];
    }
    const querystring: any = {};
    for (const [queryParamName, queryParamValue] of redirect.from
      .searchParams) {
      querystring[queryParamName] = queryParamValue;
    }
    legend[redirect.from.hostname].push({
      querystring,
      locationValue: redirect.to.href,
    });
  });
  return legend;
};
export const redirects2LegendString = (
  redirects: [Redirect, ...Redirect[]]
): string => {
  return legend2String(redirects2Legend(redirects));
};
