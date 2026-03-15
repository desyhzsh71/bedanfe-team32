export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

export function calculateEndDate(startDate: Date, billingCycle: 'MONTHLY' | 'YEARLY'): Date {
  if (billingCycle === 'MONTHLY') {
    return addMonths(startDate, 1);
  } else {
    return addYears(startDate, 1);
  }
}

export function isDateExpired(date: Date): boolean {
  return new Date() > date;
}