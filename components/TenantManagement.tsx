
import React, { useState, useEffect } from 'react';
import { Tenant, User } from '../types';
import { Building2, Plus, Trash2, Shield, UserPlus, Key, Check, X, ShieldAlert, Globe, RefreshCw } from 'lucide-react';

interface TenantManagementProps {
  tenants: Tenant[];
  setTenants: (tenants: Tenant[]) => void;
  users: User[];
  setUsers: (users: User[]) => void;
}

const TenantManagement: React.FC<TenantManagementProps> = ({ tenants, setTenants, users, setUsers }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTenant, setNewTenant] = useState({ companyName: '', adminEmail: '', adminName: '', adminPassword: '' });
  const [generatedAdmin, setGeneratedAdmin] = useState<{ email: string; pass: string } | null>(null);

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleAddTenant = async () => {
    if (!newTenant.companyName || !newTenant.adminEmail || !newTenant.adminName) return;

    const tenantId = crypto.randomUUID();
    const password = newTenant.adminPassword || generatePassword();

    const tenant: Tenant = {
      id: tenantId,
      companyName: newTenant.companyName,
      adminEmail: newTenant.adminEmail,
      createdAt: Date.now(),
      status: 'ACTIVE'
    };

    const adminUser: User = {
      id: crypto.randomUUID(),
      name: newTenant.adminName,
      email: newTenant.adminEmail,
      authType: 'BASIC',
      role: 'ADMIN',
      password: password,
      tenantId: tenantId
    };

    try {
      const res = await fetch('/api/tenants/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant, adminUser })
      });

      if (res.ok) {
        // Refresh local state by re-fetching from server to ensure all seeded data is captured
        const [tenantsRes, usersRes] = await Promise.all([
          fetch('/api/tenants'),
          fetch('/api/users')
        ]);
        
        if (tenantsRes.ok) setTenants(await tenantsRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());

        setGeneratedAdmin({ email: newTenant.adminEmail, pass: password });
        setIsAdding(false);
        setNewTenant({ companyName: '', adminEmail: '', adminName: '', adminPassword: '' });
      }
    } catch (error) {
      console.error("Provisioning failed", error);
      alert("Failed to provision domain. Check console for details.");
    }
  };

  const handleDeleteTenant = async (id: string) => {
    if (!confirm("Are you sure? This will delete the tenant and all its users.")) return;

    const updatedTenants = tenants.filter(t => t.id !== id);
    const updatedUsers = users.filter(u => u.tenantId !== id);

    setTenants(updatedTenants);
    setUsers(updatedUsers);

    await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTenants)
    });

    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUsers)
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <ShieldAlert className="text-red-500" /> Multi-Tenant Control Center
          </h2>
          <p className="text-slate-400 text-sm mt-1">Global domain management for RateFusion Enterprise.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setGeneratedAdmin(null); }}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl hover:bg-black transition-all flex items-center gap-2 text-sm font-bold uppercase tracking-widest shadow-lg shadow-slate-200"
        >
          <Plus size={18} /> Create New Domain
        </button>
      </div>

      {generatedAdmin && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 animate-in zoom-in duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Key size={24} />
            </div>
            <div>
              <h3 className="font-black text-emerald-800 uppercase tracking-tight">Domain Admin Provisioned</h3>
              <p className="text-emerald-600 text-xs font-bold">Please save these credentials. They will not be shown again.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-emerald-100">
              <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Admin Email</span>
              <code className="text-sm font-bold text-slate-800">{generatedAdmin.email}</code>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-100">
              <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Temporary Password</span>
              <code className="text-sm font-bold text-emerald-600">{generatedAdmin.pass}</code>
            </div>
          </div>
          <button 
            onClick={() => setGeneratedAdmin(null)}
            className="mt-4 text-xs font-bold text-emerald-700 hover:underline uppercase tracking-widest"
          >
            Dismiss
          </button>
        </div>
      )}

      {isAdding && (
        <div className="bg-white border border-blue-200 rounded-3xl p-8 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
            <Building2 size={20} className="text-blue-500" /> Provision New Company Domain
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Acme Logistics"
                value={newTenant.companyName}
                onChange={e => setNewTenant({ ...newTenant, companyName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Full Name</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. John Doe"
                value={newTenant.adminName}
                onChange={e => setNewTenant({ ...newTenant, adminName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Email / Username</label>
              <input 
                type="email" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@acme.com"
                value={newTenant.adminEmail}
                onChange={e => setNewTenant({ ...newTenant, adminEmail: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Password (Optional)</label>
                <button 
                  type="button" 
                  onClick={() => setNewTenant({ ...newTenant, adminPassword: generatePassword() })}
                  className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={10}/> Generate
                </button>
              </div>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-emerald-600 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave blank to auto-generate"
                  value={newTenant.adminPassword}
                  onChange={e => setNewTenant({ ...newTenant, adminPassword: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <button 
              onClick={handleAddTenant}
              className="bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-100"
            >
              Provision Domain
            </button>
            <button 
              onClick={() => setIsAdding(false)}
              className="bg-slate-100 text-slate-600 px-8 py-3 rounded-2xl hover:bg-slate-200 transition-all font-bold text-xs uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map(tenant => (
          <div key={tenant.id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleDeleteTenant(tenant.id)}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Building2 size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight truncate">{tenant.companyName}</h3>
            <p className="text-slate-400 text-xs font-bold mt-1 truncate">{tenant.adminEmail}</p>
            
            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{tenant.status}</span>
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                {new Date(tenant.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}

        {tenants.length === 0 && !isAdding && (
          <div className="col-span-full py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
            <Globe size={48} strokeWidth={1} className="mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-xs">No domains provisioned yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantManagement;
