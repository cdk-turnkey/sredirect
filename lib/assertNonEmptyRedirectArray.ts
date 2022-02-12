import { Redirect } from ".";

export const assertNonEmptyRedirectArray: (
  input: unknown
) => asserts input is [Redirect, ...Redirect[]] = (
  input: any
): asserts input is [Redirect, ...Redirect[]] => {
  if (!Array.isArray(input)) {
    throw new Error("input is not an array");
  }
  if (input.length < 1) {
    throw new Error("input length < 1");
  }
};
