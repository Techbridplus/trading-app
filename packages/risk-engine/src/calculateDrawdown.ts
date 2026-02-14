export function calculateDailyDrawdown(
    startOfDayBalance: number,
    currentEquity: number
  ): number {
    return Math.max(0, startOfDayBalance - currentEquity);
  }
  
  export function calculateTotalDrawdown(
    initialBalance: number,
    currentEquity: number
  ): number {
    return Math.max(0, initialBalance - currentEquity);
  }
  