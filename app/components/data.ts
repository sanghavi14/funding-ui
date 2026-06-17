// --- TYPES ---
export interface TrackingItem {
  id: string;
  name: string;
  status: string;
  priorTo: string;
  dueDate: string;
  hasException: string;
}

export interface ApplicationEvent {
  id?: string;
  eventName: string;
  eventType: string;
  eventStatus: string;
  eventDateTime: string;
  eventReason: string;
}

export interface WireBankContactData {
  id?: string;
  loanNumber: string;
  addressType: string;
  name: string;
  city: string;
  state: string;
  zip: string;
  shortName: string;
  aba: string;
  account: string;
  accountName: string;
}

export interface ComplianceEaseData {
  id?: string;
  loanNumber: string;
  reqNum: number;
  date: string;
  userId: string;
  reqScore: string;
  trid: string;
  reqType: string;
  status: string;
  method: string;
  isHoepa: string;
  isHpml: string;
  licenceAudit: string;
}

export interface CashToCloseData {
  loanNumber: string;
  maxBaseLoanAmount: string;
  actualBaseAmount: string;
  proposedPayment: string;
  liquidAssetsAvailable: string;
  minBaseLoanAmount: string;
  escrowShortage: string;
  cashToClose: string;
  cashToBorrower: string;
}

export interface FraudGuardData {
  loanNumber: string;
  fraudGuardScore: string;
  fraudGuardService: string;
  lastRunDate: string;
  tiName: string;
  requestType: string;
  notaryName: string;
  notaryPhoneNumber: string;
  tiStatus: string;
}

export interface LoanDocumentData {
  id: string;
  loanNumber: string;
  documentName: string;
  fileName: string;
  uploadedDateTime: string;
  description: string;
  fileUrl: string;
  attachmentObj?: any;
}

// --- MOCK ASYNC METHODS (Simulating SDK) ---
import { TrackingItem as sdkTrackingItem, AppEvent as sdkAppEvent,
  WireBankContact as sdkWireBankContact,
  
  ComplianceEase as sdkComplianceEase,
  CashToCloseData as sdkCashToClose,
  Fraudguard as sdkFraudguard,
  LoanDocument as sdkLoanDocument,
  getTrackingItemsIntent as sdkGetTrackingItemsIntent,
  getAppEventsIntent as sdkGetAppEventsIntent,
  getWireBankContactsIntent as sdkGetWireBankContactsIntent,
  markTiStatusAsComplete,
  updateTrackingItemData,
  updateWireBankToJson,
  createLoanDocument as sdkCreateLoanDocument,
  modifyLoanDocument as sdkModifyLoanDocument,
  deleteLoanDocument as sdkDeleteLoanDocument,
} from '@funding-ui-osdk/sdk';

const sdkObjectFetchCache = new Set<string>();

const fetchSdkObjectPage = async (client: any, objectType: any, filter: any) => {
  if (!client) return null;
  if (sdkObjectFetchCache.has(objectType.apiName)) return null;

  try {
    const page = await client(objectType)
      .where(filter)
      .fetchPage({ $pageSize: 100 });
    return Array.isArray(page.data) ? page.data : [];
  } catch (err: any) {
    const errorMessage = err?.message ?? String(err);
    if (errorMessage.includes('404') || errorMessage.includes('Failed to fetch')) {
      sdkObjectFetchCache.add(objectType.apiName);
    }
    console.debug(`SDK fetch failed for ${objectType.apiName}; falling back to mock data.`, err);
    return null;
  }
};

export const uploadLoanDocument = async (client: any, payload: { loanNumber: string, documentName: string, description: string, loanDocuments: any }): Promise<boolean> => {
  if (client) {
    try {
      await client(sdkCreateLoanDocument).applyAction({
        description: payload.description,
        documentName: payload.documentName,
        loanDocuments: payload.loanDocuments,
        loanNumber: payload.loanNumber,
      });
      return true;
    } catch (err) {
      console.error('SDK createLoanDocument action failed:', err);
      return false;
    }
  }
  return true;
};

