import React, { useEffect, useState, useRef } from 'react';
import { getWireBankContactsIntentFlag, getAppEventsIntentFlag, getTrackingItemsIntentFlag, getTrackingItemsByLoanNumber, getAppEventsByLoanNumber, getWireBankContactsByLoanNumber, getComplianceEaseByLoanNumber, getCashToCloseByLoanNumber, getFraudguardByLoanNumber, getLoanDocumentsByLoanNumber, markTrackingItemsComplete, updateTrackingItem, updateWireBank, uploadLoanDocument, modifyLoanDocument, deleteLoanDocument, TrackingItem, ApplicationEvent, WireBankContactData, ComplianceEaseData, CashToCloseData, FraudGuardData, LoanDocumentData } from './data';

// --- Reusable Tile Header ---
const TileHeader = ({
  title,
  count,
  hasStatus,
  hasFlag,
  flagColor,
  selectedStatus,
  onStatusSelect,
  statuses = ["All", "Completed", "Problem", "In Process"]
}: {
  title: string,
  count?: number,
  hasStatus?: boolean,
  hasFlag?: boolean,
  flagColor?: string,
  selectedStatus?: string | null,
  onStatusSelect?: (status: string | null) => void,
  statuses?: string[]
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  return (
    <div className="bg-[#194b8c] text-white px-4 py-2 flex justify-between items-center text-sm font-medium relative select-none">
      <div className="flex items-center gap-3">
        {title}
        {count !== undefined && <span className="bg-[#2a62a9] px-2 py-0.5 rounded text-xs">{count}</span>}
      </div>
      <div className="flex items-center gap-2">
        {hasStatus && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`border border-white/30 px-3 py-0.5 rounded-full text-xs hover:bg-white/10 transition flex items-center gap-1.5 cursor-pointer active:scale-95 duration-100 ${selectedStatus && selectedStatus !== 'All' ? 'bg-[#2a62a9] border-[#2a62a9] font-semibold' : ''}`}
            >
              <span>{selectedStatus && selectedStatus !== 'All' ? `Status: ${selectedStatus}` : 'Status'}</span>
              <svg className={`w-2.5 h-2.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Status Dropdown Options Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white text-slate-800 rounded shadow-md border border-slate-200 py-1 z-40 overflow-hidden">
                {statuses.map((status) => {
                  const isSelected = selectedStatus === status || (status === 'All' && !selectedStatus);
                  return (
                    <button
                      key={status}
                      onClick={() => {
                        if (onStatusSelect) onStatusSelect(status === 'All' ? null : status);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex justify-between items-center cursor-pointer ${isSelected
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'hover:bg-slate-50 text-slate-600'
                        }`}
                    >
                      <span>{status}</span>
                      {isSelected && <span className="text-blue-600 font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {hasFlag && <div className={`${flagColor === 'green' ? 'bg-green-500' : 'bg-red-500'} w-5 h-5 rounded flex items-center justify-center cursor-pointer`}><span className="text-[10px]">⚑</span></div>}
      </div>
    </div>
  );
};

// --- 1. Tracking Items Section ---
export const TrackingItemsSection = ({ client, loanNumber, filterIds }: { client?: any; loanNumber: string; filterIds?: string[] | null }) => {
  const [data, setData] = useState<TrackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [flagColor, setFlagColor] = useState<'red' | 'green'>('red');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Popup state
  const [isUpdatePopupOpen, setIsUpdatePopupOpen] = useState(false);
  const [updateFormData, setUpdateFormData] = useState({
    dueDate: '',
    hasExcp: '',
    loanNum: '',
    priorTo: '',
    tiName: '',
    tiStatus: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const reloadData = React.useCallback(() => {
    setLoading(true);
    if (client) {
      getTrackingItemsByLoanNumber(client, loanNumber).then(res => { setData(res); setLoading(false); });
      getTrackingItemsIntentFlag(client, loanNumber).then(res => setFlagColor(res === 'DANGER' ? 'red' : 'green'));
    } else {
      getTrackingItemsByLoanNumber(loanNumber).then(res => { setData(res); setLoading(false); });
      getTrackingItemsIntentFlag(loanNumber).then(res => setFlagColor(res === 'DANGER' ? 'red' : 'green'));
    }
  }, [client, loanNumber]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  const toggleSelectRow = (id: string) => {
    const newSet = new Set<string>(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectedItems = data.filter(d => selectedIds.has(d.id));
  const isCompleteButtonEnabled = selectedItems.length > 0 && selectedItems.every(d => d.status !== 'Completed' && d.status !== 'Complete');
  const isUpdateButtonEnabled = selectedItems.length === 1;

  const handleCompleteClick = async () => {
    if (!isCompleteButtonEnabled || isCompleting) return;
    setIsCompleting(true);
    const trackingItemIds = Array.from(selectedIds);
    try {
      const success = await markTrackingItemsComplete(client, trackingItemIds);
      if (success) {
        setSelectedIds(new Set());
        reloadData();
      }
    } catch (err) {
      console.error("Failed to complete tracking items:", err);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleUpdateClick = () => {
    if (!isUpdateButtonEnabled) return;
    const item = selectedItems[0];
    setUpdateFormData({
      dueDate: item.dueDate || '',
      hasExcp: item.hasException || '',
      loanNum: loanNumber,
      priorTo: item.priorTo || '',
      tiName: item.name || '',
      tiStatus: item.status || '',
    });
    setIsUpdatePopupOpen(true);
  };

  const handleUpdateSubmit = async () => {
    if (selectedIds.size !== 1) return;

    if (!updateFormData.dueDate || !updateFormData.hasExcp || !updateFormData.loanNum || !updateFormData.priorTo || !updateFormData.tiName || !updateFormData.tiStatus) {
      alert("All fields are mandatory. Please fill in all the details.");
      return;
    }

    setIsUpdating(true);
    const trackingItemId = Array.from(selectedIds)[0];

    // Format date properly for OSDK if needed, assuming string for now based on requirements
    const success = await updateTrackingItem(client, trackingItemId, updateFormData);
    if (success) {
      setIsUpdatePopupOpen(false);
      setSelectedIds(new Set());
      reloadData();
    } else {
      alert("Failed to update Tracking Item.");
    }
    setIsUpdating(false);
  };

  let displayedData = filterIds && filterIds.length > 0 ? data.filter(item => filterIds.includes(item.id)) : data;

  // Compute unique statuses dynamically from the items
  const baseData = filterIds && filterIds.length > 0 ? data.filter(item => filterIds.includes(item.id)) : data;
  const uniqueStatuses = Array.from(new Set(baseData.map(item => item.status).filter((status): status is string => !!status)));
  const statusesList = ["All", ...uniqueStatuses];

  useEffect(() => {
    if (selectedStatus && selectedStatus !== 'All') {
      const baseData = filterIds && filterIds.length > 0 ? data.filter(item => filterIds.includes(item.id)) : data;
      const uniqueStatusesSet = new Set(baseData.map(item => item.status).filter(Boolean));
      if (!uniqueStatusesSet.has(selectedStatus)) {
        setSelectedStatus(null);
      }
    }
  }, [data, filterIds, selectedStatus]);

  if (selectedStatus && selectedStatus !== 'All') {
    displayedData = displayedData.filter(item => item.status === selectedStatus);
  }

  return (
    <div className="border border-slate-200 bg-white relative rounded-md overflow-hidden shadow-sm">
      <TileHeader
        title="Tracking Items"
        count={displayedData.length}
        hasStatus
        hasFlag
        flagColor={flagColor}
        selectedStatus={selectedStatus}
        onStatusSelect={setSelectedStatus}
        statuses={statusesList}
      />
      <div className="overflow-x-auto min-h-[200px] flex flex-col justify-between p-1">
        {loading ? <div className="p-4 text-center text-slate-400">Loading...</div> : (
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="p-2 w-8"></th>
                <th className="p-2 border-l border-slate-200">Tracking Item Name</th>
                <th className="p-2 border-l border-slate-200">Status</th>
                <th className="p-2 border-l border-slate-200">Prior To</th>
                <th className="p-2 border-l border-slate-200">Due Date</th>
                <th className="p-2 border-l border-slate-200">Has Exception?</th>
              </tr>
            </thead>
            <tbody>
              {displayedData.map((row, i) => (
                <tr key={row.id ?? `tracking-${i}`} className={`border-b border-slate-100 hover:bg-blue-50/50 ${selectedIds.has(row.id) ? 'bg-blue-50/30 outline outline-1 outline-blue-300' : ''}`}>
                  <td className="p-2"><input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelectRow(row.id)} /></td>
                  <td className="p-2 border-l border-slate-100">{row.name}</td>
                  <td className="p-2 border-l border-slate-100">{row.status}</td>
                  <td className="p-2 border-l border-slate-100">{row.priorTo}</td>
                  <td className="p-2 border-l border-slate-100">{row.dueDate}</td>
                  <td className="p-2 border-l border-slate-100">{row.hasException}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="p-3 flex gap-2 border-t border-slate-100 mt-2">
          <button
            className={`${isCompleting ? 'bg-slate-300 cursor-not-allowed' : 'bg-black hover:bg-gray-800 cursor-pointer'} text-white text-xs px-4 py-1.5 rounded-full transition-colors`}
            disabled={isCompleting}
          >
            Insert Tracking Item +
          </button>
          <button
            className={`${isCompleteButtonEnabled && !isCompleting ? 'bg-black hover:bg-gray-800 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'} text-white text-xs px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5`}
            disabled={!isCompleteButtonEnabled || isCompleting}
            onClick={handleCompleteClick}
          >
            {isCompleting ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Completing...</span>
              </>
            ) : (
              <span>Complete ✓</span>
            )}
          </button>
          <button
            className={`${isUpdateButtonEnabled && !isCompleting ? 'bg-black hover:bg-gray-800 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'} text-white text-xs px-4 py-1.5 rounded-full transition-colors`}
            disabled={!isUpdateButtonEnabled || isCompleting}
            onClick={handleUpdateClick}
          >
            Update ✎
          </button>
        </div>
      </div>

      {isUpdatePopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
          <div className="bg-white border border-slate-300 shadow-2xl rounded-md w-full max-w-md flex flex-col pointer-events-auto">
            <div className="bg-[#194b8c] text-white px-4 py-2 text-sm font-medium rounded-t-md">
              Update Tracking Item
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Loan Num <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm bg-slate-50 text-slate-500 cursor-not-allowed" value={updateFormData.loanNum} readOnly />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Ti Name <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" value={updateFormData.tiName} onChange={e => setUpdateFormData({ ...updateFormData, tiName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Ti Status <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" value={updateFormData.tiStatus} onChange={e => setUpdateFormData({ ...updateFormData, tiStatus: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Due Date <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" value={updateFormData.dueDate} onChange={e => setUpdateFormData({ ...updateFormData, dueDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Has Excp <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" value={updateFormData.hasExcp} onChange={e => setUpdateFormData({ ...updateFormData, hasExcp: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Prior To <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" value={updateFormData.priorTo} onChange={e => setUpdateFormData({ ...updateFormData, priorTo: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-slate-200 flex justify-end gap-2 bg-slate-50 rounded-b-md">
              <button
                className="px-4 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
                onClick={() => setIsUpdatePopupOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1.5 text-xs font-medium text-white bg-black rounded hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                onClick={handleUpdateSubmit}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 2. Application Events Section ---
export const ApplicationEventsSection = ({ client, loanNumber, filterIds }: { client?: any; loanNumber: string; filterIds?: string[] | null }) => {
  const [data, setData] = useState<ApplicationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [flagColor, setFlagColor] = useState<'red' | 'green'>('red');

  useEffect(() => {
    setLoading(true);
    if (client) {
      getAppEventsByLoanNumber(client, loanNumber).then(res => { setData(res); setLoading(false); });
      getAppEventsIntentFlag(client, loanNumber).then(res => setFlagColor(res === 'DANGER' ? 'red' : 'green'));
    } else {
      getAppEventsByLoanNumber(loanNumber).then(res => { setData(res); setLoading(false); });
      getAppEventsIntentFlag(loanNumber).then(res => setFlagColor(res === 'DANGER' ? 'red' : 'green'));
    }
  }, [client, loanNumber]);

  const displayedData = filterIds && filterIds.length > 0 ? data.filter(item => item.id && filterIds.includes(item.id)) : data;

  return (
    <div className="border border-slate-200 bg-white rounded-md overflow-hidden shadow-sm">
      <TileHeader title="Application Events" count={displayedData.length} hasFlag flagColor={flagColor} />
      <div className="overflow-x-auto min-h-[200px]">
        {loading ? <div className="p-4 text-center text-slate-400">Loading...</div> : (
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="p-2">Event Name</th>
                <th className="p-2 border-l border-slate-200">Event Type</th>
                <th className="p-2 border-l border-slate-200">Event Status</th>
                <th className="p-2 border-l border-slate-200">Event Date/Time</th>
                <th className="p-2 border-l border-slate-200">Event Reason</th>
              </tr>
            </thead>
            <tbody>
              {displayedData.map((row, i) => (
                <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50`}>
                  <td className="p-2">{row.eventName}</td>
                  <td className="p-2 border-l border-slate-100">{row.eventType}</td>
                  <td className="p-2 border-l border-slate-100">{row.eventStatus}</td>
                  <td className="p-2 border-l border-slate-100">{row.eventDateTime}</td>
                  <td className="p-2 border-l border-slate-100">{row.eventReason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};



// --- 3. Wire Bank Contacts Section ---
export const WireBankContactsSection = ({ client, loanNumber, filterIds }: { client?: any; loanNumber: string; filterIds?: string[] | null }) => {
  const [data, setData] = useState<WireBankContactData[]>([]);
  const [loading, setLoading] = useState(true);
  const [flagColor, setFlagColor] = useState<'red' | 'green'>('red');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<WireBankContactData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reloadData = React.useCallback(() => {
    setLoading(true);
    if (client) {
      getWireBankContactsByLoanNumber(client, loanNumber).then(res => { setData(res); setLoading(false); });
      getWireBankContactsIntentFlag(client, loanNumber).then(res => setFlagColor(res === 'DANGER' ? 'red' : 'green'));
    } else {
      getWireBankContactsByLoanNumber(loanNumber).then(res => { setData(res); setLoading(false); });
      getWireBankContactsIntentFlag(loanNumber).then(res => setFlagColor(res === 'DANGER' ? 'red' : 'green'));
    }
  }, [client, loanNumber]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  const handleEditClick = () => {
    setEditData([...data]); // Clone data for editing
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditData([]);
  };

  const handleFieldChange = (index: number, field: keyof WireBankContactData, value: string) => {
    const newData = [...editData];
    newData[index] = { ...newData[index], [field]: value };
    setEditData(newData);
  };

  const handleSubmitClick = async () => {
    setIsSubmitting(true);

    // Process updates for each row
    for (let i = 0; i < editData.length; i++) {
      const updatedRow = editData[i];

      // Compare rows to only update if changed? We can just send all if needed.
      // But we MUST have an ID to update. Let's assume we pass the ID if available, or just update based on the object reference.
      const wireObjId = updatedRow.id;

      if (wireObjId && client) {
        await updateWireBank(client, wireObjId, updatedRow);
      }
    }

    // In mock mode or after SDK update, let's just reload.
    if (!client) {
      // For mock, just update local state visually
      setData(editData);
    } else {
      reloadData();
    }

    setIsEditing(false);
    setIsSubmitting(false);
  };

  const displayedData = filterIds && filterIds.length > 0 ? data.filter(item => item.id && filterIds.includes(item.id)) : data;

  return (
    <div className="border border-slate-200 bg-white rounded-md overflow-hidden shadow-sm">
      <TileHeader title="Wire Bank Contacts" count={displayedData.length} hasFlag flagColor={flagColor} />
      <div className="overflow-x-auto p-1">
        <table className="w-full text-xs text-left text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="p-2">Address Type</th>
              <th className="p-2 border-l border-slate-200">Name</th>
              <th className="p-2 border-l border-slate-200">City</th>
              <th className="p-2 border-l border-slate-200">State</th>
              <th className="p-2 border-l border-slate-200">Zip + 4</th>
              <th className="p-2 border-l border-slate-200">Short Name</th>
              <th className="p-2 border-l border-slate-200">ABA #</th>
              <th className="p-2 border-l border-slate-200">Account #</th>
              <th className="p-2 border-l border-slate-200">Account Name</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={9} className="p-4 text-center text-slate-400">Loading...</td></tr> : (
              (isEditing ? editData : displayedData).map((row, i) => (
                <tr key={row.id ?? i} className={`border-b border-slate-100 hover:bg-blue-50/50`}>
                  <td className="p-2">
                    {isEditing ? <input className="w-full border px-1 py-0.5 rounded" value={row.addressType} onChange={e => handleFieldChange(i, 'addressType', e.target.value)} /> : row.addressType}
                  </td>
                  <td className="p-2 border-l border-slate-100">
                    {isEditing ? <input className="w-full border px-1 py-0.5 rounded" value={row.name} onChange={e => handleFieldChange(i, 'name', e.target.value)} /> : row.name}
                  </td>
                  <td className="p-2 border-l border-slate-100">
                    {isEditing ? <input className="w-full border px-1 py-0.5 rounded" value={row.city} onChange={e => handleFieldChange(i, 'city', e.target.value)} /> : row.city}
                  </td>
                  <td className="p-2 border-l border-slate-100">
                    {isEditing ? <input className="w-full border px-1 py-0.5 rounded" value={row.state} onChange={e => handleFieldChange(i, 'state', e.target.value)} /> : row.state}
                  </td>
                  <td className="p-2 border-l border-slate-100">
                    {isEditing ? <input className="w-full border px-1 py-0.5 rounded" value={row.zip} onChange={e => handleFieldChange(i, 'zip', e.target.value)} /> : row.zip}
                  </td>
                  <td className="p-2 border-l border-slate-100">
                    {isEditing ? <input className="w-full border px-1 py-0.5 rounded" value={row.shortName} onChange={e => handleFieldChange(i, 'shortName', e.target.value)} /> : row.shortName}
                  </td>
                  <td className="p-2 border-l border-slate-100">
                    {isEditing ? <input className="w-full border px-1 py-0.5 rounded" value={row.aba} onChange={e => handleFieldChange(i, 'aba', e.target.value)} /> : row.aba}
                  </td>
                  <td className="p-2 border-l border-slate-100">
                    {isEditing ? <input className="w-full border px-1 py-0.5 rounded" value={row.account} onChange={e => handleFieldChange(i, 'account', e.target.value)} /> : row.account}
                  </td>
                  <td className="p-2 border-l border-slate-100">
                    {isEditing ? <input className="w-full border px-1 py-0.5 rounded" value={row.accountName} onChange={e => handleFieldChange(i, 'accountName', e.target.value)} /> : row.accountName}
                  </td>
                </tr>
              ))
            )}
            {(!loading && displayedData.length === 0) && <tr><td colSpan={9} className="p-4 text-center text-slate-400">No records found.</td></tr>}
          </tbody>
        </table>
        <div className="flex justify-end p-2 mt-4 gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelClick}
                disabled={isSubmitting}
                className="border border-slate-300 text-slate-600 text-xs px-4 py-1.5 rounded hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitClick}
                disabled={isSubmitting}
                className="bg-black text-white text-xs px-4 py-1.5 rounded hover:bg-gray-800 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </>
          ) : (
            <button
              onClick={handleEditClick}
              disabled={loading || data.length === 0}
              className="border border-slate-300 text-slate-600 text-xs px-4 py-1.5 rounded flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50"
            >
              ✎ Edit table
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 4. Compliance Ease Section ---
export const ComplianceEaseSection = ({ client, loanNumber, filterIds }: { client?: any; loanNumber: string; filterIds?: string[] | null }) => {
  const [data, setData] = useState<ComplianceEaseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (client) {
      getComplianceEaseByLoanNumber(client, loanNumber).then(res => { setData(res); setLoading(false); });
    } else {
      getComplianceEaseByLoanNumber(loanNumber).then(res => { setData(res); setLoading(false); });
    }
  }, [client, loanNumber]);

  const displayedData = filterIds && filterIds.length > 0 ? data.filter(item => item.id && filterIds.includes(item.id)) : data;

  return (
    <div className="border border-slate-200 bg-white rounded-md overflow-hidden shadow-sm mt-6">
      <TileHeader title="Compliance Ease" count={displayedData.length} />
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="p-2">Req Num</th>
              <th className="p-2 border-l border-slate-200">Date</th>
              <th className="p-2 border-l border-slate-200">Userid</th>
              <th className="p-2 border-l border-slate-200">Req Score</th>
              <th className="p-2 border-l border-slate-200">Trid</th>
              <th className="p-2 border-l border-slate-200">Req Type</th>
              <th className="p-2 border-l border-slate-200">Status</th>
              <th className="p-2 border-l border-slate-200">Method</th>
              <th className="p-2 border-l border-slate-200">Is Hoepa</th>
              <th className="p-2 border-l border-slate-200">Is Hpml</th>
              <th className="p-2 border-l border-slate-200">Licence Audit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={11} className="p-4 text-center text-slate-400">Loading...</td></tr> : (
              displayedData.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-2">{row.reqNum}</td>
                  <td className="p-2 border-l border-slate-100">{row.date}</td>
                  <td className="p-2 border-l border-slate-100">{row.userId}</td>
                  <td className="p-2 border-l border-slate-100">{row.reqScore}</td>
                  <td className="p-2 border-l border-slate-100">{row.trid}</td>
                  <td className="p-2 border-l border-slate-100">{row.reqType}</td>
                  <td className="p-2 border-l border-slate-100">{row.status}</td>
                  <td className="p-2 border-l border-slate-100">{row.method}</td>
                  <td className="p-2 border-l border-slate-100">{row.isHoepa}</td>
                  <td className="p-2 border-l border-slate-100">{row.isHpml}</td>
                  <td className="p-2 border-l border-slate-100">{row.licenceAudit}</td>
                </tr>
              ))
            )}
            {(!loading && displayedData.length === 0) && <tr><td colSpan={11} className="p-4 text-center text-slate-400">No records found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Helper for Key/Value Grids ---
const KeyValueGroup = ({ label, value }: { label: string, value: string | undefined }) => (
  <div className="mb-4">
    <div className="text-[11px] text-slate-500 mb-0.5">{label}</div>
    <div className="text-[13px] text-slate-800">{value || '-'}</div>
  </div>
);

// --- 5. Cash To Close Section ---
export const CashToCloseSection = ({ client, loanNumber }: { client?: any; loanNumber: string }) => {
  const [data, setData] = useState<CashToCloseData | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (client) {
      getCashToCloseByLoanNumber(client, loanNumber).then(res => { setData(res[0]); setLoading(false); });
    } else {
      getCashToCloseByLoanNumber(loanNumber).then(res => { setData(res[0]); setLoading(false); });
    }
  }, [client, loanNumber]);

  return (
    <div className="border border-slate-200 bg-white rounded-md overflow-hidden shadow-sm">
      <TileHeader title="Cash to Close" />
      <div className="p-4 grid grid-cols-2 gap-x-8">
        {loading ? <div className="p-4 text-center text-slate-400">Loading...</div> : (
          <>
            <div>
              <KeyValueGroup label="Max Base Loan Amount" value={data?.maxBaseLoanAmount} />
              <KeyValueGroup label="Actual Base Amount" value={data?.actualBaseAmount} />
              <KeyValueGroup label="Proposed Payment" value={data?.proposedPayment} />
              <KeyValueGroup label="Liquid Assets Available" value={data?.liquidAssetsAvailable} />
            </div>
            <div>
              <KeyValueGroup label="Min Base Loan Amount" value={data?.minBaseLoanAmount} />
              <KeyValueGroup label="Escrow Shortage" value={data?.escrowShortage} />
              <KeyValueGroup label="Cash to Close" value={data?.cashToClose} />
              <KeyValueGroup label="Cash To Borrower - UW Approved Cash to Close" value={data?.cashToBorrower} />
            </div>
          </>
        )}
      </div>
      <div className="bg-slate-50 min-h-[40px] mt-2 border-t border-slate-100"></div>
    </div>
  );
};

// --- 6. Notary & Fraud Guard Section ---
export const NotaryAndFraudGuardSection = ({ client, loanNumber }: { client?: any; loanNumber: string }) => {
  const [data, setData] = useState<FraudGuardData | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (client) {
      getFraudguardByLoanNumber(client, loanNumber).then(res => { setData(res[0]); setLoading(false); });
    } else {
      getFraudguardByLoanNumber(loanNumber).then(res => { setData(res[0]); setLoading(false); });
    }
  }, [client, loanNumber]);

  return (
    <div className="border border-slate-200 bg-white rounded-md overflow-hidden shadow-sm flex flex-col justify-between">
      <div>
        <TileHeader title="Notary & Fraud Guard" />
        <div className="p-4 grid grid-cols-2 gap-x-8">
          {loading ? <div className="p-4 text-center text-slate-400">Loading...</div> : (
            <>
              <div>
                <KeyValueGroup label="Fraud Guard Score" value={data?.fraudGuardScore} />
                <KeyValueGroup label="Fraud Guard Service" value={data?.fraudGuardService} />
                <KeyValueGroup label="Last Run Date" value={data?.lastRunDate} />
                <KeyValueGroup label="Ti Name" value={data?.tiName} />
                <KeyValueGroup label="Request Type" value={data?.requestType} />
              </div>
              <div>
                <KeyValueGroup label="Notary Name" value={data?.notaryName} />
                <KeyValueGroup label="Notary Phone Number" value={data?.notaryPhoneNumber} />
                <div className="mt-14">
                  <KeyValueGroup label="Ti Status" value={data?.tiStatus} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="p-3 flex gap-2 border-t border-slate-100">
        <button className="bg-black text-white text-xs px-4 py-2 rounded-full hover:bg-gray-800">Run Fraud Guard Service ▸</button>
        <button className="bg-black text-white text-xs px-4 py-2 rounded-full hover:bg-gray-800">Get Fraud Guard Data ⚙</button>
        <button className="bg-black text-white text-xs px-4 py-2 rounded-full hover:bg-gray-800">Update FG TI 💾</button>
      </div>
    </div>
  );
};

// --- 7. Loan Documents Section ---
export const LoanDocumentsSection = ({ client, loanNumber }: { client?: any; loanNumber: string }) => {
  const [data, setData] = useState<LoanDocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    documentName: '',
    description: '',
    uploadedDateTime: '',
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Selection State
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    documentName: '',
    description: '',
    uploadedDateTime: '',
    fileName: '',
  });
  const [editFile, setEditFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const reloadData = React.useCallback((preserveId?: string | null) => {
    setLoading(true);
    if (client) {
      getLoanDocumentsByLoanNumber(client, loanNumber).then(res => {
        setData(res);
        setLoading(false);
        if (preserveId && res.some(doc => doc.id === preserveId)) {
          setSelectedDocId(preserveId);
        } else if (res && res.length > 0) {
          setSelectedDocId(res[0].id);
        } else {
          setSelectedDocId(null);
        }
      });
    } else {
      getLoanDocumentsByLoanNumber(loanNumber).then(res => {
        setData(res);
        setLoading(false);
        if (preserveId && res.some(doc => doc.id === preserveId)) {
          setSelectedDocId(preserveId);
        } else if (res && res.length > 0) {
          setSelectedDocId(res[0].id);
        } else {
          setSelectedDocId(null);
        }
      });
    }
  }, [client, loanNumber]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  const openUploadModal = () => {
    setUploadData({
      documentName: '',
      description: '',
      uploadedDateTime: new Date().toLocaleString(),
    });
    setUploadFile(null);
    setIsUploadModalOpen(true);
  };

  const handleUploadSubmit = async () => {
    if (!uploadData.documentName || !uploadFile || !uploadData.description) {
      alert("All fields are mandatory.");
      return;
    }

    setIsUploading(true);

    // Convert to attachment format if needed by OSDK, or pass raw file depending on setup.
    // For now we pass the file directly to uploadLoanDocument
    const success = await uploadLoanDocument(client, {
      loanNumber,
      documentName: uploadData.documentName,
      description: uploadData.description,
      loanDocuments: uploadFile
    });

    if (success) {
      setIsUploadModalOpen(false);
      reloadData();
    } else {
      alert("Failed to create loan document.");
    }
    setIsUploading(false);
  };

  const openEditModal = () => {
    const selectedDoc = data.find(doc => doc.id === selectedDocId);
    if (!selectedDoc) return;

    setEditData({
      documentName: selectedDoc.documentName,
      description: selectedDoc.description,
      uploadedDateTime: new Date(selectedDoc.uploadedDateTime).toLocaleString(),
      fileName: selectedDoc.fileName || '',
    });
    setEditFile(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedDocId) return;
    const selectedDoc = data.find(doc => doc.id === selectedDocId);
    if (!selectedDoc) return;

    if (!editData.documentName || !editData.description) {
      alert("Document Name and Description are mandatory.");
      return;
    }

    setIsEditing(true);

    const fileToUpload = editFile || selectedDoc.attachmentObj;

    const success = await modifyLoanDocument(client, selectedDocId, {
      loanNumber,
      documentName: editData.documentName,
      description: editData.description,
      loanDocuments: fileToUpload
    });

    if (success) {
      setIsEditModalOpen(false);
      reloadData(selectedDocId);
    } else {
      alert("Failed to update loan document.");
    }
    setIsEditing(false);
  };

  const handleRemoveDocument = async () => {
    if (!selectedDocId) return;
    const selectedDoc = data.find(doc => doc.id === selectedDocId);
    if (!selectedDoc) return;

    const confirmDelete = window.confirm(`Are you sure you want to remove the document "${selectedDoc.documentName}"?`);
    if (!confirmDelete) return;

    setLoading(true);
    const success = await deleteLoanDocument(client, selectedDocId);
    if (success) {
      reloadData(null); // Passing null forces it to select the first row by default
    } else {
      alert("Failed to remove loan document.");
      setLoading(false);
    }
  };

  const handleDocumentClick = async (e: React.MouseEvent, row: LoanDocumentData) => {
    e.stopPropagation(); // Stop click from bubbling and toggling row selection
    if (row.attachmentObj && typeof row.attachmentObj.fetchContents === 'function') {
      e.preventDefault();
      try {
        const response = await row.attachmentObj.fetchContents();
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          // Optionally revoke after some time
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        } else {
          console.error("Failed to fetch attachment contents", response.statusText);
          alert("Failed to open document");
        }
      } catch (err) {
        console.error("Error reading document", err);
        alert("Failed to open document");
      }
    } else if (row.fileUrl === '#' || row.fileUrl.startsWith('#preview')) {
      e.preventDefault();
      alert(`Document preview not available for mock data: ${row.fileName}`);
    }
  };

  return (
    <div className="border border-slate-200 bg-white rounded-md overflow-hidden shadow-sm">
      <div className="bg-[#194b8c] text-white px-4 py-3 flex justify-between items-center text-sm font-medium">
        <div className="flex items-center gap-3">
          Loan Documents
          <span className="bg-[#2a62a9] px-2 py-0.5 rounded text-xs">{data.length}</span>
        </div>
      </div>
      <div className="overflow-x-auto p-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading documents...</div>
        ) : (
          <table className="w-full text-sm text-left text-slate-600 border border-slate-200">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3 font-semibold border-r border-slate-200">Document Name</th>
                <th className="p-3 font-semibold border-r border-slate-200">Loan Documents</th>
                <th className="p-3 font-semibold border-r border-slate-200">Uploaded DateTime</th>
                <th className="p-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const isSelected = selectedDocId === row.id;
                return (
                  <tr
                    key={row.id || i}
                    onClick={() => setSelectedDocId(isSelected ? null : row.id)}
                    className={`border-b border-slate-100 hover:bg-blue-50/40 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/30 outline outline-1 outline-blue-300' : ''}`}
                  >
                    <td className="p-3 border-r border-slate-100 font-medium text-slate-700">{row.documentName}</td>
                    <td className="p-3 border-r border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                        <a href={row.fileUrl} onClick={(e) => handleDocumentClick(e, row)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
                          {row.fileName}
                        </a>
                      </div>
                    </td>
                    <td className="p-3 border-r border-slate-100">{new Date(row.uploadedDateTime).toLocaleString()}</td>
                    <td className="p-3 text-slate-500">{row.description}</td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">No documents found for this loan.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={openUploadModal} className="bg-black text-white px-4 py-1.5 text-xs font-medium rounded-full shadow-sm hover:bg-gray-800 transition-colors flex items-center gap-2">
            Upload Document
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          </button>
          <button
            onClick={openEditModal}
            disabled={!selectedDocId}
            className={`${selectedDocId ? 'bg-black hover:bg-gray-800 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'} text-white px-4 py-1.5 text-xs font-medium rounded-full shadow-sm transition-colors flex items-center gap-2`}
          >
            Edit Document
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          </button>
          <button
            onClick={handleRemoveDocument}
            disabled={!selectedDocId || loading}
            className={`${selectedDocId && !loading ? 'bg-black hover:bg-gray-800 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'} text-white px-4 py-1.5 text-xs font-medium rounded-full shadow-sm transition-colors flex items-center gap-2`}
          >
            Remove Document
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
          <div className="bg-white border border-slate-300 shadow-2xl rounded-md w-full max-w-md flex flex-col pointer-events-auto">
            <div className="bg-[#194b8c] text-white px-4 py-2 text-sm font-medium rounded-t-md">
              Upload Document
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Document Name <span className="text-red-500">*</span></label>
                <input type="text" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" value={uploadData.documentName} onChange={e => setUploadData({ ...uploadData, documentName: e.target.value })} placeholder="e.g. W-2 Form" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Loan Documents <span className="text-red-500">*</span></label>
                <input type="file" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" onChange={e => setUploadFile(e.target.files?.[0] || null)} />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Description <span className="text-red-500">*</span></label>
                <textarea className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" rows={3} value={uploadData.description} onChange={e => setUploadData({ ...uploadData, description: e.target.value })} placeholder="Document description..." />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Uploaded Date Time</label>
                <input type="text" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm bg-slate-50 text-slate-500 cursor-not-allowed" value={uploadData.uploadedDateTime} readOnly disabled />
              </div>
            </div>
            <div className="p-3 border-t border-slate-200 flex justify-end gap-2 bg-slate-50 rounded-b-md">
              <button
                className="px-4 py-1.5 text-xs font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
                onClick={() => setIsUploadModalOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1.5 text-xs font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                onClick={handleUploadSubmit}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
          <div className="bg-white border border-slate-300 shadow-2xl rounded-md w-full max-w-md flex flex-col pointer-events-auto">
            <div className="bg-[#194b8c] text-white px-4 py-2 text-sm font-medium rounded-t-md">
              Edit Document
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Document Name <span className="text-red-500">*</span></label>
                <input type="text" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" value={editData.documentName} onChange={e => setEditData({ ...editData, documentName: e.target.value })} placeholder="e.g. W-2 Form" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Loan Documents</label>
                {editData.fileName && (
                  <div className="text-xs text-slate-500 mb-1 italic">
                    Current file: {editData.fileName}
                  </div>
                )}
                <input type="file" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" onChange={e => setEditFile(e.target.files?.[0] || null)} />
                <div className="text-[10px] text-slate-400 mt-0.5">Leave blank to keep current document file.</div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Description <span className="text-red-500">*</span></label>
                <textarea className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" rows={3} value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} placeholder="Document description..." />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Uploaded Date Time</label>
                <input type="text" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm bg-slate-50 text-slate-500 cursor-not-allowed" value={editData.uploadedDateTime} readOnly disabled />
              </div>
            </div>
            <div className="p-3 border-t border-slate-200 flex justify-end gap-2 bg-slate-50 rounded-b-md">
              <button
                className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-full hover:bg-slate-50 transition-colors"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isEditing}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1.5 text-xs font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                onClick={handleEditSubmit}
                disabled={isEditing}
              >
                {isEditing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
