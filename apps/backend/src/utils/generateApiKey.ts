import crypto from "crypto";

export function generateApiKey() {
  const prefix = "rk_live_" + crypto.randomBytes(4).toString("hex");
  const secret = crypto.randomBytes(24).toString("hex");

  const fullKey = `${prefix}.${secret}`;

  return {
    prefix,
    secret,
    fullKey,
  };
}
