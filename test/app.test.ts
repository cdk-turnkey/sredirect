import { Capture, Match, Template } from "aws-cdk-lib/assertions";
import * as cdk from "aws-cdk-lib";
import * as Lib from "../lib";
import { RedirectType } from "../lib/RedirectType";
import { URL } from "url";

const OLD_ENV = process.env;
let app: cdk.App;
const CFF_BEGINNING = `function handler(event) {\n` + `  var legend = `;
const CFF_BODY =
  `  var request = event.request;\n` +
  `  var response404 = {statusCode: 404, statusDescription: "Not Found"};\n` +
  `  if(!request.headers.host){return response404;}\n` +
  `  if(!request.headers.host.value){return response404;}\n` +
  `  if(typeof request.headers.host.value != "string"){return response404;}\n` +
  `  if(!legend[request.headers.host.value]){return response404;}\n` +
  `  for (var i = 0; i < legend[request.headers.host.value].length; i++) {\n` +
  `    var legendQuerystringEntries = Object.entries(\n` +
  `      legend[request.headers.host.value][i].querystring\n` +
  `  );\n` +
  `    for (var j = 0; j < legendQuerystringEntries.length; j++) {\n` +
  `      if(\n` +
  `        request.querystring[legendQuerystringEntries[j][0]] !=\n` +
  `        legendQuerystringEntries[j][1]\n` +
  `      ){return response404;}\n` +
  `    }\n` +
  `    return {\n` +
  `      statusCode: 302,` +
  `      statusDescription: "Found",` +
  `      headers: {` +
  `        location: {` +
  `          value: legend[request.headers.host.value][i].locationValue` +
  `        }` +
  `      }` +
  `    }` +
  `  }` +
  `  return response404;` +
  `}`;
