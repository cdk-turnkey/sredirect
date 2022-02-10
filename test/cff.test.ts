describe("CFF code for 'stack has the expected CFF(s) 3'", () => {
  describe("path /", () => {
    const handler = (event: any): any => {
      var request = event.request;
      var response = {
        statusCode: 302,
        statusDescription: "Found",
        headers: {
          location: {
            value: "https://docs.google.com/edit/zzbbaajj",
          },
        },
      };

      return response;
    };
    test.each([
      {
        querystring: { "participant-id": "4499" },
        host: "fromme.com",
        expected: "https://docs.google.com/edit/zzbbaajj",
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