export const modifyLoanDocument = async (client: any, loanDocId: string, payload: { loanNumber: string, documentName: string, description: string, loanDocuments: any }): Promise<boolean> => {
  if (client && loanDocId) {
    try {
      const attachmentValue = payload.loanDocuments && typeof payload.loanDocuments === 'object' && 'rid' in payload.loanDocuments
        ? payload.loanDocuments.rid
        : payload.loanDocuments;

      await client(sdkModifyLoanDocument).applyAction({
        description: payload.description,
        documentName: payload.documentName,
        loan_document: loanDocId,
        loanDocuments: attachmentValue,
        loanNumber: payload.loanNumber,
      });
      return true;
    } catch (err) {
      console.error('SDK modifyLoanDocument action failed:', err);
      return false;
    }
  }

  // Update mock data for interactive simulation
  const docIndex = LoanDocumentMock.findIndex(doc => doc.id === loanDocId);
  if (docIndex !== -1) {
    const isNewFile = payload.loanDocuments instanceof File;
    LoanDocumentMock[docIndex] = {
      ...LoanDocumentMock[docIndex],
      documentName: payload.documentName,
      description: payload.description,
      ...(isNewFile ? {
        fileName: payload.loanDocuments.name,
        fileUrl: `#preview-${payload.loanDocuments.name}`,
        uploadedDateTime: new Date().toISOString()
      } : {})
    };
  }
  return true;
};

export const deleteLoanDocument = async (client: any, loanDocId: string): Promise<boolean> => {
  if (client && loanDocId) {
    try {
      await client(sdkDeleteLoanDocument).applyAction({
        loan_document: loanDocId,
      });
      return true;
    } catch (err) {
      console.error('SDK deleteLoanDocument action failed:', err);
      return false;
    }
  }

  // Update mock data for interactive simulation
  const docIndex = LoanDocumentMock.findIndex(doc => doc.id === loanDocId);
  if (docIndex !== -1) {
    LoanDocumentMock.splice(docIndex, 1);
  }
  return true;
};

export const updateWireBank = async (client: any, wireObjId: string, payload: WireBankContactData): Promise<boolean> => {
  if (client && wireObjId) {
    try {
      await client(updateWireBankToJson).applyAction({
        abaNum: parseInt(payload.aba) || 0,
        acctName: payload.accountName,
        acctNum: parseInt(payload.account) || 0,
        addType: payload.addressType,
        city: payload.city,
        loanNum: payload.loanNumber,
        name: payload.name,
        shortName: payload.shortName,
        state: payload.state,
        wireObj: wireObjId,
        zipPlus: payload.zip,
      });
      return true;
    } catch (err) {
      console.error('SDK updateWireBankToJson action failed:', err);
      return false;
    }
  }
  return true;
};

export const updateTrackingItem = async (client: any, tiId: string, payload: { dueDate: string, hasExcp: string, loanNum: string, priorTo: string, tiName: string, tiStatus: string }): Promise<boolean> => {
  if (client && tiId) {
    try {
      await client(updateTrackingItemData).applyAction({
        dueDate: payload.dueDate,
        hasExcp: payload.hasExcp,
        loanNum: payload.loanNum,
        priorTo: payload.priorTo,
        tiData: tiId,
        tiName: payload.tiName,
        tiStatus: payload.tiStatus,
      });
      return true;
    } catch (err) {
      console.error('SDK updateTrackingItemData action failed:', err);
      return false;
    }
  }
  return true;
};

export const markTrackingItemsComplete = async (client: any, trackingItemIds: string[]): Promise<boolean> => {
  if (client && trackingItemIds.length > 0) {
    try {
      await client(markTiStatusAsComplete).applyAction({
        allTIs: client(sdkTrackingItem).where({ id: { $in: trackingItemIds } })
      });
      return true;
    } catch (err) {
      console.error('SDK markTiStatusAsComplete action failed:', err);
      return false;
    }
  }
  return true;
};

export const getTrackingItemsIntentFlag = async (clientOrLoanNumber: any, maybeLoanNumber?: string): Promise<string> => {
  let client: any = null;
  let loanNumber: string;
  if (typeof clientOrLoanNumber === 'string') {
    loanNumber = clientOrLoanNumber;
  } else {
    client = clientOrLoanNumber;
    loanNumber = maybeLoanNumber || '';
  }

  if (client) {
    try {
      const result = await client(sdkGetTrackingItemsIntent).executeFunction({ loanNumber });
      return typeof result === 'string' ? result : (result?.value ?? "SUCCESS");
    } catch (err) {
      console.error('SDK tracking items intent fetch failed:', err);
    }
  }
  return "SUCCESS";
};

