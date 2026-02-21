
import React, { useState } from 'react';
import { SMTPConfig } from '../types';
import { Mail, Server, Lock, Type, Save, CheckCircle2, AlertTriangle, Code, Archive, Loader2, Check } from 'lucide-react';

interface SMTPSettingsProps {
  config: SMTPConfig;
  setConfig: (config: SMTPConfig) => void;
}

const SMTPSettings: React.FC<SMTPSettingsProps> = ({ config, setConfig }) => {
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const handleChange = (field: keyof SMTPConfig, value: any) => {
    setConfig({ ...config, [field]: value });
    setStatus('idle');
  };

  const handleTemplateChange = (templateType: 'userCreated' | 'passwordReset' | 'projectBackup', value: string) => {
    setConfig({
      ...config,
      templates: {
        ...config.templates,
        [templateType]: value
      }
    });
    setStatus('idle');
  };

  const handleSave = () => {
    setStatus('saving');
    // Simulate API persistence delay
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 text-slate-100 opacity-20">
          <Mail size={180} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-4 uppercase tracking-tight relative z-10">
          <span className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
            <Server size={24} />
          </span>
          SMTP Configuration
        </h2>
        <p className="text-slate-500 mt-4 text-sm font-medium leading-relaxed max-w-2xl relative z-10">
          Configure the outbound mail server for system notifications. Customize HTML templates for user onboarding and password management.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Server Config */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 h-fit">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Server size={16} /> Mail Server Settings
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
             <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Host Address</label>
                <input 
                  type="text" 
                  value={config.host}
                  onChange={(e) => handleChange('host', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="smtp.office365.com"
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Port</label>
                <input 
                  type="number" 
                  value={config.port}
                  onChange={(e) => handleChange('port', parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="587"
                />
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username / API Key</label>
             <input 
               type="text" 
               value={config.user}
               onChange={(e) => handleChange('user', e.target.value)}
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="notifications@wegochem.com"
             />
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
             <input 
               type="password" 
               value={config.pass}
               onChange={(e) => handleChange('pass', e.target.value)}
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="••••••••••••"
             />
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">From Address</label>
             <input 
               type="email" 
               value={config.fromEmail}
               onChange={(e) => handleChange('fromEmail', e.target.value)}
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="noreply@wegochem.com"
             />
          </div>
          
          <div className="pt-4 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${config.enabled ? 'bg-emerald-500' : 'bg-slate-200'}`} onClick={() => handleChange('enabled', !config.enabled)}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Enable Notifications</span>
              </label>
          </div>
        </div>

        {/* Templates */}
        <div className="space-y-6">
           <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Code size={16} /> User Created Template
              </h3>
              <p className="text-[10px] text-slate-400">Supported variables: <code>{'{name}'}</code>, <code>{'{email}'}</code>, <code>{'{password}'}</code>, <code>{'{url}'}</code></p>
              <textarea 
                value={config.templates.userCreated}
                onChange={(e) => handleTemplateChange('userCreated', e.target.value)}
                className="w-full h-32 bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl outline-none resize-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
           </div>

           <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Lock size={16} /> Password Reset Template
              </h3>
              <p className="text-[10px] text-slate-400">Supported variables: <code>{'{name}'}</code>, <code>{'{password}'}</code></p>
              <textarea 
                value={config.templates.passwordReset}
                onChange={(e) => handleTemplateChange('passwordReset', e.target.value)}
                className="w-full h-32 bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl outline-none resize-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
           </div>

           <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Archive size={16} /> Project Backup Template
              </h3>
              <p className="text-[10px] text-slate-400">Supported: <code>{'{projectName}'}</code>, <code>{'{status}'}</code>, <code>{'{recordCount}'}</code>, <code>{'{transactionId}'}</code></p>
              <textarea 
                value={config.templates.projectBackup}
                onChange={(e) => handleTemplateChange('projectBackup', e.target.value)}
                className="w-full h-32 bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl outline-none resize-none focus:ring-2 focus:ring-blue-500"
                spellCheck={false}
              />
           </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={status === 'saving'}
          className={`px-8 py-4 rounded-2xl flex items-center gap-3 transition-all font-black text-xs uppercase tracking-widest shadow-xl ${status === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-900 hover:bg-black text-white shadow-slate-200'}`}
        >
            {status === 'saving' ? (
              <Loader2 size={18} className="animate-spin" />
            ) : status === 'success' ? (
              <Check size={18} />
            ) : (
              <Save size={18} />
            )}
            {status === 'saving' ? 'Saving...' : status === 'success' ? 'Saved Successfully' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default SMTPSettings;
