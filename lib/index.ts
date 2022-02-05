import { App, Stack, StackProps, RemovalPolicy, CfnOutput } from "aws-cdk-lib";
import { aws_s3 as s3 } from "aws-cdk-lib";
import { aws_cloudfront as cloudfront } from "aws-cdk-lib";
import { aws_cloudfront_origins as origins } from "aws-cdk-lib";

export class Redirect {
  constructor(from: string, to: string) {
    this.from = from;
    this.to = to;
  }
  from: string;
  to: string;
  toString(): string {
    return `${this.from} -> ${this.to}`;
  }
}

export interface AppStackProps extends StackProps {
  redirects?: Redirect[];
}
export class AppStack extends Stack {
  constructor(scope: App, id: string, props: AppStackProps = {}) {
    super(scope, id, props);
    // const { redirects: Array<Redirect> = [] } = props;
    const redirects: Array<Redirect> = props.redirects || [];
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