export const getAppEventsIntentFlag = async (clientOrLoanNumber: any, maybeLoanNumber?: string): Promise<string> => {
  let client: any = null;
  let loanNumber: string;
  if (typeof clientOrLoanNumber === 'string') {
    loanNumber = clientOrLoanNumber;
  } else {
    client = clientOrLoanNumber;
    loanNumber = maybeLoanNumber || '';
  }

  if (client) {
    try {
      const result = await client(sdkGetAppEventsIntent).executeFunction({ loanNumber });
      return typeof result === 'string' ? result : (result?.value ?? "SUCCESS");
    } catch (err) {
      console.error('SDK app events intent fetch failed:', err);
    }
  }
  return "SUCCESS";
};

export const getWireBankContactsIntentFlag = async (clientOrLoanNumber: any, maybeLoanNumber?: string): Promise<string> => {
  let client: any = null;
  let loanNumber: string;
  if (typeof clientOrLoanNumber === 'string') {
    loanNumber = clientOrLoanNumber;
  } else {
    client = clientOrLoanNumber;
    loanNumber = maybeLoanNumber || '';
  }

  if (client) {
    try {
      const result = await client(sdkGetWireBankContactsIntent).executeFunction({ loanNumber });
      return typeof result === 'string' ? result : (result?.value ?? "SUCCESS");
    } catch (err) {
      console.error('SDK wire bank contacts intent fetch failed:', err);
    }
  }
  return "SUCCESS";
};

export const getTrackingItemsByLoanNumber = async (clientOrLoanNumber: any, maybeLoanNumber?: string): Promise<TrackingItem[]> => {
  // Support two signatures for backwards compatibility:
  // - getTrackingItemsByLoanNumber(loanNumber)
  // - getTrackingItemsByLoanNumber(client, loanNumber)
  let client: any = null;
  let loanNumber: string;
  if (typeof clientOrLoanNumber === 'string') {
    loanNumber = clientOrLoanNumber;
  } else {
    client = clientOrLoanNumber;
    loanNumber = maybeLoanNumber || '';
  }

  if (client) {
    const pageData = await fetchSdkObjectPage(client, sdkTrackingItem, { loanNumber: { $eq: loanNumber } });
    if (pageData) {
      return pageData.map((item: any) => ({
        ...item,
        name: item.tiName,
        status: item.tiStatus
      }));
    }
  }

  // Fallback mock
  return new Promise((resolve) => setTimeout(() => resolve([
    { id: "1", name: "Payoff Shortage", status: "Completed", priorTo: "Funded-Funds Disbursed", dueDate: "03/02/2026", hasException: "no" },
    { id: "2", name: "Funding Rework", status: "Problem", priorTo: "Funded-Funds Disbursed", dueDate: "01/01/2026", hasException: "No" },
    { id: "3", name: "CD Post Closing Adjustments", status: "In Process", priorTo: "Post Closing Purchase Complete", dueDate: "03/23/2026", hasException: "no" },
  ]), 800));
};

export const getAppEventsByLoanNumber = async (clientOrLoanNumber: any, maybeLoanNumber?: string): Promise<ApplicationEvent[]> => {
  let client: any = null;
  let loanNumber: string;
  if (typeof clientOrLoanNumber === 'string') {
    loanNumber = clientOrLoanNumber;
  } else {
    client = clientOrLoanNumber;
    loanNumber = maybeLoanNumber || '';
  }

  if (client) {
    const pageData = await fetchSdkObjectPage(client, sdkAppEvent, { loanNumber: { $eq: loanNumber } });
    if (pageData) return pageData;
  }

  // Fallback mock
  return new Promise((resolve) => setTimeout(() => resolve([
    { id: "app-event-1", eventName: "Recalc QMLoanType", eventType: "QM Loan Type", eventStatus: "Completed", eventDateTime: "12/24/2025 09:38:04", eventReason: "QM Loan Type Calc run" },
    { id: "app-event-2", eventName: "LoanLevelPricingAdj Req", eventType: "Re-Disclosure CD", eventStatus: "Completed", eventDateTime: "03/28/2021 20:37:15", eventReason: "PRICING-Change to Points..." },
    { id: "app-event-3", eventName: "BorrowerRequested NewLoanAmt", eventType: "Re-Disclosure CD", eventStatus: "Pending", eventDateTime: "07/30/2021 17:15:29", eventReason: "Borrower Requested New..." },
    { id: "app-event-4", eventName: "Update APR", eventType: "APR", eventStatus: "Completed", eventDateTime: "09/07/2021 02:09:11", eventReason: "ReCalculate APR" },
  ]), 1200));
};

