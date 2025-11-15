// NEP 2020 Credit Calculation
// Standard: 1 credit = 30 hours of work (including theory, practical, internship)
// Internship: 1 credit = 40 hours of internship work

export const calculateCredits = (hoursWorked: number): number => {
  const HOURS_PER_CREDIT = 40;
  return Math.round((hoursWorked / HOURS_PER_CREDIT) * 100) / 100;
};

export const calculateRequiredHours = (credits: number): number => {
  const HOURS_PER_CREDIT = 40;
  return credits * HOURS_PER_CREDIT;
};

export const validateCredits = (hoursWorked: number, minCredits: number): boolean => {
  const earnedCredits = calculateCredits(hoursWorked);
  return earnedCredits >= minCredits;
};
