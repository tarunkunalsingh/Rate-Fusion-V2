
import React from 'react';
import { BookOpen, Code2, Layers, Info, CheckCircle2, AlertTriangle, Hash, ShieldCheck, Globe, Key, Link2 } from 'lucide-react';

const HelpSection: React.FC = () => {
  const transformationLogics = [
    {
      title: 'X_LANE',
      description: 'Physical route definition (Source to Destination).',
      formula: 'WEGO.{TYPE}_{POLUNLOCODE}_{PODUNLOCODE}',
      elements: [
        { name: 'X_LANE_GID', formula: 'WEGO.{TYPE || OCEAN}_{POLUNLOCODE}_{PODUNLOCODE}' },
        { name: 'X_LANE_XID', formula: 'The part after WEGO. in GID' },
        { name: 'SOURCE_LOCATION_GID', formula: 'WEGO.{POLUNLOCODE}' },
        { name: 'DEST_LOCATION_GID', formula: 'WEGO.{PODUNLOCODE}' },
        { name: 'DOMAIN_NAME', formula: '"WEGO" (Hardcoded)' }
      ]
    },
    {
      title: 'RATE_OFFERING',
      description: 'Contractual header for the Carrier and Service Type.',
      formula: 'WEGO.{SCAC}_{TYPE}',
      elements: [
        { name: 'RATE_OFFERING_GID', formula: 'WEGO.{SCAC}_{TYPE || OCEAN}' },
        { name: 'RATE_OFFERING_XID', formula: 'The part after WEGO. in GID' },
        { name: 'RATE_SERVICE_TYPE_GID', formula: 'WEGO.{TYPE || OCEAN}' },
        { name: 'CARRIER_GID', formula: 'WEGO.{SCAC}' },
        { name: 'EFFECTIVE_DATE', formula: '{Effective} formatted as YYYYMMDDHH24MISS' },
        { name: 'EXPIRATION_DATE', formula: '{Expiration} formatted as YYYYMMDDHH24MISS' },
        { name: 'IS_ACTIVE', formula: '"Y" (Hardcoded)' },
        { name: 'DOMAIN_NAME', formula: '"WEGO" (Hardcoded)' }
      ]
    },
    {
      title: 'RATE_SERVICE',
      description: 'Behavioral definition of the service speed.',
      formula: 'WEGO.RS_{TYPE}',
      elements: [
        { name: 'RATE_SERVICE_GID', formula: 'WEGO.RS_{TYPE || OCEAN}' },
        { name: 'RATE_SERVICE_XID', formula: 'RS_{TYPE || OCEAN}' },
        { name: 'RATE_SERVICE_TYPE_GID', formula: 'WEGO.{TYPE || OCEAN}' },
        { name: 'DOMAIN_NAME', formula: '"WEGO" (Hardcoded)' }
      ]
    },
    {
      title: 'SERVICE_TIME',
      description: 'Linkage of route to transit duration.',
      formula: 'X_LANE_GID + RS_GID',
      elements: [
        { name: 'X_LANE_GID', formula: 'Matches X_LANE.X_LANE_GID' },
        { name: 'RATE_SERVICE_GID', formula: 'Matches RATE_SERVICE.RATE_SERVICE_GID' },
        { name: 'SERVICE_DAYS', formula: '{TransitTime} (Default: 14 if not provided)' },
        { name: 'DOMAIN_NAME', formula: '"WEGO" (Hardcoded)' }
      ]
    },
    {
      title: 'RATE_GEO',
      description: 'The primary rate record connecting contract to route.',
      formula: 'WEGO.{SCAC}_{POL}_{POD}_{YYYYMMDD}',
      elements: [
        { name: 'RATE_GEO_GID', formula: 'WEGO.{SCAC}_{POL}_{POD}_{EFF_DATE_YYYYMMDD}' },
        { name: 'RATE_GEO_XID', formula: 'The part after WEGO. in GID' },
        { name: 'RATE_OFFERING_GID', formula: 'Matches RATE_OFFERING.RATE_OFFERING_GID' },
        { name: 'X_LANE_GID', formula: 'Matches X_LANE.X_LANE_GID' },
        { name: 'EFFECTIVE_DATE', formula: '{Effective} formatted as YYYYMMDDHH24MISS' },
        { name: 'EXPIRATION_DATE', formula: '{Expiration} formatted as YYYYMMDDHH24MISS' },
        { name: 'IS_ACTIVE', formula: '"Y" (Hardcoded)' },
        { name: 'DOMAIN_NAME', formula: '"WEGO" (Hardcoded)' }
      ]
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-blue-50 opacity-10">
          <BookOpen size={120} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
          <Layers className="text-blue-600" /> System Knowledge Base
        </h2>
        <p className="text-slate-500 mt-4 max-w-2xl leading-relaxed">
          The Rate Maintenance portal centralizes logistics intelligence. Use this guide to configure data transformation and enterprise identity.
        </p>
      </div>

      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
            <Globe size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">SSO Quick Start Guide</h3>
            <p className="text-sm text-slate-500">Configuring major Identity Providers for Enterprise Login.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Azure AD Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="font-black text-slate-800 uppercase tracking-tight">Microsoft Entra ID (Azure AD)</h4>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                <p className="text-xs text-slate-600 leading-relaxed">Navigate to <b>App Registrations</b> in Azure Portal and create a new registration.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                <p className="text-xs text-slate-600 leading-relaxed">Add a Web platform and set the <b>Redirect URI</b> to your portal's callback address.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                <p className="text-xs text-slate-600 leading-relaxed"><b>Discovery URL:</b> <code>https://login.microsoftonline.com/[tenant-id]/v2.0/.well-known/openid-configuration</code></p>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1 flex items-center gap-1"><Info size={10}/> Recommended Scopes</p>
                <code className="text-[11px] text-blue-900 font-mono">openid profile email offline_access</code>
              </div>
            </div>
          </div>

          {/* Okta Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Globe size={20} />
                </div>
                <h4 className="font-black text-slate-800 uppercase tracking-tight">Okta Identity Cloud</h4>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                <p className="text-xs text-slate-600 leading-relaxed">In Okta Admin, go to <b>Applications</b> &gt; <b>Create App Integration</b> &gt; <b>OIDC</b>.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                <p className="text-xs text-slate-600 leading-relaxed">Enable <b>Authorization Code</b> and <b>Refresh Token</b> grant types.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                <p className="text-xs text-slate-600 leading-relaxed"><b>Discovery URL:</b> <code>https://[your-subdomain].okta.com/.well-known/openid-configuration</code></p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-1 flex items-center gap-1"><Info size={10}/> Security Tip</p>
                <p className="text-[10px] text-indigo-800 font-medium">Always use <b>Client Secret</b> encryption for Basic Auth handshakes in non-SSO flows.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-slate-200"></div>

      <section className="space-y-16">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
            <Code2 size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">XML Transformation Registry</h3>
            <p className="text-sm text-slate-500">Mapping logic from raw CSV columns to OTM GLog schemas.</p>
          </div>
        </div>

        {transformationLogics.map((logic, idx) => (
          <div key={idx} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-800 flex items-center justify-center font-black text-lg border border-slate-200">
                {idx + 1}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">{logic.title}</h3>
                <p className="text-sm text-slate-500">{logic.description}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">XML Tag Name</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic / Source Formula</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logic.elements.map((el, eidx) => {
                    const isHardcoded = el.formula.includes('"');
                    return (
                      <tr key={eidx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Hash size={12} className="text-slate-300" />
                            <code className="text-[11px] font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{el.name}</code>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-xs font-mono p-2 rounded-lg ${isHardcoded ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                            {el.formula}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      <div className="bg-amber-50 border border-amber-200 p-8 rounded-3xl flex items-start gap-6">
        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h3 className="text-lg font-black text-amber-900 uppercase tracking-tight">Data Integrity Warning</h3>
          <p className="text-sm text-amber-800 mt-1 leading-relaxed">
            Changing IDP discovery endpoints while users are active may cause temporary session lockouts. 
            <strong> Always perform security updates during off-peak windows.</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpSection;
