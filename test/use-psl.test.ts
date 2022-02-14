var psl = require("psl");
test("use psl", () => {
  var parsed = psl.parse("a.b.c.d.foo.com");
  console.log(parsed.tld); // 'com'
  console.log(parsed.sld); // 'foo'
  console.log(parsed.domain); // 'foo.com'
  console.log(parsed.subdomain); // 'a.b.c.d'
});
