export function fixMojibake(value) {
  if (typeof value !== "string") return value;
  if (!/[ÃƒÃ‚]/.test(value)) return value;

  try {
    return decodeURIComponent(
      value
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
  } catch {
    return value;
  }
}
