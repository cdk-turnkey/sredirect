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
      var response: any = {
        statusCode: 302,
        statusDescription: "Found",
      };
      if (!legend[request.headers && request.headers.host]) {
      }
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
      }
    );
  });
});