export const getWireBankContactsByLoanNumber = async (clientOrLoanNumber: any, maybeLoanNumber?: string): Promise<WireBankContactData[]> => {
  let client: any = null;
  let loanNumber: string;
  if (typeof clientOrLoanNumber === 'string') {
    loanNumber = clientOrLoanNumber;
  } else {
    client = clientOrLoanNumber;
    loanNumber = maybeLoanNumber || '';
  }

  if (client) {
    const pageData = await fetchSdkObjectPage(client, sdkWireBankContact, { loanNumber: { $eq: loanNumber } });
    if (pageData) {
      return pageData.map((item: any) => ({
        ...item,
        aba: String(item.abaNum || ''),
        account: String(item.accountNum || ''),
        zip: item.zipPlus
      }));
    }
  }

  return WireBankContact.filter(item => item.loanNumber === loanNumber);
};

export const getComplianceEaseByLoanNumber = async (clientOrLoanNumber: any, maybeLoanNumber?: string): Promise<ComplianceEaseData[]> => {
  let client: any = null;
  let loanNumber: string;
  if (typeof clientOrLoanNumber === 'string') {
    loanNumber = clientOrLoanNumber;
  } else {
    client = clientOrLoanNumber;
    loanNumber = maybeLoanNumber || '';
  }

  if (client) {
    const pageData = await fetchSdkObjectPage(client, sdkComplianceEase, { loanNumber: { $eq: loanNumber } });
    if (pageData) {
      const mappedData = pageData.map((item: any) => ({
        ...item,
        userId: item.userid
      }));
      return mappedData.sort((a: any, b: any) => (a.reqNum || 0) - (b.reqNum || 0));
    }
  }

  return ComplianceEase.filter(item => item.loanNumber === loanNumber).sort((a: any, b: any) => (a.reqNum || 0) - (b.reqNum || 0));
};

export const getCashToCloseByLoanNumber = async (clientOrLoanNumber: any, maybeLoanNumber?: string): Promise<CashToCloseData[]> => {
  let client: any = null;
  let loanNumber: string;
  if (typeof clientOrLoanNumber === 'string') {
    loanNumber = clientOrLoanNumber;
  } else {
    client = clientOrLoanNumber;
    loanNumber = maybeLoanNumber || '';
  }

  if (client) {
    const pageData = await fetchSdkObjectPage(client, sdkCashToClose, { loanNummber: { $eq: loanNumber } });
    if (pageData) {
      return pageData.map((item: any) => ({
        ...item,
        loanNumber: item.loanNummber,
        maxBaseLoanAmount: String(item.maxLoanAmt || ''),
        actualBaseAmount: String(item.actualAmt || ''),
        proposedPayment: String(item.proposedPmt || ''),
        liquidAssetsAvailable: String(item.liquidAssetAvail || ''),
        minBaseLoanAmount: String(item.minLoanAmt || ''),
        escrowShortage: String(item.escrShortageAmt || ''),
        cashToClose: String(item.cashToClose || ''),
        cashToBorrower: String(item.cashToBrUwApprove || '')
      }));
    }
  }

  return CashToCloseDataArr.filter(item => item.loanNumber === loanNumber);
};

export const getFraudguardByLoanNumber = async (clientOrLoanNumber: any, maybeLoanNumber?: string): Promise<FraudGuardData[]> => {
  let client: any = null;
  let loanNumber: string;
  if (typeof clientOrLoanNumber === 'string') {
    loanNumber = clientOrLoanNumber;
  } else {
    client = clientOrLoanNumber;
    loanNumber = maybeLoanNumber || '';
  }

  if (client) {
    const pageData = await fetchSdkObjectPage(client, sdkFraudguard, { loanNumber: { $eq: loanNumber } });
    if (pageData) {
      return pageData.map((item: any) => ({
        ...item,
        fraudGuardScore: String(item.fgScore || ''),
        fraudGuardService: item.fgService,
        requestType: item.reqType,
        notaryPhoneNumber: item.notaryPhone
      }));
    }
  }

  return Fraudguard.filter(item => item.loanNumber === loanNumber);
};

