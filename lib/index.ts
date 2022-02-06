import { App, Stack, StackProps, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { aws_s3 as s3 } from "aws-cdk-lib";
import { aws_cloudfront as cloudfront } from "aws-cdk-lib";
import { aws_cloudfront_origins as origins } from "aws-cdk-lib";
import { aws_certificatemanager as certificatemanager } from "aws-cdk-lib";

export const enum RedirectType {
  FOUND = "Found", // Send HTTP 302 and redirect to the to-value
  HTTP_ORIGIN = "HTTP Origin", // Set to-value as a CloudFront HTTP Origin, caching disabled,
}

export class Redirect {
  constructor(from: string, to: string, type: RedirectType) {
    this.from = from;
    this.to = to;
    this.type = type;
  }
  from: string;
  to: string;
  type: RedirectType;
  toString(): string {
    return `${this.from} -> ${this.to} (${this.type})`;
  }
}

export interface AppStackProps extends StackProps {
  redirects?: [Redirect, ...Redirect[]];
}
export class AppStack extends Stack {
  constructor(scope: App, id: string, props: AppStackProps = {}) {
    super(scope, id, props);
    // const { redirects: Array<Redirect> = [] } = props;
    const redirects: Array<Redirect> = props.redirects || [];

    // cert
    let subjectAlternativeNames;

    // I need to do some computation on redirects
    // In Namecheap I can only get certs for *.abc.com and abc.com, not
    // xyz.abc.com

    const defaultBucketProps = {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    };
    const bucket = new s3.Bucket(this, "Bucket", {
      ...defaultBucketProps,
      versioned: true,
    });
    const cfFunction = new cloudfront.Function(this, "CFF", {
      code: cloudfront.FunctionCode.fromInline(`
        function handler(event) {
          var response = {
            statusCode: 302,
            statusDescription: 'Found',
            headers: {
              "location": {
                "value": "https://sites.google.com/view/douglas-naphas-org/home"
              }
            }
          }
          return response;
        }`),
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
