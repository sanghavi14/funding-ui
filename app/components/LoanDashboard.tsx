// components/LoanDashboard.tsx
import React, { useState } from 'react';
import { useLoanData } from '../hooks/useLoanData';
import { StaticInformation } from './StaticInformation';
import { PromptSection } from './PromptSection';
import { TabbedConfiguration } from './TabbedConfiguration';
import LoanAgentSidebar from './LoanAgentSidebar';
import { 
  objectsFilterAipLogic, 
  parseAIPFilterOutput,
  TrackingItem as sdkTrackingItem,
  AppEvent as sdkAppEvent,
  WireBankContact as sdkWireBankContact,
  ComplianceEase as sdkComplianceEase
} from '@funding-ui-osdk/sdk';

interface DashboardProps {
  client: any; // Pass the client from your page.tsx
  loanNumber: string;
}

export interface FilterIds {
  tracking_item_ids: string[] | null;
  app_event_ids: string[] | null;
  wire_bank_ids: string[] | null;
  compliance_ease_ids: string[] | null;
}

export default function LoanDashboard({ client, loanNumber }: DashboardProps) {
  // Pass the client and loan number to your data fetching abstraction
  const { data, isLoading, isError, errorMessage } = useLoanData(client, loanNumber);

  const [isPromptLoading, setIsPromptLoading] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [filterIds, setFilterIds] = useState<FilterIds | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleExecutePrompt = async (userQuery: string) => {
    if (!userQuery.trim()) return;

    if (!client) {
      // Premium interactive simulation in mock mode
      setIsPromptLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        const query = userQuery.toLowerCase();
        let tracking_item_ids: string[] = ["1", "2", "3"];
        let app_event_ids: string[] = ["app-event-1", "app-event-2", "app-event-3", "app-event-4"];
        let wire_bank_ids: string[] = ["wire-bank-1", "wire-bank-2"];
        let compliance_ease_ids: string[] = ["comp-ease-1", "comp-ease-2"];

        if (query.includes("completed") || query.includes("complete")) {
          tracking_item_ids = ["1"];
          app_event_ids = ["app-event-1", "app-event-2", "app-event-4"];
        } else if (query.includes("problem") || query.includes("rework")) {
          tracking_item_ids = ["2"];
          app_event_ids = [];
          wire_bank_ids = [];
          compliance_ease_ids = [];
        } else if (query.includes("process") || query.includes("pending")) {
          tracking_item_ids = ["3"];
          app_event_ids = ["app-event-3"];
          wire_bank_ids = [];
          compliance_ease_ids = [];
        } else if (query.includes("mary") || query.includes("johnson") || query.includes("houston")) {
          tracking_item_ids = [];
          app_event_ids = [];
          wire_bank_ids = ["wire-bank-1"];
          compliance_ease_ids = [];
        } else if (query.includes("patricia") || query.includes("davis") || query.includes("san antonio")) {
          tracking_item_ids = [];
          app_event_ids = [];
          wire_bank_ids = ["wire-bank-2"];
          compliance_ease_ids = [];
        } else if (query.includes("error") || query.includes("fail")) {
          tracking_item_ids = [];
          app_event_ids = [];
          wire_bank_ids = [];
          compliance_ease_ids = ["comp-ease-1"];
        } else if (query.includes("success") || query.includes("pass")) {
          tracking_item_ids = [];
          app_event_ids = [];
          wire_bank_ids = [];
          compliance_ease_ids = ["comp-ease-2"];
        } else {
          // Slice or select standard subset
          tracking_item_ids = ["1", "3"];
          app_event_ids = ["app-event-1", "app-event-3"];
          wire_bank_ids = ["wire-bank-1"];
          compliance_ease_ids = ["comp-ease-2"];
        }

        const result = {
          tracking_item_ids,
          app_event_ids,
          wire_bank_ids,
          compliance_ease_ids
        };

        setFilterIds(result);
      } catch (e) {
        console.error("Local mock AIP processing error:", e);
      } finally {
        setIsPromptLoading(false);
      }
      return;
    }

    setIsPromptLoading(true);
    try {
      // Invoke step 1: OSDK function objectsFilterAipLogic
      const aipRes = await client(objectsFilterAipLogic).executeFunction({
        userQuery,
        trackingItemsBaseline: client(sdkTrackingItem).where({ loanNumber: { $eq: loanNumber } }),
        appEventsBaseline: client(sdkAppEvent).where({ loanNumber: { $eq: loanNumber } }),
        wireBanksBaseline: client(sdkWireBankContact).where({ loanNumber: { $eq: loanNumber } }),
        complianceEaseBaseline: client(sdkComplianceEase).where({ loanNumber: { $eq: loanNumber } }),
      });

      // Convert the response structure of objectsFilterAipLogic into a JSON string
      const jsonStringInput = typeof aipRes === 'string' ? aipRes : JSON.stringify(aipRes);

      // Invoke step 2: parse AIP filter output
      const parsed = await client(parseAIPFilterOutput).executeFunction({
        jsonString: jsonStringInput,
      });

      const result = {
        tracking_item_ids: parsed.tracking_item_ids || [],
        app_event_ids: parsed.app_event_ids || [],
        wire_bank_ids: parsed.wire_bank_ids || [],
        compliance_ease_ids: parsed.compliance_ease_ids || [],
      };

      // Filter and update UI
      setFilterIds(result);
    } catch (error) {
      console.error("Failed to execute prompt AIP filter:", error);
      alert("Failed to filter objects. Please check query and try again.");
    } finally {
      setIsPromptLoading(false);
    }
  };

  const handleResetPrompt = () => {
    setFilterIds(null);
    setPromptText('');
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto flex gap-4 items-start">
      {/* Collapsible Left Loan Agent Sidebar */}
      <LoanAgentSidebar 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        activeLoanData={data}
        client={client}
        onSendMessage={(text) => {
          console.log("Sidebar query initiated:", text);
        }}
      />

      {/* Main Right Content Panel */}
      <div className="flex-grow min-w-0 flex flex-col gap-0 shadow-sm bg-white rounded-md border border-slate-200">
        <StaticInformation 
          data={data} 
          isLoading={isLoading} 
          isError={isError} 
          errorMessage={errorMessage}
        />
        <PromptSection 
          isLoading={isPromptLoading}
          promptText={promptText}
          setPromptText={setPromptText}
          onExecute={handleExecutePrompt}
          onReset={handleResetPrompt}
        />
        {/* Pass the loanNumber and client down here */}
        <TabbedConfiguration 
          loanNumber={loanNumber} 
          client={client} 
          filterIds={filterIds}
        /> 
      </div>
    </div>
  );
}