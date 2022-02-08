// This has to be in its own file because of some insane thing about const enums
// https://stackoverflow.com/a/62564232/2260686
export enum RedirectType {
  FOUND = "Found", // Send HTTP 302 and redirect to the to-value
}
