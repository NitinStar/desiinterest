import { Component } from '@angular/core';
import { InterestCalculatorComponent } from './components/interest-calculator/interest-calculator.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [InterestCalculatorComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
