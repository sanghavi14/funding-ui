// hooks/useLoanData.ts
import { useState, useEffect } from 'react';
import { LoanInformation } from '../types/loan';
import { getLoanDataByLoanNumber } from '@funding-ui-osdk/sdk';

export function useLoanData(client: any, loanNumberToFetch: string) {
  const [data, setData] = useState<LoanInformation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!loanNumberToFetch) return;

    const fetchLoanData = async () => {
      setIsLoading(true);
      setIsError(false);
      setErrorMessage('');

      try {
        const rawResponse = await client(getLoanDataByLoanNumber).executeFunction({ loanNum: loanNumberToFetch });
        const response = rawResponse?.data ?? rawResponse;

        if (!response) {
          throw new Error('No loan data returned from the API.');
        }

        // Formatting helpers must be declared before any use
        const formatAmount = (v: any) => {
          if (v === undefined || v === null) return null;
          if (typeof v === 'number') return `$${v.toLocaleString()}`;
          return String(v);
        };

        const formatRate = (v: any) => {
          if (v === undefined || v === null) return null;
          if (typeof v === 'number') return `${v}%`;
          return String(v);
        };
        // Detect metadata-only response objects returned by the OSDK
        // e.g. { "$apiName": "LoanInformation", "$objectType": "LoanInformation", "$primaryKey": "0100578962", "$objectSpecifier": "LoanInformation:0100578962" }
        const responseKeys = Object.keys(response || {});
        const looksLikeMetadataOnly = responseKeys.length > 0 && responseKeys.every(k => k.startsWith('$'));
        if (looksLikeMetadataOnly) {
          // Server returned a Foundry object reference. Call local API proxy to fetch serialized object.
          try {
            const proxyResp = await fetch(`/api/loan?loanNum=${encodeURIComponent(loanNumberToFetch)}`);
            const proxyJson = await proxyResp.json();
            if (proxyJson.error) throw new Error(proxyJson.error);
            const full = proxyJson.data;
            if (!full) throw new Error('Proxy returned no data');

            const normalizedFromProxy: LoanInformation = {
              loanNumber: full.loanNumber ?? full.loan_number ?? full.LoanNumber ?? loanNumberToFetch,
              borrowerName: full.borrowerName ?? full.borrower_name ?? full.BorrowerName ?? null,
              propertyAddress: full.propertyAddress ?? full.property_address ?? full.PropertyAddress ?? full.propertyAddress ?? null,
              loanAmount: formatAmount(full.loanAmount ?? full.loan_amount ?? full.LoanAmount ?? full.loanAmount ?? null),
              interestRate: formatRate(full.interestRate ?? full.interest_rate ?? full.InterestRate ?? null),
              cashOut: full.cashOut ?? full.cash_out ?? full.CashOut ?? full.cashout ?? null,
              loanPurpose: full.loanPurpose ?? full.loan_purpose ?? full.LoanPurpose ?? null,
              loanType: full.loanType ?? full.loan_type ?? full.LoanType ?? null,
              docType: full.docType ?? full.doc_type ?? full.DocType ?? null,
              product: full.product ?? full.Product ?? null,
              division: full.division ?? full.Division ?? null,
              loanStatus: full.loanStatus ?? full.loan_status ?? full.LoanStatus ?? null,
              fundingReworkTI: full.fundingReworkTI ?? full.funding_rework_ti ?? full.FundingReworkTI ?? full.fundingReworkTi ?? null,
              payoffShortageTI: full.payoffShortageTI ?? full.payoff_shortage_ti ?? full.PayoffShortageTI ?? full.payoffShortageTi ?? null,
              closingAgent: full.closingAgent ?? full.closing_agent ?? full.ClosingAgent ?? null,
              scheduledClosingDate: full.scheduledClosingDate ?? full.scheduled_closing_date ?? full.ScheduledClosingDate ?? null,
              scheduledDisbursementDate: full.scheduledDisbursementDate ?? full.scheduled_disbursement_date ?? full.ScheduledDisbursementDate ?? null,
              firstPaymentDate: full.firstPaymentDate ?? full.first_payment_date ?? full.FirstPaymentDate ?? null,
            };

            setData(normalizedFromProxy);
            setIsError(false);
            setErrorMessage('');
            return;
          } catch (err: any) {
            setIsError(true);
            setErrorMessage('API returned an object reference; proxy call failed: ' + (err.message || String(err)));
            setData({
              loanNumber: response.$primaryKey ?? loanNumberToFetch,
              borrowerName: null,
              propertyAddress: null,
              loanAmount: null,
              interestRate: null,
              cashOut: null,
              loanPurpose: null,
              loanType: null,
              docType: null,
              product: null,
              division: null,
              loanStatus: null,
              fundingReworkTI: null,
              payoffShortageTI: null,
              closingAgent: null,
              scheduledClosingDate: null,
              scheduledDisbursementDate: null,
              firstPaymentDate: null,
            });
            return;
          }
        }

        const normalizedData: LoanInformation = {
          loanNumber: response.loanNumber ?? response.loan_number ?? response.LoanNumber ?? loanNumberToFetch,
          borrowerName: response.borrowerName ?? response.borrower_name ?? response.BorrowerName ?? null,
          propertyAddress: response.propertyAddress ?? response.property_address ?? response.PropertyAddress ?? response.propertyAddress ?? null,
          loanAmount: formatAmount(response.loanAmount ?? response.loan_amount ?? response.LoanAmount ?? response.loanAmount ?? null),
          interestRate: formatRate(response.interestRate ?? response.interest_rate ?? response.InterestRate ?? null),
          cashOut: response.cashOut ?? response.cash_out ?? response.CashOut ?? response.cashout ?? null,
          loanPurpose: response.loanPurpose ?? response.loan_purpose ?? response.LoanPurpose ?? null,
          loanType: response.loanType ?? response.loan_type ?? response.LoanType ?? null,
          docType: response.docType ?? response.doc_type ?? response.DocType ?? null,
          product: response.product ?? response.Product ?? null,
          division: response.division ?? response.Division ?? null,
          loanStatus: response.loanStatus ?? response.loan_status ?? response.LoanStatus ?? null,
          fundingReworkTI: response.fundingReworkTI ?? response.funding_rework_ti ?? response.FundingReworkTI ?? response.fundingReworkTi ?? null,
          payoffShortageTI: response.payoffShortageTI ?? response.payoff_shortage_ti ?? response.PayoffShortageTI ?? response.payoffShortageTi ?? null,
          closingAgent: response.closingAgent ?? response.closing_agent ?? response.ClosingAgent ?? null,
          scheduledClosingDate: response.scheduledClosingDate ?? response.scheduled_closing_date ?? response.ScheduledClosingDate ?? null,
          scheduledDisbursementDate: response.scheduledDisbursementDate ?? response.scheduled_disbursement_date ?? response.ScheduledDisbursementDate ?? null,
          firstPaymentDate: response.firstPaymentDate ?? response.first_payment_date ?? response.FirstPaymentDate ?? null,
        };

        setData(normalizedData);
        setIsError(false);
        setErrorMessage('');
      } catch (error: any) {
        setIsError(true);
        setErrorMessage(error.message || "Failed to fetch loan data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoanData();
  }, [client, loanNumberToFetch]);

  return { data, isLoading, isError, errorMessage };
}