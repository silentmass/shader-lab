export function stripVersion(
  shaderString: string,
  pattern = "#version 300 es"
): string {
  return shaderString.replace(pattern, "");
}
