
import React, { useState } from 'react';
import { TransmissionLogEntry, ServerProfile } from '../types';
import { Terminal, Copy, CheckCircle2, XCircle, Search, AlertCircle, Calendar, Server, FileCode, Check, Eye, X, RefreshCw, Activity } from 'lucide-react';

interface TransmissionLogsProps {
  logs: TransmissionLogEntry[];
  profiles: ServerProfile[];
}

const TransmissionLogs: React.FC<TransmissionLogsProps> = ({ logs, profiles }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewingLog, setViewingLog] = useState<TransmissionLogEntry | null>(null);
  const [viewingJson, setViewingJson] = useState<any | null>(null);
  
  const [otmStatuses, setOtmStatuses] = useState<Record<string, any>>({});
  const [loadingStatuses, setLoadingStatuses] = useState<Record<string, boolean>>({});

  const fetchOtmStatus = async (log: TransmissionLogEntry) => {
    if (!log.transmissionId) return;
    
    const profile = profiles.find(p => p.name === log.serverName);
    if (!profile) return;

    setLoadingStatuses(prev => ({ ...prev, [log.id]: true }));

    try {
        // The user provided a specific URL for testing
        const statusUrl = `https://otmgtm-test-a557679.otmgtm.us-phoenix-1.ocs.oraclecloud.com/logisticsRestApi/resources-int/v2/transmissionStatus/${log.transmissionId}`;
        
        const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                targetUrl: statusUrl,
                username: profile.username,
                password: profile.password || '',
                method: 'GET'
            })
        });

        if (response.ok) {
            const data = await response.json();
            setOtmStatuses(prev => ({ ...prev, [log.id]: data }));
        } else {
            const errText = await response.text();
            setOtmStatuses(prev => ({ ...prev, [log.id]: { error: response.status, details: errText } }));
        }
    } catch (e: any) {
        setOtmStatuses(prev => ({ ...prev, [log.id]: { error: 'Fetch Failed', details: e.message } }));
    } finally {
        setLoadingStatuses(prev => ({ ...prev, [log.id]: false }));
    }
  };

  const filteredLogs = logs.filter(log => 
    log.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.transactionNo?.includes(searchTerm) ||
    log.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.timestamp - a.timestamp);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
               <Terminal size={28} />
            </div>
            <div>
               <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Transmission Logs</h2>
               <p className="text-slate-500 text-sm mt-1">Audit trail of all XML transmissions to external OTM servers.</p>
            </div>
         </div>
         <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Project, File, or Transaction ID..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
         {filteredLogs.length > 0 ? (
           <table className="w-full text-left border-collapse">
             <thead className="bg-slate-50 border-b border-slate-100">
               <tr>
                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time & Status</th>
                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project & File</th>
                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Server</th>
                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Details</th>
                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">OTM Status</th>
                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {filteredLogs.map(log => (
                 <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                   <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                            <Calendar size={12} className="text-slate-400"/>
                            {new Date(log.timestamp).toLocaleString()}
                         </div>
                         <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide w-fit ${log.status.includes('200') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {log.status.includes('200') ? <CheckCircle2 size={10}/> : <XCircle size={10}/>}
                            {log.status}
                         </div>
                      </div>
                   </td>
                   <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-sm">{log.projectName}</div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-1">
                         <FileCode size={10} /> {log.fileName}
                      </div>
                   </td>
                   <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                         <Server size={14} className="text-slate-400" />
                         {log.serverName}
                      </div>
                   </td>
                   <td className="px-6 py-4">
                      <div className="space-y-1">
                         {log.transactionNo ? (
                            <div className="flex items-center gap-2">
                               <code className="bg-slate-100 px-2 py-1 rounded text-[10px] font-mono text-slate-700 border border-slate-200">
                                 {log.transactionNo}
                               </code>
                               <button 
                                 onClick={() => copyToClipboard(log.transactionNo!, log.id)}
                                 className="text-slate-400 hover:text-blue-600 transition-colors"
                                 title="Copy Transaction ID"
                               >
                                 {copiedId === log.id ? <Check size={14} className="text-emerald-500"/> : <Copy size={14} />}
                               </button>
                            </div>
                         ) : (
                            <span className="text-[10px] text-slate-400 italic">No Transaction ID</span>
                         )}
                         <div className="text-[10px] text-slate-500 max-w-xs truncate" title={log.message}>
                            {log.message}
                         </div>
                      </div>
                   </td>
                   <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                         {log.transmissionId ? (
                            <div className="flex items-center gap-2">
                               {loadingStatuses[log.id] ? (
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500 animate-pulse">
                                     <RefreshCw size={10} className="animate-spin" /> Fetching Status...
                                  </div>
                               ) : otmStatuses[log.id] ? (
                                  <button 
                                     onClick={() => setViewingJson(otmStatuses[log.id])}
                                     className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tight flex items-center gap-1 transition-all ${otmStatuses[log.id].error ? 'bg-red-50 text-red-600 border border-red-100' : 
                                        otmStatuses[log.id].progress === 'succeeded' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                        'bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100'}`}
                                  >
                                     <Activity size={10} />
                                     {otmStatuses[log.id].error ? `Error ${otmStatuses[log.id].error}` : (otmStatuses[log.id].progress || otmStatuses[log.id].status || 'View JSON')}
                                  </button>
                               ) : (
                                  <button 
                                     onClick={() => fetchOtmStatus(log)}
                                     className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-500 text-[9px] font-black uppercase tracking-tight transition-all flex items-center gap-1"
                                  >
                                     <RefreshCw size={10} /> Check Status
                                  </button>
                               )}
                            </div>
                         ) : (
                            <span className="text-[9px] text-slate-300 italic">N/A</span>
                         )}
                      </div>
                   </td>
                   <td className="px-6 py-4 text-right">
                      {log.rawResponse && (
                        <button 
                          onClick={() => setViewingLog(log)}
                          className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="View Complete Acknowledgement"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         ) : (
           <div className="p-20 flex flex-col items-center justify-center text-slate-400">
              <Terminal size={48} className="opacity-20 mb-4" />
              <p className="text-sm font-bold">No logs found matching your criteria.</p>
           </div>
         )}
      </div>

      {/* Raw Response Viewer Modal */}
      {viewingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                 <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Transmission Acknowledgement</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">{viewingLog.fileName} • {new Date(viewingLog.timestamp).toLocaleString()}</p>
                 </div>
                 <button onClick={() => setViewingLog(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={24} />
                 </button>
              </div>
              <div className="flex-1 overflow-auto bg-slate-900 p-6">
                 <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap break-all leading-relaxed">
                    {viewingLog.rawResponse || "No raw response captured."}
                 </pre>
              </div>
              <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                 <button 
                   onClick={() => {
                     if (viewingLog.rawResponse) {
                       navigator.clipboard.writeText(viewingLog.rawResponse);
                       alert("Raw XML copied to clipboard.");
                     }
                   }}
                   className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wide hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
                 >
                    <Copy size={16} /> Copy XML
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* JSON Response Viewer Modal */}
      {viewingJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <Activity size={20} className="text-indigo-600" /> OTM REST Response
                 </h3>
                 <button onClick={() => setViewingJson(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={24} />
                 </button>
              </div>
              <div className="flex-1 overflow-auto bg-slate-50 p-6">
                 <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(viewingJson, null, 2)}
                 </pre>
              </div>
              <div className="px-8 py-4 bg-white border-t border-slate-100 flex justify-end shrink-0">
                 <button 
                   onClick={() => setViewingJson(null)}
                   className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wide hover:bg-black shadow-lg transition-all"
                 >
                    Close
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default TransmissionLogs;
