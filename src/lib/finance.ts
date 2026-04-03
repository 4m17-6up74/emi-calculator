/**
 * Financial Calculation Engine
 */

export type InterestType = 'flat' | 'reducing';
export type TenureUnit = 'years' | 'months';
export type CompoundingFrequency = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';

export type LoanType = 'home' | 'personal' | 'gold' | 'car' | 'education';

export const LOAN_DEFAULTS: Record<LoanType, { rate: number; tenure: number }> = {
  home: { rate: 8.5, tenure: 20 },
  personal: { rate: 12.5, tenure: 5 },
  gold: { rate: 9.0, tenure: 1 },
  car: { rate: 8.0, tenure: 7 },
  education: { rate: 10.5, tenure: 10 }
};

export interface LoanInputs {
  type: LoanType;
  amount: number;
  rate: number;
  tenure: number;
  tenureUnit: TenureUnit;
  interestType: InterestType;
  processingFee: number;
  processingFeeType: 'percentage' | 'flat';
  insurance: number;
  moratorium: number; // in months
}

export interface EMIResult {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  processingFeeAmount: number;
  apr: number;
}

export interface AmortizationEntry {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

/**
 * Calculate EMI for Flat Interest Rate
 */
export const calculateFlatEMI = (principal: number, annualRate: number, months: number): number => {
  const totalInterest = (principal * annualRate * (months / 12)) / 100;
  return (principal + totalInterest) / months;
};

/**
 * Calculate EMI for Reducing Balance Interest Rate
 */
export const calculateReducingEMI = (principal: number, annualRate: number, months: number): number => {
  const r = annualRate / (12 * 100);
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
};

/**
 * Calculate Loan Details
 */
export const calculateLoan = (inputs: LoanInputs): EMIResult => {
  const { amount, rate, tenure, tenureUnit, interestType, processingFee, processingFeeType, insurance, moratorium } = inputs;
  const months = tenureUnit === 'years' ? tenure * 12 : tenure;
  const effectiveMonths = Math.max(1, months - moratorium);

  let emi = 0;
  let totalInterest = 0;

  if (interestType === 'flat') {
    emi = calculateFlatEMI(amount, rate, effectiveMonths);
    totalInterest = (amount * rate * (effectiveMonths / 12)) / 100;
  } else {
    emi = calculateReducingEMI(amount, rate, effectiveMonths);
    // Total interest for reducing is calculated via schedule or formula approximation
    // For exactness, we'll use the standard formula: (EMI * n) - P
    totalInterest = (emi * effectiveMonths) - amount;
  }

  const processingFeeAmount = processingFeeType === 'percentage' ? (amount * processingFee) / 100 : processingFee;
  const totalPayment = amount + totalInterest + processingFeeAmount + insurance;

  // APR Calculation (Approximate)
  // APR = ((Total Interest + Fees) / Principal) / (Tenure in Years) * 100
  const totalCost = totalInterest + processingFeeAmount + insurance;
  const apr = (totalCost / amount) / (months / 12) * 100;

  return {
    emi,
    totalInterest,
    totalPayment,
    processingFeeAmount,
    apr
  };
};

/**
 * Generate Amortization Schedule
 */
export const generateAmortizationSchedule = (inputs: LoanInputs): AmortizationEntry[] => {
  const { amount, rate, tenure, tenureUnit, interestType, moratorium } = inputs;
  const months = tenureUnit === 'years' ? tenure * 12 : tenure;
  const schedule: AmortizationEntry[] = [];
  
  let balance = amount;
  const r = rate / (12 * 100);
  const emi = interestType === 'flat' 
    ? calculateFlatEMI(amount, rate, months - moratorium)
    : calculateReducingEMI(amount, rate, months - moratorium);

  // Handle Moratorium
  for (let m = 1; m <= moratorium; m++) {
    const interest = balance * r;
    balance += interest; // Interest adds up if not paid during moratorium
    schedule.push({
      month: m,
      emi: 0,
      principal: 0,
      interest,
      balance
    });
  }

  // Regular Payments
  for (let m = moratorium + 1; m <= months; m++) {
    let interest = 0;
    let principal = 0;

    if (interestType === 'flat') {
      interest = (amount * rate) / (12 * 100);
      principal = emi - interest;
    } else {
      interest = balance * r;
      principal = emi - interest;
    }

    balance -= principal;
    if (balance < 0) balance = 0;

    schedule.push({
      month: m,
      emi,
      principal,
      interest,
      balance
    });
  }

  return schedule;
};

/**
 * FD Calculator
 */
export const calculateFD = (principal: number, rate: number, tenureYears: number, frequency: CompoundingFrequency) => {
  const nMap: Record<CompoundingFrequency, number> = {
    'monthly': 12,
    'quarterly': 4,
    'half-yearly': 2,
    'yearly': 1
  };
  const n = nMap[frequency];
  const r = rate / 100;
  const maturityAmount = principal * Math.pow(1 + r / n, n * tenureYears);
  const interestEarned = maturityAmount - principal;

  return {
    maturityAmount,
    interestEarned,
    totalInvested: principal
  };
};

/**
 * RD Calculator
 */
export const calculateRD = (monthlyDeposit: number, rate: number, tenureMonths: number) => {
  const r = rate / (4 * 100); // Quarterly compounding is standard for RD in India
  const n = tenureMonths / 3; // Number of quarters
  
  // Formula for RD Maturity: P * (1+r)^n + P * (1+r)^(n-1) ...
  // This is a geometric progression
  let maturityValue = 0;
  for (let i = 1; i <= tenureMonths; i++) {
    // Each installment earns interest for the remaining period
    // Standard formula approximation:
    maturityValue += monthlyDeposit * Math.pow(1 + rate / 400, (tenureMonths - i + 1) / 3);
  }

  const totalInvested = monthlyDeposit * tenureMonths;
  const interestEarned = maturityValue - totalInvested;

  return {
    maturityValue,
    interestEarned,
    totalInvested
  };
};
