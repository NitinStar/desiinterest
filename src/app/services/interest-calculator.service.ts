import { Injectable } from '@angular/core';
import { CalculationResult, LoanDetails, PeriodBreakdown } from '../models/loan.model';

@Injectable({ providedIn: 'root' })
export class InterestCalculatorService {
  calculate(loan: LoanDetails): CalculationResult {
    const startMs = new Date(loan.startDate).getTime();
    const endMs = new Date(loan.endDate).getTime();

    if (endMs <= startMs) {
      throw new Error('End date must be after the start date.');
    }

    const sortedRepayments = [...loan.repayments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const r of sortedRepayments) {
      const rMs = new Date(r.date).getTime();
      if (rMs <= startMs || rMs > endMs) {
        throw new Error(
          `Repayment date ${r.date} must be strictly between the start and end dates.`
        );
      }
    }

    type Checkpoint = { date: string; repayment: number };
    const checkpoints: Checkpoint[] = [
      { date: loan.startDate, repayment: 0 },
      ...sortedRepayments.map((r) => ({ date: r.date, repayment: r.amount })),
      { date: loan.endDate, repayment: 0 },
    ];

    const breakdown: PeriodBreakdown[] = [];
    let currentPrincipal = loan.principal;
    let totalInterest = 0;
    let totalRepaid = 0;
    const isMonthly = loan.calculationBasis === 'monthly';

    for (let i = 0; i < checkpoints.length - 1; i++) {
      const periodStart = checkpoints[i].date;
      const periodEnd = checkpoints[i + 1].date;
      const repaymentAmount = checkpoints[i + 1].repayment;

      const days = this.daysBetween(periodStart, periodEnd);

      // Cumulative days from loan start to period start and end.
      // Applicable months use the differential so rounding is always evaluated
      // relative to the original loan start date, not the last repayment date.
      const cumulativeDaysAtStart = this.daysBetween(loan.startDate, periodStart);
      const cumulativeDaysAtEnd   = this.daysBetween(loan.startDate, periodEnd);
      const applicableMonths = isMonthly
        ? this.toApplicableMonths(cumulativeDaysAtEnd) - this.toApplicableMonths(cumulativeDaysAtStart)
        : null;

      const interestAccrued = isMonthly
        ? (currentPrincipal * loan.rateOfInterest * applicableMonths!) / (12 * 100)
        : (currentPrincipal * loan.rateOfInterest * days) / (360 * 100);

      totalInterest += interestAccrued;

      const openingPrincipal = currentPrincipal;
      currentPrincipal = Math.max(0, currentPrincipal - repaymentAmount);
      totalRepaid += repaymentAmount;

      breakdown.push({
        periodStart,
        periodEnd,
        days,
        applicableMonths,
        openingPrincipal,
        interestAccrued,
        repaymentAmount,
        closingPrincipal: currentPrincipal,
      });
    }

    return {
      totalInterest,
      totalRepaid,
      finalPrincipal: currentPrincipal,
      totalPayable: currentPrincipal + totalInterest,
      breakdown,
    };
  }

  /**
   * Converts a raw day count to applicable months using the rounding rules:
   * - Remainder 0–5 days  → 0 months
   * - Remainder 6–15 days → 0.5 months
   * - Remainder 16–30 days → 1 month
   */
  toApplicableMonths(days: number): number {
    const fullMonths = Math.floor(days / 30);
    const remainingDays = days % 30;
    let fractional = 0;
    if (remainingDays >= 16) {
      fractional = 1;
    } else if (remainingDays >= 6) {
      fractional = 0.5;
    }
    return fullMonths + fractional;
  }

  private daysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1).getTime();
    const d2 = new Date(date2).getTime();
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  }
}
