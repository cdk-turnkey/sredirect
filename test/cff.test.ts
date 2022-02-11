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
