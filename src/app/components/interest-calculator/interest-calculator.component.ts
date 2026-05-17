import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InterestCalculatorService } from '../../services/interest-calculator.service';
import { CalculationResult } from '../../models/loan.model';

@Component({
  selector: 'app-interest-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './interest-calculator.component.html',
  styleUrl: './interest-calculator.component.css',
})
export class InterestCalculatorComponent implements OnInit {
  form!: FormGroup;
  result: CalculationResult | null = null;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private calculatorService: InterestCalculatorService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      principal: [null, [Validators.required, Validators.min(1)]],
      rateOfInterest: [
        null,
        [Validators.required, Validators.min(0.01), Validators.max(100)],
      ],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      calculationBasis: ['monthly', Validators.required],
      repayments: this.fb.array([]),
    });
  }

  get repayments(): FormArray {
    return this.form.get('repayments') as FormArray;
  }

  get isMonthlyBasis(): boolean {
    return this.form.get('calculationBasis')?.value === 'monthly';
  }

  addRepayment(): void {
    this.repayments.push(
      this.fb.group({
        id: [crypto.randomUUID()],
        amount: [null, [Validators.required, Validators.min(1)]],
        date: ['', Validators.required],
      })
    );
  }

  removeRepayment(index: number): void {
    this.repayments.removeAt(index);
  }

  getRepaymentGroup(index: number): FormGroup {
    return this.repayments.at(index) as FormGroup;
  }

  calculate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage = '';
    this.result = null;
    try {
      this.result = this.calculatorService.calculate(this.form.value);
    } catch (e: unknown) {
      this.errorMessage =
        e instanceof Error ? e.message : 'An unexpected error occurred.';
    }
  }

  reset(): void {
    this.form.reset();
    this.repayments.clear();
    this.result = null;
    this.errorMessage = '';
  }

  isInvalid(controlPath: string): boolean {
    const control = this.form.get(controlPath);
    return !!(control?.invalid && control?.touched);
  }
}
