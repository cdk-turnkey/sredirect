import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import { RemovalPolicy } from "@aws-cdk/core";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";

export interface StackProps extends cdk.StackProps {
  customProp?: string;
}
export class Stack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const { customProp } = props;
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
    new cdk.CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
    });
    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distro.distributionDomainName,
    });
  }
}
