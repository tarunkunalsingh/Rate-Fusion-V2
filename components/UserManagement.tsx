
import React, { useState } from 'react';
import { User, SMTPConfig, Tenant } from '../types';
import { Shield, UserPlus, Trash2, Edit2, Mail, Fingerprint, ShieldAlert, Check, X, Globe, Key, RefreshCw, Eye, EyeOff, Loader2, Building2 } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>; // Updated type for functional updates
  smtpConfig: SMTPConfig;
  tenants: Tenant[];
  currentUser: User;
  onTenantChange: (tenantId: string) => void;
  selectedTenantId: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers, smtpConfig, tenants, currentUser, onTenantChange, selectedTenantId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [notificationStatus, setNotificationStatus] = useState<string>('');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    authType: 'BASIC',
    role: 'USER',
    password: ''
  });

  const filteredUsers = currentUser.role === 'DBA_ADMIN' 
    ? (!selectedTenantId || selectedTenantId === 'all' ? users : users.filter(u => u.tenantId === selectedTenantId))
    : users;

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ 
      name: '', 
      email: '', 
      authType: 'BASIC', 
      role: 'USER', 
      password: '',
      tenantId: currentUser.role === 'DBA_ADMIN' ? (selectedTenantId === 'all' || !selectedTenantId ? '' : selectedTenantId) : currentUser.tenantId
    });
    setGeneratedPassword('');
    setNotificationStatus('');
    setIsSubmitting(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ ...user });
    setGeneratedPassword('');
    setNotificationStatus('');
    setIsSubmitting(false);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to revoke access for this user?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const togglePasswordVisibility = (id: string) => {
    const next = new Set(visiblePasswords);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setVisiblePasswords(next);
  };

  const generateStrongPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(pass);
    setFormData(prev => ({ ...prev, password: pass }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    
    setIsSubmitting(true);

    // Simulate sending email if SMTP is enabled
    if (smtpConfig.enabled && !editingUser && formData.password) {
        setNotificationStatus('Sending welcome email via SMTP...');
        
        try {
            const template = smtpConfig.templates.userCreated || 'Welcome {name}. Password: {password}';
            const html = template
                .replace(/{name}/g, formData.name!)
                .replace(/{email}/g, formData.email!)
                .replace(/{password}/g, formData.password)
                .replace(/{url}/g, typeof window !== 'undefined' ? window.location.origin : '');

            const res = await fetch('/api/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: formData.email,
                    subject: 'Welcome to RateFusion',
                    html: html,
                    config: smtpConfig
                })
            });

            if (res.ok) {
                setNotificationStatus('Email sent successfully.');
                // Proceed to create user after short delay
                setTimeout(finalizeUser, 800);
            } else {
                const errData = await res.json().catch(() => ({}));
                console.warn('Email API Error:', errData);
                setNotificationStatus('Email failed. Creating user anyway...');
                // Proceed to create user despite email failure
                setTimeout(finalizeUser, 1500);
            }
        } catch (error) {
            console.error('Email Network Error:', error);
            setNotificationStatus('Network error. Creating user anyway...');
            // Proceed to create user despite network error
            setTimeout(finalizeUser, 1500);
        }
    } else {
        // No email needed
        setTimeout(finalizeUser, 600);
    }
  };

  const finalizeUser = () => {
    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...formData } as User : u));
    } else {
      const newUser: User = {
        id: crypto.randomUUID(),
        name: formData.name!,
        email: formData.email!,
        authType: formData.authType as 'SSO' | 'BASIC',
        role: formData.role as 'ADMIN' | 'USER',
        password: formData.password,
        tenantId: currentUser.tenantId // Inherit tenantId from creator
      };
      // Use functional update to ensure we have the latest state
      setUsers(prev => [newUser, ...prev]);
    }
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <Shield size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">User Access Control</h2>
            <p className="text-slate-500 text-xs">Manage enterprise identity, roles, and authentication methods.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {currentUser.role === 'DBA_ADMIN' && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2">
              <Building2 size={16} className="text-slate-400" />
              <select 
                className="bg-transparent text-xs font-black uppercase tracking-widest outline-none"
                value={selectedTenantId || 'all'}
                onChange={e => onTenantChange(e.target.value)}
              >
                <option value="all">All Domains</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.companyName}</option>
                ))}
              </select>
            </div>
          )}
          <button 
            onClick={handleOpenAdd}
            className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-200"
          >
            <UserPlus size={18} /> Provision User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
              {currentUser.role === 'DBA_ADMIN' && <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Domain</th>}
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Auth Method</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">System Role</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.map(u => {
              const tenant = tenants.find(t => t.id === u.tenantId);
              return (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-sm tracking-tight">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Mail size={10} /> {u.email}</div>
                      </div>
                    </div>
                  </td>
                  {currentUser.role === 'DBA_ADMIN' && (
                    <td className="px-8 py-5">
                      {tenant ? (
                        <div className="flex items-center gap-2">
                          <Building2 size={12} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-600">{tenant.companyName}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Global Admin</span>
                      )}
                    </td>
                  )}
                  <td className="px-8 py-5">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${u.authType === 'SSO' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                      {u.authType === 'SSO' ? <Globe size={10} /> : <Fingerprint size={10} />}
                      {u.authType}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {u.authType === 'BASIC' ? (
                      <div className="flex items-center gap-2">
                         <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                           {visiblePasswords.has(u.id) ? (u.password || 'Not Set') : '••••••••'}
                         </span>
                         <button onClick={() => togglePasswordVisibility(u.id)} className="text-slate-400 hover:text-blue-600">
                            {visiblePasswords.has(u.id) ? <EyeOff size={14}/> : <Eye size={14}/>}
                         </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Managed by IDP</span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${u.role === 'ADMIN' ? 'bg-red-50 text-red-600' : u.role === 'DBA_ADMIN' ? 'bg-slate-900 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                      {u.role === 'ADMIN' ? <ShieldAlert size={10} /> : u.role === 'DBA_ADMIN' ? <Shield size={10} /> : <Check size={10} />}
                      {u.role}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {u.role !== 'DBA_ADMIN' && (
                        <>
                          <button 
                            onClick={() => handleOpenEdit(u)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(u.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                {editingUser ? 'Update Permissions' : 'Provision Access'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                <input 
                  type="email" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@wegochem.com"
                  required
                />
              </div>
              
              {formData.authType === 'BASIC' && (
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3">
                     <div className="flex justify-between items-center">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                         <button type="button" onClick={generateStrongPassword} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"><RefreshCw size={10}/> Generate</button>
                     </div>
                     <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            value={formData.password || ''}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            placeholder="Set password..."
                            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                     </div>
                     {smtpConfig.enabled && !editingUser && (
                         <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-medium">
                             <Mail size={12}/> Will send via configured SMTP
                         </div>
                     )}
                  </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Auth Type</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black outline-none"
                    value={formData.authType}
                    onChange={e => setFormData({ ...formData, authType: e.target.value as any })}
                  >
                    <option value="SSO">SSO (IDP)</option>
                    <option value="BASIC">BASIC AUTH</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black outline-none"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              {currentUser.role === 'DBA_ADMIN' && !editingUser && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign to Domain</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black outline-none"
                    value={formData.tenantId}
                    onChange={e => setFormData({ ...formData, tenantId: e.target.value })}
                    required
                  >
                    <option value="">Select Domain...</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.companyName}</option>
                    ))}
                  </select>
                </div>
              )}

              {notificationStatus && (
                  <div className={`text-center text-xs font-bold animate-pulse ${notificationStatus.includes('failed') || notificationStatus.includes('error') ? 'text-amber-600' : 'text-blue-600'}`}>
                    {notificationStatus}
                  </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all mt-4 flex items-center justify-center gap-2 ${isSubmitting ? 'bg-slate-100 text-slate-400 shadow-none' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'}`}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
                {isSubmitting ? (editingUser ? 'Saving...' : 'Provisioning...') : (editingUser ? 'Save Updates' : 'Confirm Access')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
