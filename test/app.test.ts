import { Capture, Match, Template } from "aws-cdk-lib/assertions";
import * as cdk from "aws-cdk-lib";
import * as Lib from "../lib";
import { RedirectType } from "../lib/RedirectType";
import { URL } from "url";

const OLD_ENV = process.env;
let app: cdk.App;
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
  const expectedFunctionCode =
    `function handler(event) {` +
    `var response = {` +
    `  statusCode: 302,` +
    `  statusDescription: 'Found',` +
    `  headers: {` +
    `    "location": {` +
    `      "value": "https://sites.google.com/view/douglas-naphas-org/home"` +
    `    }` +
    `  }` +
    `} ; ` +
    `return response;}`;
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
  const expectedFunctionCode =
    `function handler(event) {\n` +
    `  var legend = {\n` +
    /////////////////// this is the part that varies ///////////////////////////
    `    "https://abc.com": [` +
    `       {` +
    `         querystring: {},` +
    `         locationValue: "https://somewhere-else.com"` +
    `       },` +
    `     ],` +
    ////////////////////////////////////////////////////////////////////////////
    `  };\n` +
    `  var request = event.request;\n` +
    `  var response404 = {statusCode: 404, statusDescription: "Not Found"};\n` +
    `  if(!request.headers.host){return response404;}\n` +
    `  if(typeof request.headers.host != "string){return response404;}\n` +
    `  if(!legend[request.headers.host]){return response404;}\n` +
    `  for (var i = 0; i < legend[request.headers.host].length; i++) {\n` +
    `    var legendQuerystringEntries = Object.entries(\n` +
    `      legend[request.headers.host][i].querystring\n` +
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
    `          value: legend[request.headers.host][i].locationValue` +
    `        }` +
    `      }` +
    `    }` +
    `  }` +
    `  return response404;` +
    `}`;
  expect(cffCode).toEqual(expectedFunctionCode);
});

test("stack has the expected CFF(s) 3", () => {
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
  const expectedFunctionCode =
    `function handler(event) {` +
    `var response = {` +
    `  statusCode: 302,` +
    `  statusDescription: 'Found',` +
    `  headers: {` +
    `    "location": {` +
    `      "value": "https://somewhere-else.com"` +
    `    }` +
    `  }` +
    `} ; ` +
    `return response;}`;
  // should only be asserting about the CFF associated with the default
  // behavior
  expect(cffCode).toEqual(expectedFunctionCode);
});
