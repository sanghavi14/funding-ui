import React, { useState } from 'react';
import { 
  TrackingItemsSection, 
  ApplicationEventsSection, 
  WireBankContactsSection, 
  ComplianceEaseSection, 
  CashToCloseSection, 
  NotaryAndFraudGuardSection 
} from './ChildComponents';

export default function FundingDashboard() {
  // Shared state connecting all child components to the same data entity
  const [loanNumber, setLoanNumber] = useState("LN-123"); 

  // Section Visibility State
  const [visibleSections, setVisibleSections] = useState({
    trackingItems: true,
    applicationEvents: true,
    wireBankContacts: true,
    complianceEase: true,
    cashToClose: true,
    notaryFraud: true,
  });

  const toggleSection = (section: keyof typeof visibleSections) => {
    setVisibleSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="max-w-[1400px] mx-auto p-6 font-sans text-slate-800 min-h-screen bg-[#f4f6f8]">
      
      {/* Search Header */}
      <div className="mb-6 flex gap-4 items-center">
        <label className="font-semibold text-sm">Active Loan Number:</label>
        <input 
          type="text" 
          value={loanNumber} 
          onChange={(e) => setLoanNumber(e.target.value)}
          className="border border-slate-300 px-3 py-1.5 rounded text-sm w-48 focus:outline-none focus:border-blue-500"
        />
        <span className="text-xs text-slate-500 italic">(Set to LN-123 to see mock data)</span>
      </div>

      {/* Configuration Toggles (Replicating the checkbox layout from prior context) */}
      <div className="bg-white border border-slate-200 p-6 mb-8 flex flex-wrap shadow-sm">
        <div className="w-1/3">
          <label className="flex items-center space-x-2 cursor-pointer mb-3">
            <input type="checkbox" checked={visibleSections.trackingItems} onChange={() => toggleSection('trackingItems')} className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm">Tracking Items</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer mb-3">
            <input type="checkbox" checked={visibleSections.cashToClose} onChange={() => toggleSection('cashToClose')} className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm">Cash to Close</span>
          </label>
        </div>
        <div className="w-1/3">
          <label className="flex items-center space-x-2 cursor-pointer mb-3">
            <input type="checkbox" checked={visibleSections.applicationEvents} onChange={() => toggleSection('applicationEvents')} className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm">Application Events</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer mb-3">
            <input type="checkbox" checked={visibleSections.notaryFraud} onChange={() => toggleSection('notaryFraud')} className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm">Notary & Fraud Guard</span>
          </label>
        </div>
        <div className="w-1/3">
          <label className="flex items-center space-x-2 cursor-pointer mb-3">
            <input type="checkbox" checked={visibleSections.wireBankContacts} onChange={() => toggleSection('wireBankContacts')} className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm">Wire Bank Contacts</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer mb-3">
            <input type="checkbox" checked={visibleSections.complianceEase} onChange={() => toggleSection('complianceEase')} className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm">Compliance Ease</span>
          </label>
        </div>
      </div>

      {/* DYNAMIC CONTENT AREA */}
      <div className="flex flex-col gap-6">
        
        {/* ROW 1: Tracking Items & App Events */}
        {(visibleSections.trackingItems || visibleSections.applicationEvents) && (
          <div className={`grid gap-6 ${visibleSections.trackingItems && visibleSections.applicationEvents ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {visibleSections.trackingItems && <TrackingItemsSection loanNumber={loanNumber} />}
            {visibleSections.applicationEvents && <ApplicationEventsSection loanNumber={loanNumber} />}
          </div>
        )}

        {/* ROW 2: Wire Bank Contacts & Compliance Ease */}
        {visibleSections.wireBankContacts && <WireBankContactsSection loanNumber={loanNumber} />}
        {visibleSections.complianceEase && <ComplianceEaseSection loanNumber={loanNumber} />}

        {/* ROW 3: Cash to Close & Notary/Fraud Guard */}
        {(visibleSections.cashToClose || visibleSections.notaryFraud) && (
          <div className={`grid gap-6 ${visibleSections.cashToClose && visibleSections.notaryFraud ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {visibleSections.cashToClose && <CashToCloseSection loanNumber={loanNumber} />}
            {visibleSections.notaryFraud && <NotaryAndFraudGuardSection loanNumber={loanNumber} />}
          </div>
        )}

      </div>
    </div>
  );
}