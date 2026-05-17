export interface Repayment {
  id: string;
  amount: number;
  date: string;
}

export type CalculationBasis = 'daily' | 'monthly';

export interface LoanDetails {
  principal: number;
  rateOfInterest: number;
  startDate: string;
  endDate: string;
  calculationBasis: CalculationBasis;
  repayments: Repayment[];
}

export interface PeriodBreakdown {
  periodStart: string;
  periodEnd: string;
  days: number;
  applicableMonths: number | null; // null when daily basis
  openingPrincipal: number;
  interestAccrued: number;
  repaymentAmount: number;
  closingPrincipal: number;
}

export interface CalculationResult {
  totalInterest: number;
  totalRepaid: number;
  finalPrincipal: number;
  totalPayable: number;
  breakdown: PeriodBreakdown[];
}