export const getLoanDocumentsByLoanNumber = async (clientOrLoanNumber: any, maybeLoanNumber?: string): Promise<LoanDocumentData[]> => {
  let client: any = null;
  let loanNumber: string;
  if (typeof clientOrLoanNumber === 'string') {
    loanNumber = clientOrLoanNumber;
  } else {
    client = clientOrLoanNumber;
    loanNumber = maybeLoanNumber || '';
  }

  if (client) {
    const pageData = await fetchSdkObjectPage(client, sdkLoanDocument, { loanNumber: { $eq: loanNumber } });
    if (pageData) {
      return await Promise.all(pageData.map(async (item: any) => {
        let fileName = 'document.pdf';
        if (item.loanDocuments && typeof item.loanDocuments.fetchMetadata === 'function') {
          try {
            const metadata = await item.loanDocuments.fetchMetadata();
            if (metadata?.filename) {
              fileName = metadata.filename;
            }
          } catch (e) {
            console.warn("Failed to fetch metadata for document", e);
          }
        } else if (item.loanDocuments?.name) {
          fileName = item.loanDocuments.name;
        }

        return {
          ...item,
          fileName,
          fileUrl: item.loanDocuments?.url || '#', // Fallback URL
          attachmentObj: item.loanDocuments,
        };
      }));
    }
  }

  return LoanDocumentMock.filter(item => item.loanNumber === loanNumber);
};

// --- MOCK SYNC OBJECTS (Exported directly as requested) ---
export const LoanDocumentMock: LoanDocumentData[] = [
  { id: "doc1", loanNumber: "0100578962", documentName: "Initial Application", fileName: "1003_application.pdf", uploadedDateTime: "2025-05-10T10:00:00Z", description: "Signed 1003 application form", fileUrl: "#preview-1003" },
  { id: "doc2", loanNumber: "0100578962", documentName: "Credit Report", fileName: "credit_report.pdf", uploadedDateTime: "2025-05-11T14:30:00Z", description: "Equifax credit report", fileUrl: "#preview-credit" },
  { id: "doc3", loanNumber: "0100578962", documentName: "Income Verification", fileName: "w2_2024.pdf", uploadedDateTime: "2025-05-12T09:15:00Z", description: "W-2 for year 2024", fileUrl: "#preview-w2" }
];

export const WireBankContact: WireBankContactData[] = [
  { id: "wire-bank-1", loanNumber: "0100578962", addressType: "Wire Bank-Final", name: "Mary L. Johnson", city: "Houston", state: "FL", zip: "77002-3344", shortName: "MJOHNSON", aba: "111000026", account: "100057896202", accountName: "Johnson Household" },
  { id: "wire-bank-2", loanNumber: "0100578962", addressType: "Wire Revision Bank-Final", name: "Patricia M. Davis", city: "San Antonio", state: "TX", zip: "78205-7788", shortName: "PDAVIS", aba: "111000028", account: "100057896204", accountName: "Davis Family LLC" }
];

export const ComplianceEase: ComplianceEaseData[] = [
  { id: "comp-ease-1", loanNumber: "0100578962", reqNum: 1, date: "Apr 12, 2025", userId: "web", reqScore: "pass", trid: "N/A", reqType: "HCL", status: "error", method: "order", isHoepa: "pass", isHpml: "pass", licenceAudit: "pass" },
  { id: "comp-ease-2", loanNumber: "0100578962", reqNum: 2, date: "Apr 12, 2025", userId: "api", reqScore: "pass", trid: "N/A", reqType: "HCL", status: "success", method: "order", isHoepa: "pass", isHpml: "pass", licenceAudit: "pass" }
];

export const CashToCloseDataArr: CashToCloseData[] = [
  { loanNumber: "0100578962", maxBaseLoanAmount: "15000", actualBaseAmount: "12000", proposedPayment: "5100", liquidAssetsAvailable: "45000", minBaseLoanAmount: "7000", escrowShortage: "3200", cashToClose: "6000", cashToBorrower: "45000" }
];

export const Fraudguard: FraudGuardData[] = [
  { loanNumber: "0100578962", fraudGuardScore: "1000", fraudGuardService: "Complete", lastRunDate: "Jun 26, 2025", tiName: "Fraudguard Report-Closer", requestType: "Order", notaryName: "Jack Rose", notaryPhoneNumber: "808452211", tiStatus: "Completed" }
];
