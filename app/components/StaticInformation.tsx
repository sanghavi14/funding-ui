// components/StaticInformation.tsx
import React, { useState } from 'react';
import { LoanInformation } from '../types/loan';

interface Props {
  data: LoanInformation | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

export const StaticInformation: React.FC<Props> = ({ data, isLoading, isError, errorMessage }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Helper to render field groups to keep code DRY
  const renderField = (label: string, value: string | null | undefined) => (
    <div className="mb-3 last:mb-0">
      <label className="block text-[11px] font-semibold text-slate-400 mb-0.5 tracking-wide">{label}</label>
      {isLoading ? (
        <div className="h-4 w-28 bg-slate-100 rounded animate-pulse my-1" />
      ) : (
        <div className="text-[13px] font-semibold text-slate-700 leading-tight">
          {value !== undefined && value !== null && value !== '' ? value : '-'}
        </div>
      )}
    </div>
  );

  return (
    <div className="border border-slate-200 bg-white rounded-md overflow-hidden shadow-sm">
      {/* Header - Pixel-perfect match with LoanAgentSidebar */}
      <div className="bg-[#104281] text-white h-10 flex justify-between items-center px-4 select-none shrink-0 border-b border-blue-900/20">
        <h2 className="text-[13px] font-semibold tracking-wide font-sans">Static Information</h2>
        <div className="flex items-center">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-white/10 text-white transition-colors cursor-pointer flex items-center justify-center"
            title={isCollapsed ? "Expand Section" : "Collapse Section"}
          >
            {isCollapsed ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"></path>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Grid Content */}
      {!isCollapsed && (
        <div className="p-4 bg-slate-50/50">
          {isError && (
            <div className="text-red-500 text-sm mb-4">
              Error loading data. {errorMessage ? errorMessage : ''}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">
            {/* Column 1 (Box Card) */}
            <div className="bg-white border border-slate-200/80 rounded-md p-4 shadow-sm flex flex-col gap-4 justify-start">
              {renderField('Loan Number', data?.loanNumber)}
              {renderField('Borrower(s) Name', data?.borrowerName)}
              {renderField('Property Address',  data?.propertyAddress)}
            </div>

            {/* Middle portion Card (Columns 2, 3, and 4) */}
            <div className="md:col-span-3 bg-white border border-slate-200/80 rounded-md p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {/* Column 2 */}
              <div className="flex flex-col gap-4 justify-start md:border-r md:border-slate-200/80 md:pr-6">
                {renderField('Loan Amount', data?.loanAmount)}
                {renderField('Interest Rate', data?.interestRate)}
                {renderField('Cash Out/No Cash Out?', data?.cashOut)}
                {renderField('Loan Purpose', data?.loanPurpose)}
              </div>

              {/* Column 3 */}
              <div className="flex flex-col gap-4 justify-start md:border-r md:border-slate-200/80 md:pr-6 md:pl-2">
                {renderField('Loan Type', data?.loanType)}
                {renderField('Doc Type', data?.docType)}
                {renderField('Product', data?.product)}
                {renderField('Division', data?.division)}
              </div>

              {/* Column 4 */}
              <div className="flex flex-col gap-4 justify-start md:pl-2">
                {renderField('Loan Status', data?.loanStatus)}
                {renderField('Funding Rework TI', data?.fundingReworkTI)}
                {renderField('Payoff Shortage TI', data?.payoffShortageTI)}
                {renderField('Closing Agent', data?.closingAgent)}
              </div>
            </div>

            {/* Column 5 (Box Card) */}
            <div className="bg-white border border-slate-200/80 rounded-md p-4 shadow-sm flex flex-col gap-4 justify-start">
              {renderField('Scheduled Closing Date', data?.scheduledClosingDate)}
              {renderField('Scheduled Disbursement Date', data?.scheduledDisbursementDate)}
              {renderField('First Payment Date', data?.firstPaymentDate)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};