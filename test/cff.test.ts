import { URL } from "url";
import { Redirect } from "../lib";
import { assertNonEmptyRedirectArray } from "../lib/assertNonEmptyRedirectArray";
import { RedirectType } from "../lib/RedirectType";
describe("CFF code for 'stack has the expected CFF(s) 3'", () => {
  describe("path /", () => {
    const handlerWithNestedFor = (event: any): any => {
      var legend: any = [
        {
          host: "fromme.com",
          querystring: { "participant-id": "4499" },
          value: "https://docs.google.com/edit/zzbbaajj",
        },
        {
          host: "other-fromme.com",
          querystring: {},
          value: "https://tome.com",
        },
      ];
      var request = event.request;
      var response: any = {
        statusCode: 302,
        statusDescription: "Found",
      };

      outer: for (var i = 0; i < legend.length; i++) {
        if (legend[i].host != request.headers.host) {
          continue outer;
        }
        var querystringEntries: any = Object.entries(legend[i].querystring);
        inner: for (var j = 0; j < querystringEntries.length; j++) {
          if (!request.querystring[querystringEntries[j][0]]) {
            continue outer;
          }
          if (
            request.querystring[querystringEntries[j][0]] !=
            querystringEntries[j][1]
          ) {
            continue outer;
          }
        }
        response.headers = { location: { value: legend[i].value } };
        return response;
      }
      return { statusCode: 404, statusDescription: "Not Found" };
    };
    const handlerWithMapLookup = (event: any): any => {
      var legend: any = {
        "fromme.com": [
          {
            querystring: { "participant-id": "4499" },
            locationValue: "https://docs.google.com/edit/zzbbaajj",
          },
        ],
        "other-fromme.com": [
          {
            querystring: {},
            locationValue: "https://tome.com",
          },
        ],
      };
      var request = event.request;
      var response404 = {
        statusCode: 404,
        statusDescription: "Not Found",
      };
      if (!request.headers.host) {
        return response404;
      }
      if (typeof request.headers.host != "string") {
        return response404;
      }
      if (!legend[request.headers.host]) {
        return response404;
      }
      for (var i = 0; i < legend[request.headers.host].length; i++) {
        var legendQuerystringEntries = Object.entries(
          legend[request.headers.host][i].querystring
        );

        for (var j = 0; j < legendQuerystringEntries.length; j++) {
          // all legendQuerystringEntries must be present on the request
          // if a single one isn't, send 404
          if (
            request.querystring[legendQuerystringEntries[j][0]] !=
            legendQuerystringEntries[j][1]
          ) {
            return response404;
          }
        }
        // if we got through the above loop, we have a host match and a query
        // string match, so return 302
        return {
          statusCode: 302,
          statusDescription: "Found",
          headers: {
            location: {
              value: legend[request.headers.host][i].locationValue,
            },
          },
        };
      }
      return response404;
    };
    test.each([
      {
        querystring: { "participant-id": "4499" },
        headers: { host: "fromme.com" },
        expected: "https://docs.google.com/edit/zzbbaajj",
      },
      {
        querystring: {},
        headers: { host: "other-fromme.com" },
        expected: "https://tome.com",
      },
    ])(
      "$querystring, $host -> $expected",
      ({ querystring, headers, expected }) => {
        expect(
          handlerWithNestedFor({ request: { querystring, headers } }).headers
            .location.value
        ).toEqual(expected);
        expect(
          handlerWithMapLookup({ request: { querystring, headers } }).headers
            .location.value
        ).toEqual(expected);
      }
    );
  });
});
describe("redirects2Legend", () => {
  type LegendValue = [
    {
      querystring: { [index: string]: string };
      locationValue: string;
    }
  ];
  interface Legend {
    [index: string]: LegendValue;
  }
  function legend2String(legend: Legend): string {
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
          `}\n` +
          `      locationValue: "${legendPair.locationValue}"\n` +
          `    },\n`;
      }
      st += `  ],\n`;
    }
    st += `}\n`;
    return st;
  }
  const redirects2Legend = (redirects: [Redirect, ...Redirect[]]): Legend => {
    // let ret: Legend
    // redirects.forEach(
    //   ret['g'] = [{querystring: {'a': 'b'}, locationValue: 'f'}]
    // )
    // return ret;
    // const ret: any = {}
    // ret['g'] = 3;
    // redirects.forEach(redirect => {
    //   ret[redirect.from.href] =
    // })
    // return ret;

    // first turn redirects into an object with all the redirects accumulated
    // into an array mapped to by their href

    const legend: any = {};
    redirects.forEach((redirect) => {
      if (!legend[redirect.from.origin]) {
        legend[redirect.from.origin] = [];
      }
      const querystring: any = {};
      for (const [queryParamName, queryParamValue] of redirect.from
        .searchParams) {
        querystring[queryParamName] = queryParamValue;
      }
      legend[redirect.from.origin].push({
        querystring,
        locationValue: redirect.to.href,
      });
    });
    return legend;
  };
  const redirects2LegendString = (
    redirects: [Redirect, ...Redirect[]]
  ): string => {
    return legend2String(redirects2Legend(redirects));
  };
  test.each([
    {
      redirects: [
        new Redirect(
          new URL("https://abc.com?q=123"),
          new URL("https://to.com?to=2"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://abc.com?q=123&r=stuv"),
          new URL("https://destination.com"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://uvw.xyz.com?q=123&r=stuv"),
          new URL("https://target.org/a/path"),
          RedirectType.FOUND
        ),
        new Redirect(
          new URL("https://uvw.xyz.com"),
          new URL("https://no-query-string.net"),
          RedirectType.FOUND
        ),
      ],
      expectedLegend: {
        "https://abc.com": [
          {
            querystring: { q: "123" },
            locationValue: "https://to.com/?to=2",
          },
          {
            querystring: { q: "123", r: "stuv" },
            locationValue: "https://destination.com/",
          },
        ],
        "https://uvw.xyz.com": [
          {
            querystring: { q: "123", r: "stuv" },
            locationValue: "https://target.org/a/path",
          },
          {
            querystring: {},
            locationValue: "https://no-query-string.net/",
          },
        ],
      },
      expectedString:
        `{\n` +
        `  "https://abc.com": [\n` +
        `    {\n ` +
        `      querystring: {"q": "123", }\n` +
        `      locationValue: "https://to.com/?to=2"\n` +
        `    },\n` +
        `    {\n ` +
        `      querystring: {"q": "123", "r": "stuv", }\n` +
        `      locationValue: "https://destination.com/"\n` +
        `    },\n` +
        `  ],\n` +
        `  "https://uvw.xyz.com": [\n` +
        `    {\n ` +
        `      querystring: {"q": "123", "r": "stuv", }\n` +
        `      locationValue: "https://target.org/a/path"\n` +
        `    },\n` +
        `    {\n ` +
        `      querystring: {}\n` +
        `      locationValue: "https://no-query-string.net/"\n` +
        `    },\n` +
        `  ],\n` +
        `}\n`,
    },
  ])(
    "$redirects -> $expected",
    ({ redirects, expectedLegend, expectedString }) => {
      assertNonEmptyRedirectArray(redirects);
      expect(redirects2LegendString(redirects)).toEqual(expectedString);
      expect(redirects2Legend(redirects)).toEqual(expectedLegend);
    }
  );
});
