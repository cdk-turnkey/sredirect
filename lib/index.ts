import { App, Stack, StackProps, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { aws_s3 as s3 } from "aws-cdk-lib";
import { aws_cloudfront as cloudfront } from "aws-cdk-lib";
import { aws_cloudfront_origins as origins } from "aws-cdk-lib";
import { aws_certificatemanager as certificatemanager } from "aws-cdk-lib";
import { aws_route53_targets as targets } from "aws-cdk-lib";
import { aws_route53 as route53 } from "aws-cdk-lib";
import { URL } from "url";
import { RedirectType } from "./RedirectType";
import { requiredCerts } from "./requiredCerts";
import { redirects2LegendString } from "./Legend";

export class Redirect {
  constructor(from: URL, to: URL, type: RedirectType) {
    this.from = from;
    this.to = to;
    this.type = type;
  }
  from: URL;
  to: URL;
  type: RedirectType;
  toString(): string {
    return `${this.from} -> ${this.to} (${this.type})`;
  }
}

export interface AppStackProps extends StackProps {
  redirects: [Redirect, ...Redirect[]];
}
export class AppStack extends Stack {
  constructor(scope: App, id: string, props: AppStackProps) {
    super(scope, id, props);
    const redirects: [Redirect, ...Redirect[]] = props.redirects;

    let subjectAlternativeNames;

    // I need to do some computation on redirects
    // In Namecheap I can only get certs for *.abc.com and abc.com, not
    // xyz.abc.com
    const domainNames = requiredCerts(redirects);
    const assertNonEmptyStringArray: (
      input: unknown
    ) => asserts input is [string, ...string[]] = (
      input: any
    ): asserts input is [string, ...string[]] => {
      if (!Array.isArray(input)) {
        throw new Error("input is not an array");
      }
      if (input.length < 1) {
        throw new Error("input length < 1");
      }
    };
    assertNonEmptyStringArray(domainNames);
    if (domainNames.length > 1) {
      subjectAlternativeNames = domainNames.slice(1);
    }
    const certificate = new certificatemanager.Certificate(this, "Cert", {
      domainName: domainNames[0],
      subjectAlternativeNames,
      validation: certificatemanager.CertificateValidation.fromDns(),
    });

    const defaultBucketProps = {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    };
    const bucket = new s3.Bucket(this, "Bucket", {
      ...defaultBucketProps,
      versioned: true,
    });
    const cfFunction = new cloudfront.Function(this, "CFF", {
      code: cloudfront.FunctionCode.fromInline(
        `function handler(event) {\n` +
          `  var legend = ` +
          /////////////////// this is the part that varies ///////////////////////////
          redirects2LegendString(redirects) +
          ////////////////////////////////////////////////////////////////////////////
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
          `}`
      ),
    });
    const distro = new cloudfront.Distribution(this, "Distro", {
      logBucket: new s3.Bucket(this, "DistroLoggingBucket", {
        ...defaultBucketProps,
      }),
      logFilePrefix: "distribution-access-logs/",
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: new origins.S3Origin(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        functionAssociations: [
          {
            function: cfFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      domainNames,
      certificate,
    });
    distro.node.addDependency(certificate);

    const hostedZones: any = {};
    domainNames
      .filter((domainName) => !domainName.match(/[*]/))
      .forEach((zoneName, index) => {
        const hostedZone = new route53.PublicHostedZone(
          this,
          `HostedZone${index}`,
          {
            zoneName,
          }
        );
        hostedZones[zoneName] = hostedZone;
      });
    domainNames.forEach((domainName, index) => {
      new route53.ARecord(this, `ARecord${index}`, {
        recordName: domainName,
        zone: hostedZones[domainName.replace(/^[*][.]/, "")],
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(distro)
        ),
      });
    });

    new CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
    });
    new CfnOutput(this, "DistributionDomainName", {
      value: distro.distributionDomainName,
    });
    new CfnOutput(this, "redirects", {
      value: `${redirects} (${redirects.length})`,
    });
  }
}
