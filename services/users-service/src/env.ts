export const envOrThrow = (env: string): string => {
  const envVar = process.env[env];
  if (!envVar) {
    throw new Error(`Expected env var not found: ${env}`);
  } else {
    return envVar;
  }
};
