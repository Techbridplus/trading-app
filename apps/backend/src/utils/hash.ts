import crypto from "crypto";

export function hashApiKey(secret: string): string {
  return crypto
    .createHash("sha256")
    .update(secret)
    .digest("hex");
}
