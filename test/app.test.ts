import { Capture, Match, Template } from "aws-cdk-lib/assertions";
import * as cdk from "aws-cdk-lib";
import * as Lib from "../lib";
import { RedirectType } from "../lib/RedirectType";
import { URL } from "url";

const OLD_ENV = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...OLD_ENV };
});
afterAll(() => {
  process.env = { ...OLD_ENV };
});
test("can instantiate app stack", () => {
  const app = new cdk.App();
  process.env.GITHUB_REPOSITORY = "githubuser/repo-name";
  process.env.GITHUB_REF = "refs/heads/master";
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
  const app = new cdk.App();
  process.env.GITHUB_REPOSITORY = "githubuser/repo-name";
  process.env.GITHUB_REF = "refs/heads/master";
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
