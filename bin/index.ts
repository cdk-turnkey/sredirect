#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { URL } from "url";
const AWS = require("aws-sdk");
const crypto = require("crypto");
import { AppStack, AppStackProps, Redirect } from "../lib";
import { assertNonEmptyRedirectArray } from "../lib/assertNonEmptyRedirectArray";
import { RedirectType } from "../lib/RedirectType";
const stackname = require("@cdk-turnkey/stackname");

(async () => {
  const app = new App();
  class ConfigParam {
    appParamName: string;
    ssmParamName = () => stackname(this.appParamName);
    ssmParamValue?: string;
    print = () => {
      console.log("appParamName");
      console.log(this.appParamName);
      console.log("ssmParamName:");
      console.log(this.ssmParamName());
      console.log("ssmParamValue:");
      console.log(this.ssmParamValue);
    };
    constructor(appParamName: string) {
      this.appParamName = appParamName;
    }
  }
  const configParams: Array<ConfigParam> = [new ConfigParam("redirects")];
  const ssmParams = {
    Names: configParams.map((c) => c.ssmParamName()),
    WithDecryption: true,
  };
  AWS.config.update({ region: process.env.AWS_DEFAULT_REGION });
  const ssm = new AWS.SSM({ apiVersion: "2014-11-06" });
  let ssmResponse: any;
  ssmResponse = await new Promise((resolve, reject) => {
    ssm.getParameters(ssmParams, (err: any, data: any) => {
      resolve({ err, data });
    });
  });
  if (!ssmResponse.data) {
    console.log("error: unsuccessful SSM getParameters call, failing");
    console.log(ssmResponse);
    process.exit(1);
  }
  const ssmParameterData: any = {};
  let valueHash;
  ssmResponse?.data?.Parameters?.forEach(
    (p: { Name: string; Value: string }) => {
      console.log("Received parameter named:");
      console.log(p.Name);
      valueHash = crypto
        .createHash("sha256")
        .update(p.Value)
        .digest("hex")
        .toLowerCase();
      console.log("value hash:");
      console.log(valueHash);
      console.log("**************");
      ssmParameterData[p.Name] = p.Value;
    }
  );
  console.log("==================");
  configParams.forEach((c) => {
    c.ssmParamValue = ssmParameterData[c.ssmParamName()];
  });
  const appProps: any = {};
  configParams.forEach((c) => {
    appProps[c.appParamName] = c.ssmParamValue;
  });
  // Param validation
  const redirects: [Redirect, ...Redirect[]] = ((
    r
  ): [Redirect, ...Redirect[]] => {
    if (!r) {
      console.error("no redirects provided, failing");
      process.exit(4);
    }
    const parsed = JSON.parse(r);
    if (!Array.isArray(parsed)) {
      console.error("redirects is not an array, failing");
      process.exit(2);
    }
    if (parsed.length < 1) {
      console.error("need at least one redirect");
      process.exit(5);
    }
    for (const e of parsed) {
      if (!e["from"] || !e["to"] || !e["type"]) {
        console.error("bad redirect, need a from and a to and a type");
        console.error(e);
        process.exit(3);
      }
      if (e.type !== RedirectType.FOUND) {
        console.error(`bad redirect type, must be "${RedirectType.FOUND}"`);
        console.error(e);
        process.exit(6);
      }
    }
    // maybe require they all be under the same 2nd level domain name?
    // probably not, no immediate reason for that rule
    // or maybe I need one cert, possibly with a bunch of second-level domain
    // names, one distro, and a bunch of rules/behaviors routing based on the
    // domain
    // TODO: export this asserts function
    const parsedRedirects = parsed.map(
      (e) => new Redirect(new URL(e.from), new URL(e.to), e.type)
    );
    assertNonEmptyRedirectArray(parsedRedirects);
    return parsedRedirects; // it's an array of Redirects, ish
  })(appProps.redirects);

  console.log("bin: Instantiating stack with redirects:");
  console.log(appProps.redirects);
  new AppStack(app, stackname("app"), { redirects });
})();

// TODO: no backticks allowed...or other checks to prevent injection
