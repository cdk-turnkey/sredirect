describe("CFF code for 'stack has the expected CFF(s) 3'", () => {
  describe("path /", () => {
    const handler = (event: any): any => {
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
        if (legend[i].host != request.host) {
          console.log("legend host:");
          console.log(legend[i].host);
          console.log("request host:");
          console.log(request.host);
          console.log("mismatch 0");
          continue outer;
        }
        var querystringEntries: any = Object.entries(legend[i].querystring);
        inner: for (var j = 0; j < querystringEntries.length; j++) {
          if (!request.querystring[querystringEntries[j][0]]) {
            console.log("request:");
            console.log(request);
            console.log("querystringEntries[j].key:");
            console.log(querystringEntries[j][0]);
            console.log("mismatch 1");
            continue outer;
          }
          if (
            request.querystring[querystringEntries[j][0]] !=
            querystringEntries[j][1]
          ) {
            console.log("mismatch 2");
            continue outer;
          }
        }
        console.log("match!");
        response.headers = { location: { value: legend[i].value } };
        return response;
      }
      return { statusCode: 404, statusDescription: "Not Found" };
    };
    test.each([
      {
        querystring: { "participant-id": "4499" },
        host: "fromme.com",
        expected: "https://docs.google.com/edit/zzbbaajj",
      },
      {
        querystring: {},
        host: "other-fromme.com",
        expected: "https://tome.com",
      },
    ])(
      "$querystring, $host -> $expected",
      ({ querystring, host, expected }) => {
        expect(
          handler({ request: { querystring, host } }).headers.location.value
        ).toEqual(expected);
      }
    );
  });
});
