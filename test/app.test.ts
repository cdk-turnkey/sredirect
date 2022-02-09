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
        new URL("https://example.com"),
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
  // console.log(
  //   distributionConfigCapture.asObject().DefaultCacheBehavior
  //     .FunctionAssociations[0]
  // );
  template.hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: Match.objectLike({
      DefaultCacheBehavior: { FunctionAssociations: [cffCapture] },
    }),
  });
  console.log(cffCapture);
});
