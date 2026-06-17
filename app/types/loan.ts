// types/loan.ts

export interface LoanInformation {
  loanNumber: string | null;
  borrowerName: string | null;
  propertyAddress: string | null;
  
  loanAmount: string | null;
  interestRate: string | null;
  cashOut: string | null;
  loanPurpose: string | null;
  
  loanType: string | null;
  docType: string | null;
  product: string | null;
  division: string | null;
  
  loanStatus: string | null;
  fundingReworkTI: string | null;
  payoffShortageTI: string | null;
  closingAgent: string | null;
  
  scheduledClosingDate: string | null;
  scheduledDisbursementDate: string | null;
  firstPaymentDate: string | null;
}

export interface UIState {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}