const expectedCFFCode = (legendPart: string): string =>
  CFF_BEGINNING + legendPart + CFF_BODY;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...OLD_ENV };
  process.env.GITHUB_REPOSITORY = "githubuser/repo-name";
  process.env.GITHUB_REF = "refs/heads/master";
  app = new cdk.App();
});
afterAll(() => {
  process.env = { ...OLD_ENV };
});
test("can instantiate app stack", () => {
  const stack = new Lib.AppStack(app, "MyTestApp", {
    redirects: [
      new Lib.Redirect(
        new URL("https://abc.com"),
        new URL("https://example.com"),
        RedirectType.FOUND
      ),
    ],
  });
});
test("app stack contains a Hosted Zone", () => {
  const stack = new Lib.AppStack(app, "MyTestApp", {
    redirects: [
      new Lib.Redirect(
        new URL("https://abc.com"),
        new URL("https://example.com"),
        RedirectType.FOUND
      ),
    ],
  });
  const template = Template.fromStack(stack);
  template.resourceCountIs("AWS::Route53::HostedZone", 1);
});
test("stack has the expected CFF 1", () => {
  const stack = new Lib.AppStack(app, "MyTestApp", {
    redirects: [
      new Lib.Redirect(
        new URL("https://abc.com"),
        new URL("https://sites.google.com/view/douglas-naphas-org/home"),
        RedirectType.FOUND
      ),
    ],
  });
  const template = Template.fromStack(stack);
  const distributionConfigCapture = new Capture();
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: distributionConfigCapture,
  });
  const cffCapture = new Capture();
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: Match.objectLike({
      DefaultCacheBehavior: { FunctionAssociations: [cffCapture] },
    }),
  });
  const cffCode =
    template.toJSON().Resources[
      cffCapture.asObject().FunctionARN["Fn::GetAtt"][0]
    ].Properties.FunctionCode;
  const expectedFunctionCode = expectedCFFCode(
    `{\n` +
      `  "abc.com": [\n` +
      `    {\n ` +
      `      querystring: {},\n` +
      `      locationValue: "https://sites.google.com/view/douglas-naphas-org/home"\n` +
      `    },\n` +
      `  ],\n` +
      `}\n`
  );
  expect(cffCode).toEqual(expectedFunctionCode);
});
test("stack has the expected CFF 2", () => {
  const stack = new Lib.AppStack(app, "MyTestApp", {
    redirects: [
      new Lib.Redirect(
        new URL("https://abc.com"),
        new URL("https://somewhere-else.com"),
        RedirectType.FOUND
      ),
    ],
  });
  const template = Template.fromStack(stack);
  const distributionConfigCapture = new Capture();
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: distributionConfigCapture,
  });
  const cffCapture = new Capture();
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: Match.objectLike({
      DefaultCacheBehavior: { FunctionAssociations: [cffCapture] },
    }),
  });
  const cffCode =
    template.toJSON().Resources[
      cffCapture.asObject().FunctionARN["Fn::GetAtt"][0]
    ].Properties.FunctionCode;
  const expectedFunctionCode = expectedCFFCode(
    `{\n` +
      `  "abc.com": [\n` +
      `    {\n ` +
      `      querystring: {},\n` +
      `      locationValue: "https://somewhere-else.com/"\n` +
      `    },\n` +
      `  ],\n` +
      `}\n`
  );
  expect(cffCode).toEqual(expectedFunctionCode);
});
test("stack has the expected CFF(s) 3, complex redirects", () => {
  const stack = new Lib.AppStack(app, "MyTestApp", {
    redirects: [
      new Lib.Redirect(
        new URL("https://email.fromme.com"),
        new URL("https://tome.co/get/your/email/here"),
        RedirectType.FOUND
      ),
      new Lib.Redirect(
        new URL("https://fromme.com/apply"),
        new URL("https://appsite.us?status=new"),
        RedirectType.FOUND
      ),
      new Lib.Redirect(
        new URL("https://fromme.com/rules"),
        new URL("https://national-rules-site.org"),
        RedirectType.FOUND
      ),
      new Lib.Redirect(
        new URL("https://fromme.com/rules?category=stem"),
        new URL("https://national-rules-site.org/science-and-math"),
        RedirectType.FOUND
      ),
      new Lib.Redirect(
        new URL("https://fromme.com"),
        new URL("https://tome.com"),
        RedirectType.FOUND
      ),
      new Lib.Redirect(
        new URL("https://other-fromme.com"),
        new URL("https://tome.com"),
        RedirectType.FOUND
      ),
      new Lib.Redirect(
        new URL("https://other-from.com/review"),
        new URL("https://forms.google.com/view/?form_id=123abcxxx"),
        RedirectType.FOUND
      ),
      new Lib.Redirect(
        new URL("https://fromme.com?participant-id=4499"),
        new URL("https://docs.google.com/edit/zzbbaajj"),
        RedirectType.FOUND
      ),
    ],
  });

  // we expect:
  // 1 distro
  // 1 behavior per path...right?
  // each cff has to map from a particular set of {host, query param set} tuples
  // to destination URLs
  const expectedPseudoDistro = {
    defaultBehavior: {
      // everything where the path is /
    },
    additionalBehaviors: [{}],
  };

  const template = Template.fromStack(stack);
  const distributionConfigCapture = new Capture();
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: distributionConfigCapture,
  });
  const cffCapture = new Capture();
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: Match.objectLike({
      DefaultCacheBehavior: { FunctionAssociations: [cffCapture] },
    }),
  });
  const cffCode =
    template.toJSON().Resources[
      cffCapture.asObject().FunctionARN["Fn::GetAtt"][0]
    ].Properties.FunctionCode;
  const expectedFunctionCode = expectedCFFCode(
    `{\n` +
      `  "email.fromme.com": [\n` +
      `    {\n ` +
      `      querystring: {},\n` +
      `      locationValue: "https://tome.co/get/your/email/here"\n` +
      `    },\n` +
      `  ],\n` +
      `  "fromme.com": [\n` +
      `    {\n ` +
      `      querystring: {},\n` +
      `      locationValue: "https://tome.com/"\n` +
      `    },\n` +
      `    {\n ` +
      `      querystring: {"participant-id": "4499", },\n` +
      `      locationValue: "https://docs.google.com/edit/zzbbaajj"\n` +
      `    },\n` +
      `  ],\n` +
      `  "other-fromme.com": [\n` +
      `    {\n ` +
      `      querystring: {},\n` +
      `      locationValue: "https://tome.com/"\n` +
      `    },\n` +
      `  ],\n` +
      `}\n`
  );
  // should only be asserting about the CFF associated with the default
  // behavior
  expect(cffCode).toEqual(expectedFunctionCode);

  // assert on the non-root from-paths
  // assert that we have CacheBehaviors
  const cacheBehaviorsCapture = new Capture();
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: Match.objectLike({
      CacheBehaviors: cacheBehaviorsCapture,
    }),
  });
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: Match.objectLike({
      CacheBehaviors: Match.arrayWith([
        Match.objectLike({ PathPattern: "/apply" }),
      ]),
    }),
  });
});
test("subdomain only", () => {
  const stack = new Lib.AppStack(app, "MyTestApp", {
    redirects: [
      new Lib.Redirect(
        new URL("https://abc.xyz.net"),
        new URL("https://to.net/abc/xyz"),
        RedirectType.FOUND
      ),
    ],
  });
  const template = Template.fromStack(stack);
  const distributionConfigCapture = new Capture();
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: distributionConfigCapture,
  });
  const cffCapture = new Capture();
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: Match.objectLike({
      DefaultCacheBehavior: { FunctionAssociations: [cffCapture] },
    }),
  });
  const cffCode =
    template.toJSON().Resources[
      cffCapture.asObject().FunctionARN["Fn::GetAtt"][0]
    ].Properties.FunctionCode;
  const expectedFunctionCode = expectedCFFCode(
    `{\n` +
      `  "abc.xyz.net": [\n` +
      `    {\n ` +
      `      querystring: {},\n` +
      `      locationValue: "https://to.net/abc/xyz"\n` +
      `    },\n` +
      `  ],\n` +
      `}\n`
  );
  // should only be asserting about the CFF associated with the default
  // behavior
  expect(cffCode).toEqual(expectedFunctionCode);
});
test("stack has the expected CFF(s) 5, multiple paths", () => {
  const stack = new Lib.AppStack(app, "MyTestApp", {
    redirects: [
      new Lib.Redirect(
        new URL("https://abc.xyz.net"),
        new URL("https://to.net/abc/xyz"),
        RedirectType.FOUND
      ),
      new Lib.Redirect(
        new URL("https://abc.xyz.net/rst"),
        new URL("https://to.net/abc/xyz/rst"),
        RedirectType.FOUND
      ),
      new Lib.Redirect(
        new URL("https://ghi.co.uk/rst"),
        new URL("https://to.net/ghi/uk/rst"),
        RedirectType.FOUND
      ),
      new Lib.Redirect(
        new URL("https://a.co/path2"),
        new URL("https://righteousness.com"),
        RedirectType.FOUND
      ),
      new Lib.Redirect(
        new URL("https://a.co/path2?seeking=searching"),
        new URL("https://also-righteousness.com"),
        RedirectType.FOUND
      ),
    ],
  });
  const template = Template.fromStack(stack);
  const distributionConfigCapture = new Capture();
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: distributionConfigCapture,
  });
  const cffCapture = new Capture();
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: Match.objectLike({
      DefaultCacheBehavior: { FunctionAssociations: [cffCapture] },
    }),
  });
  const cffCode =
    template.toJSON().Resources[
      cffCapture.asObject().FunctionARN["Fn::GetAtt"][0]
    ].Properties.FunctionCode;
  const expectedFunctionCode = expectedCFFCode(
    `{\n` +
      `  "abc.xyz.net": [\n` +
      `    {\n ` +
      `      querystring: {},\n` +
      `      locationValue: "https://to.net/abc/xyz"\n` +
      `    },\n` +
      `  ],\n` +
      `}\n`
  );
  // should only be asserting about the CFF associated with the default
  // behavior
  expect(cffCode).toEqual(expectedFunctionCode);

  // assert on the non-root from-paths
  // assert that we have CacheBehaviors
  const cacheBehaviorsCapture = new Capture();
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: Match.objectLike({
      CacheBehaviors: cacheBehaviorsCapture,
    }),
  });
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: Match.objectLike({
      CacheBehaviors: Match.arrayWith([
        Match.objectLike({ PathPattern: "/rst" }),
      ]),
    }),
  });
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: Match.objectLike({
      CacheBehaviors: Match.arrayWith([
        Match.objectLike({ PathPattern: "/path2" }),
      ]),
    }),
  });
  expect(cacheBehaviorsCapture.asArray().length).toEqual(2);
});
// empty query param https://abc.com?q
// query params appear in different order in legend and request

// make sure we're making the right DNS objects
describe("DNS objects", () => {
  test("makes the right hosted zones", () => {});
});
test("reject multi-label subdomains", () => {
  expect(() => {
    const stack = new Lib.AppStack(app, "MyTestApp", {
      redirects: [
        new Lib.Redirect(
          new URL("https://www.xyz.abc.com"),
          new URL("https://example.com"),
          RedirectType.FOUND
        ),
      ],
    });
  }).toThrow();
});
test("accept multi-label suffixes from the public suffix list", () => {
  expect(() => {
    const stack = new Lib.AppStack(app, "MyTestApp", {
      redirects: [
        new Lib.Redirect(
          new URL("https://www.abc.co.uk"),
          new URL("https://4-names-ok-since-co-dot-uk-is-on-the-psl.com"),
          RedirectType.FOUND
        ),
      ],
    });
  }).not.toThrow();
});
