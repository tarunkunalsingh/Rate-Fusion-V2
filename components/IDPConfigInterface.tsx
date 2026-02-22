
import React, { useState } from 'react';
import { IDPConfig, Tenant, User } from '../types';
import { Globe, ShieldCheck, Key, Link2, Info, Save, ToggleLeft, ToggleRight, HelpCircle, Loader2, Check, Building2 } from 'lucide-react';

interface IDPConfigInterfaceProps {
  config: IDPConfig;
  setConfig: (config: IDPConfig) => void;
  tenants: Tenant[];
  currentUser: User;
  onTenantChange: (tenantId: string) => void;
  selectedTenantId: string;
}

const IDPConfigInterface: React.FC<IDPConfigInterfaceProps> = ({ config, setConfig, tenants, currentUser, onTenantChange, selectedTenantId }) => {
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const handleChange = (field: keyof IDPConfig, value: any) => {
    setConfig({ ...config, [field]: value });
    setStatus('idle');
  };
  
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app';
  const callbackUrl = `${currentOrigin}/auth/callback`;

  const handleSave = () => {
    setStatus('saving');
    // Simulate persistent save
    setTimeout(() => {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 text-blue-50 opacity-10">
          <Globe size={140} />
        </div>
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/20">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">SSO Configuration</h2>
              <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">Enterprise Identity Provider (IDP) Settings</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-4">
            {currentUser.role === 'DBA_ADMIN' && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2">
                <Building2 size={16} className="text-slate-400" />
                <select 
                  className="bg-transparent text-xs font-black uppercase tracking-widest outline-none"
                  value={selectedTenantId}
                  onChange={e => onTenantChange(e.target.value)}
                >
                  <option value="">Select Domain...</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.companyName}</option>
                  ))}
                </select>
              </div>
            )}
            <button 
              onClick={() => handleChange('enabled', !config.enabled)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${config.enabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}
            >
              {config.enabled ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} />}
              {config.enabled ? 'SSO ACTIVE' : 'SSO DISABLED'}
            </button>
          </div>
        </div>
      </div>

      {currentUser.role === 'DBA_ADMIN' && (!selectedTenantId || selectedTenantId === 'all') ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-20 text-center space-y-4">
          <Building2 size={64} className="mx-auto text-slate-200" />
          <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Select a Domain to Configure SSO</h3>
          <p className="text-slate-400 text-sm">Global administrators must select a specific domain to manage its identity provider settings.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-5 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span className="flex items-center gap-2"><Info size={14} /> Provider Authentication</span>
              <span className="text-blue-500 flex items-center gap-1 cursor-help group relative">
                <HelpCircle size={12}/> Guide
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-900 text-white text-[9px] p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50 normal-case font-medium">
                  Use your corporate OIDC metadata endpoint (e.g. /.well-known/openid-configuration).
                </div>
              </span>
            </h3>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity Provider Name</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="e.g. Azure AD, Okta"
                  value={config.providerName}
                  onChange={e => handleChange('providerName', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">Discovery Endpoint <Info size={10} className="text-slate-300"/></label>
              <div className="relative">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="https://[domain]/.well-known/openid-configuration"
                  value={config.discoveryUrl}
                  onChange={e => handleChange('discoveryUrl', e.target.value)}
                />
              </div>
              <p className="text-[9px] text-slate-400 font-bold px-1">Tip: Entra ID endpoints usually include a Tenant ID.</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8 shadow-sm">
            <h3 className="text-blue-900 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <Info size={16} /> Callback URI
            </h3>
            <p className="text-xs text-blue-700 font-medium leading-relaxed mb-4">
              Authorized Redirect URI for your application registration. Ensure this exactly matches your IDP portal configuration.
            </p>
            <div className="bg-white/80 border border-blue-200 rounded-xl p-3 font-mono text-[10px] text-blue-900 break-all select-all cursor-pointer hover:border-blue-400 transition-colors">
              {callbackUrl}
            </div>
            <p className="mt-3 text-[9px] text-blue-600 font-bold leading-relaxed">
               * When hosting on Vercel, this URL automatically updates to your production domain (e.g. https://project.vercel.app/auth/callback).
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-5 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Key size={14} /> Security Credentials
            </h3>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Client Application ID</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="UUID from your IDP registration"
                value={config.clientId}
                onChange={e => handleChange('clientId', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Client Secret Key</label>
              <input 
                type="password" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="••••••••••••••••"
                value={config.clientSecret}
                onChange={e => handleChange('clientSecret', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Required Scopes</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="openid profile email"
                value={config.scopes}
                onChange={e => handleChange('scopes', e.target.value)}
              />
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 flex items-center justify-between shadow-xl shadow-slate-200">
            <div className="text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">System State</p>
              <p className="font-bold text-sm">Parameters Ready</p>
            </div>
            <button 
                onClick={handleSave}
                disabled={status === 'saving'}
                className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg shadow-blue-900/40 ${status === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
            >
              {status === 'saving' ? (
                  <Loader2 size={18} className="animate-spin" />
              ) : status === 'success' ? (
                  <Check size={18} />
              ) : (
                  <Save size={18} />
              )}
              {status === 'saving' ? 'Updating...' : status === 'success' ? 'Updated!' : 'Update IDP'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 flex items-start gap-4">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
          <HelpCircle size={20} />
        </div>
        <div>
          <h4 className="text-xs font-black text-emerald-900 uppercase tracking-tight mb-1">Configuration Hint</h4>
          <p className="text-xs text-emerald-800 font-medium leading-relaxed">
            Most SSO issues arise from mismatched Redirect URIs. If users see a "Reply URL mismatch" error, copy the Callback URI from above and update your {config.providerName || 'Identity Provider'} application settings.
          </p>
        </div>
      </div>
    </>
    )}
  </div>
);
};

export default IDPConfigInterface;
