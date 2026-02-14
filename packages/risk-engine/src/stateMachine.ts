import { AccountStatus } from "../../shared-types/account";
import { CAUTION_THRESHOLD, CRITICAL_THRESHOLD } from "./constants";

export function determineStatus(
  dailyUsageRatio: number,
  totalUsageRatio: number
): AccountStatus {
  const highestRatio = Math.max(dailyUsageRatio, totalUsageRatio);

  if (totalUsageRatio >= 1) {
    return "LOCKED_PERMANENT";
  }

  if (dailyUsageRatio >= 1) {
    return "LOCKED_DAILY";
  }

  if (highestRatio >= CRITICAL_THRESHOLD) {
    return "CRITICAL_95";
  }

  if (highestRatio >= CAUTION_THRESHOLD) {
    return "CAUTION_80";
  }

  return "SAFE";
}
