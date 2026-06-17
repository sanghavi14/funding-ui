import React, { useState } from 'react';
import { 
  TrackingItemsSection, 
  ApplicationEventsSection, 
  WireBankContactsSection, 
  ComplianceEaseSection, 
  CashToCloseSection, 
  NotaryAndFraudGuardSection,
  LoanDocumentsSection
} from './ChildComponents';

const TABS = ['Preview Funding', 'Loan Documents', 'Contact', 'Title Information', 'Escrows', 'Payoffs', 'Fees'];

interface TabbedConfigProps {
  loanNumber: string;
  client?: any;
  filterIds?: {
    tracking_item_ids: string[] | null;
    app_event_ids: string[] | null;
    wire_bank_ids: string[] | null;
    compliance_ease_ids: string[] | null;
  } | null;
}

export const TabbedConfiguration: React.FC<TabbedConfigProps> = ({ loanNumber, client, filterIds }) => {
  const [activeTab, setActiveTab] = useState('Preview Funding');

  // Section Visibility State
  const [visibleSections, setVisibleSections] = useState({
    trackingItems: true,
    applicationEvents: true,
    wireBankContacts: true,
    complianceEase: true,
    cashToClose: true,
    notaryFraud: true,
  });

  // Individual toggle handler
  const toggleSection = (section: keyof typeof visibleSections) => {
    setVisibleSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // --- NEW HANDLERS FOR THE ICON BUTTONS ---
  const selectAllSections = () => {
    setVisibleSections({
      trackingItems: true,
      applicationEvents: true,
      wireBankContacts: true,
      complianceEase: true,
      cashToClose: true,
      notaryFraud: true,
    });
  };

  const deselectAllSections = () => {
    setVisibleSections({
      trackingItems: false,
      applicationEvents: false,
      wireBankContacts: false,
      complianceEase: false,
      cashToClose: false,
      notaryFraud: false,
    });
  };

  const CheckboxItem = ({ label, isChecked, onChange }: { label: string, isChecked: boolean, onChange: () => void }) => (
    <label className="flex items-center space-x-2 cursor-pointer mb-3">
      <input type="checkbox" checked={isChecked} onChange={onChange} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );

  return (
    <div className="border-x border-b border-slate-200 bg-white rounded-b-md">
      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 px-2 pt-2 bg-slate-50 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="p-4 bg-[#f4f6f8]">
        {activeTab === 'Preview Funding' ? (
          <div className="flex flex-col gap-6">
            
            {/* The Configuration Panel (Checkboxes & Action Icons) */}
            <div className="flex gap-4">
              <div className="flex-grow border border-slate-200 bg-white p-6 flex flex-wrap shadow-sm rounded-sm">
                <div className="w-1/3">
                  <CheckboxItem label="Tracking Items" isChecked={visibleSections.trackingItems} onChange={() => toggleSection('trackingItems')} />
                  <CheckboxItem label="Cash to Close" isChecked={visibleSections.cashToClose} onChange={() => toggleSection('cashToClose')} />
                </div>
                <div className="w-1/3">
                  <CheckboxItem label="Application Events" isChecked={visibleSections.applicationEvents} onChange={() => toggleSection('applicationEvents')} />
                  <CheckboxItem label="Notary & Fraud Guard" isChecked={visibleSections.notaryFraud} onChange={() => toggleSection('notaryFraud')} />
                </div>
                <div className="w-1/3">
                  <CheckboxItem label="Wire Bank Contacts" isChecked={visibleSections.wireBankContacts} onChange={() => toggleSection('wireBankContacts')} />
                  <CheckboxItem label="Compliance Ease" isChecked={visibleSections.complianceEase} onChange={() => toggleSection('complianceEase')} />
                </div>
              </div>
              
              {/* Action Icons with new onClick handlers */}
              <div className="w-16 shrink-0 border border-slate-200 bg-white shadow-sm flex flex-col items-center py-2 gap-2 rounded-sm">
                
                {/* Select All Button */}
                <button 
                  onClick={selectAllSections} 
                  title="Select All Options"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                </button>

                {/* Deselect All Button */}
                <button 
                  onClick={deselectAllSections} 
                  title="Deselect All Options"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded border-t border-slate-100 w-full flex justify-center transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {/* Using an eraser-style/clear icon */}
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path>
                  </svg>
                </button>

              </div>
            </div>

            {/* The Dynamic Tiles Grid */}
            <div className="flex flex-col gap-6">
              {/* ROW 1 */}
              {(visibleSections.trackingItems || visibleSections.applicationEvents) && (
                <div className={`grid gap-6 ${visibleSections.trackingItems && visibleSections.applicationEvents ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                  {visibleSections.trackingItems && <TrackingItemsSection client={client} loanNumber={loanNumber} filterIds={filterIds?.tracking_item_ids} />}
                  {visibleSections.applicationEvents && <ApplicationEventsSection client={client} loanNumber={loanNumber} filterIds={filterIds?.app_event_ids} />}
                </div>
              )}

              {/* ROW 2 */}
              {visibleSections.wireBankContacts && <WireBankContactsSection client={client} loanNumber={loanNumber} filterIds={filterIds?.wire_bank_ids} />}
              {visibleSections.complianceEase && <ComplianceEaseSection client={client} loanNumber={loanNumber} filterIds={filterIds?.compliance_ease_ids} />}

              {/* ROW 3 */}
              {(visibleSections.cashToClose || visibleSections.notaryFraud) && (
                <div className={`grid gap-6 ${visibleSections.cashToClose && visibleSections.notaryFraud ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                  {visibleSections.cashToClose && <CashToCloseSection client={client} loanNumber={loanNumber} />}
                  {visibleSections.notaryFraud && <NotaryAndFraudGuardSection client={client} loanNumber={loanNumber} />}
                </div>
              )}
            </div>

          </div>
        ) : activeTab === 'Loan Documents' ? (
          <LoanDocumentsSection client={client} loanNumber={loanNumber} />
        ) : (
          <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-sm">
            Content for <strong>{activeTab}</strong> will go here.
          </div>
        )}
      </div>
    </div>
  );
};