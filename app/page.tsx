"use client"; // Required in Next.js App Router for components using hooks

import {
  getLoanDataByLoanNumber
} from "@funding-ui-osdk/sdk";
import { createClient } from "@osdk/client";
import { createPublicOauthClient } from "@osdk/oauth";
import { useState } from "react";
import LoanDashboard from "./components/LoanDashboard";

// --- OSDK Configuration ---
const redirectUrl = typeof window !== "undefined"
  ? window.location.origin
  : "http://localhost";

const auth = createPublicOauthClient(
  process.env.CLIENT_ID || "", //client id
  process.env.FOUNDRY_BASE_URL || "", //Foundry base url
  redirectUrl, // Redirected URL Must match exactly what is in Foundry
  {
    postLoginPage: typeof window !== "undefined" ? window.location.toString() : redirectUrl,
    scopes: [
      "api:read-data",
      "api:write-data",
      "api:aip-agents-read",
      "api:aip-agents-write"
    ]
  }
);

const client = createClient(
  process.env.FOUNDRY_BASE_URL || "", //Foundry base url
  process.env.ONTOLOGY_RID || "", // Found in your Developer Console SDK page
  auth
);

export default function Home() {
  // --- State Hooks ---
  //const [loanNumber, setLoanNumber] = useState<string>("");
  const [loanNumber, setLoanNumber] = useState<string>(process.env.DEFAULT_LOAN_NUMBER || "0100578962");
  const [loanData, setLoanData] = useState<any | null>(null); // Replace 'any' with your actual LoanInformation type if available
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // --- API Handler ---
  const handleFetchLoan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loanNumber.trim()) {
      setError("Please enter a valid loan number.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoanData(null);

    try {
      // Assuming getLoanDataByLoanNumber takes the client/auth context or handles it internally via the OSDK setup
      // const data = await getLoanDataByLoanNumber(loanNumber.trim());
      const data = await client(getLoanDataByLoanNumber).executeFunction({ loanNum: loanNumber.trim() });
      if (data) {
        setLoanData(data);
      } else {
        setError("No loan data found for the provided number.");
      }
    } catch (err: any) {
      console.error("Error fetching loan data:", err);
      setError(err.message || "An error occurred while fetching loan data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100/50 font-sans">
      {/* Palantir Workshop Top Header Bar */}
      <div className="w-full bg-[#104281] text-white h-11 flex items-center justify-center px-6 shrink-0 relative shadow-sm border-b border-blue-900/40 select-none">
        <h1 className="text-sm font-semibold tracking-wider font-sans leading-none">
          Funding Workshop
        </h1>
      </div>

      {/* Workspace Sub-Toolbar for Loan Lookup & Global Filters */}
      <div className="w-full bg-white border-b border-slate-200 px-6 py-2 flex flex-col sm:flex-row justify-between items-center shrink-0 gap-3 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Loan:
          </span>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded">
            {loanNumber || "None Loaded"}
          </span>
        </div>

        {/* Elegant horizontal Search Form */}
        <form onSubmit={handleFetchLoan} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-grow sm:w-60">
            <input
              type="text"
              placeholder={`e.g. ${process.env.DEFAULT_LOAN_NUMBER || "0100578962"}`}
              value={loanNumber}
              onChange={(e) => setLoanNumber(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-500 bg-slate-50/50"
            />
            {isLoading && (
              <div className="absolute right-2.5 top-2.5">
                <svg className="animate-spin h-3.5 w-3.5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !loanNumber.trim()}
            className="px-3.5 py-1.5 bg-[#104281] hover:bg-[#0d3466] text-white text-xs font-semibold rounded shadow-xs flex items-center justify-center transition-colors cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            Load
          </button>
        </form>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="w-full max-w-7xl mx-auto px-6 py-3 mt-4 bg-red-50 text-red-700 border border-red-200 rounded-md text-xs font-medium flex items-center space-x-2">
          <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span><strong>Error:</strong> {error}</span>
        </div>
      )}

      {/* main content viewport - natural page scroll */}
      <main className="flex-grow w-full p-4 flex flex-col">
        {loanNumber && !error && (
          <div className="w-full flex flex-col animate-fadeIn">
            <LoanDashboard
              client={client}
              loanNumber={loanNumber}
            />
          </div>
        )}
      </main>
    </div>
  );
}
