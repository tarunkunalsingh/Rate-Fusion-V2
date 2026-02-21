
import React, { useState } from 'react';
import { ServerProfile } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { Settings, Plus, Trash2, Shield, Globe, User, Key, Wifi, CheckCircle2, XCircle, Loader2, AlertTriangle, Check } from 'lucide-react';

interface ServerProfilesInterfaceProps {
  profiles: ServerProfile[];
  setProfiles: (profiles: ServerProfile[]) => void;
}

const ServerProfilesInterface: React.FC<ServerProfilesInterfaceProps> = ({ profiles, setProfiles }) => {
  const [newProfile, setNewProfile] = useState<Partial<ServerProfile>>({
    name: '', url: '', username: '', password: '', type: 'SOAP'
  });
  
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; msg: string }>>({});
  const [addStatus, setAddStatus] = useState<'idle' | 'adding' | 'success'>('idle');
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const handleAdd = () => {
    if (!newProfile.name || !newProfile.url) return;
    
    setAddStatus('adding');
    
    // Simulate minor processing delay
    setTimeout(() => {
        const profile: ServerProfile = {
          id: crypto.randomUUID(),
          name: newProfile.name!,
          url: newProfile.url!,
          username: newProfile.username!,
          password: newProfile.password || '',
          type: (newProfile.type as 'SOAP' | 'REST') || 'SOAP'
        };
        setProfiles([...profiles, profile]);
        setNewProfile({ name: '', url: '', username: '', password: '', type: 'SOAP' });
        setAddStatus('success');
        
        setTimeout(() => setAddStatus('idle'), 2000);
    }, 600);
  };

  const removeProfile = (id: string) => {
    setConfirmModal({
        isOpen: true,
        title: 'Delete Server Profile',
        message: 'Are you sure you want to delete this server profile? This action cannot be undone.',
        onConfirm: () => setProfiles(profiles.filter(p => p.id !== id))
    });
  };

  const testConnection = async (profile: ServerProfile) => {
    setTestingId(profile.id);
    setTestResults(prev => ({ ...prev, [profile.id]: { success: false, msg: 'Connecting...' } }));

    // Minimal valid OTM XML to check handshake
    const dummyXml = '<otm:Transmission xmlns:otm="http://xmlns.oracle.com/apps/otm/transmission/v6.4"><otm:TransmissionHeader/></otm:Transmission>';

    try {
        const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                targetUrl: profile.url,
                username: profile.username || '',
                password: profile.password || '',
                xmlContent: dummyXml
            })
        });

        const status = response.status;
        let msg = '';
        let isSuccess = false;
        
        if (status === 200) {
             const text = await response.text();
             // Check if response is actual OTM XML or a generic HTML success page
             if (text.includes('TransmissionAck') || text.includes('TransmissionHeader')) {
                 isSuccess = true;
                 // Attempt to find ReferenceTransmissionNo to confirm deep validity
                 const match = text.match(/<(?:\w+:)?ReferenceTransmissionNo>([^<]+)<\//i);
                 if (match) msg = `Connected (Ref: ${match[1]})`;
                 else msg = 'Connected (200 OK)';
             } else {
                 isSuccess = true;
                 msg = 'Connected (Warning: Non-XML)';
             }
        } else if (status === 401 || status === 403) {
             msg = 'Auth Failed (401/403)';
        } else if (status === 404) {
             msg = 'Endpoint Not Found (404)';
        } else if (status >= 500) {
             // Try to parse our proxy's JSON error details
             try {
                 const errorData = await response.json();
                 msg = `Err: ${errorData.details || errorData.error || 'Server Error'}`;
             } catch (e) {
                 msg = `Server Error (${status})`;
             }
        } else {
             msg = `Response: ${status}`;
        }
        
        setTestResults(prev => ({ 
            ...prev, 
            [profile.id]: { success: isSuccess, msg } 
        }));
        
    } catch (error: any) {
        setTestResults(prev => ({ ...prev, [profile.id]: { success: false, msg: `Net Error: ${error.message}` } }));
    } finally {
        setTestingId(null);
        setTimeout(() => {
             setTestResults(prev => {
                 const next = { ...prev };
                 delete next[profile.id];
                 return next;
             });
        }, 10000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
      <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 text-slate-100 opacity-20">
             <Settings size={180}/>
        </div>
        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-4 relative z-10 uppercase tracking-tight">
           <span className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200">
             <Settings size={24} /> 
           </span>
           Connection Management
        </h2>
        <p className="text-slate-500 mt-4 font-medium relative z-10 max-w-2xl">
            Configure target server endpoints for XML transmission via REST API. 
            Test connectivity to ensure credentials and endpoints are valid.
        </p>
      </div>
        
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profile Type</label>
            <div className="flex gap-2">
                <button 
                    onClick={() => setNewProfile({...newProfile, type: 'SOAP'})}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-tight border transition-all ${newProfile.type === 'SOAP' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                >
                    SOAP (XML)
                </button>
                <button 
                    onClick={() => setNewProfile({...newProfile, type: 'REST'})}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-tight border transition-all ${newProfile.type === 'REST' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                >
                    REST (JSON/Status)
                </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Friendly Name</label>
            <input 
              type="text" 
              placeholder="e.g. OTM Production" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              value={newProfile.name}
              onChange={(e) => setNewProfile({...newProfile, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endpoint URL</label>
            <input 
              type="text" 
              placeholder="https://otm-instance.oracle.com/rest/..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              value={newProfile.url}
              onChange={(e) => setNewProfile({...newProfile, url: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
            <input 
              type="text" 
              placeholder="API_USER" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              value={newProfile.username}
              onChange={(e) => setNewProfile({...newProfile, username: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              value={newProfile.password}
              onChange={(e) => setNewProfile({...newProfile, password: e.target.value})}
            />
          </div>
        </div>
        <button 
          onClick={handleAdd}
          disabled={addStatus === 'adding' || !newProfile.name || !newProfile.url}
          className={`w-full mt-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${addStatus === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-black text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {addStatus === 'adding' ? (
              <Loader2 size={16} className="animate-spin" />
          ) : addStatus === 'success' ? (
              <Check size={16} />
          ) : (
              <Plus size={16} />
          )}
          {addStatus === 'adding' ? 'Adding Profile...' : addStatus === 'success' ? 'Profile Created!' : 'Create Server Profile'}
        </button>
      </div>

      <div className="space-y-4">
        {profiles.map(p => {
          const result = testResults[p.id];
          const isTesting = testingId === p.id;
          
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between group shadow-sm hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner">
                <Globe size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-800 text-lg tracking-tight">{p.name}</h3>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${p.type === 'REST' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                        {p.type || 'SOAP'}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-bold">
                  <span className="flex items-center gap-1"><User size={12}/> {p.username}</span>
                  <span className="text-slate-300">|</span>
                  <span className="truncate max-w-[200px] font-mono">{p.url}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
               {result ? (
                   <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase ${result.success ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`} title={result.msg}>
                      {result.success ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                      <span className="max-w-[200px] truncate">{result.msg}</span>
                   </div>
               ) : (
                   <button 
                      onClick={() => testConnection(p)}
                      disabled={isTesting}
                      className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-[10px] uppercase flex items-center gap-2 transition-colors disabled:opacity-50"
                   >
                      {isTesting ? <Loader2 size={12} className="animate-spin"/> : <Wifi size={12} />}
                      {isTesting ? 'Testing...' : 'Test Connection'}
                   </button>
               )}
               
               <button 
                onClick={() => removeProfile(p.id)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
               >
                <Trash2 size={18} />
               </button>
            </div>
          </div>
          );
        })}
        {profiles.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm font-medium">
                No server profiles configured.
            </div>
        )}
      </div>
    </div>
  );
};

export default ServerProfilesInterface;
