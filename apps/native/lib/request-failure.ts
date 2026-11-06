export function logRequestFailure(action: string, error: Error) {
  if (__DEV__) {
    console.warn(`${action} failed:`, error);
  }
}
