
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Globe, Lock, User as UserIcon, Loader2, ArrowRight, Box, Hexagon, Ship, Anchor, Zap, RotateCcw, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { BrandingConfig, User, SMTPConfig } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  branding: BrandingConfig;
  smtpConfig?: SMTPConfig;
}

const Login: React.FC<LoginProps> = ({ onLogin, branding, smtpConfig }) => {
  const [view, setView] = useState<'CHOICE' | 'BASIC' | 'FORGOT'>('CHOICE');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState('');
  const [systemUsers, setSystemUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        let loadedUsers: User[] = await res.json();

        // Auto-Repair: If no users exist or no DBA_ADMIN exists, restore the default superuser
        const hasSuperAdmin = loadedUsers.some(u => u.role === 'DBA_ADMIN' && (u.email === 'DBA.ADMIN' || u.name === 'DBA.ADMIN'));
        
        if (loadedUsers.length === 0 || !hasSuperAdmin) {
          const initialSuperAdmin: User = {
            id: 'dba_admin_1',
            name: 'DBA.ADMIN',
            username: 'DBA.ADMIN',
            email: 'DBA.ADMIN',
            authType: 'BASIC',
            role: 'DBA_ADMIN',
            password: 'Tarun@1984'
          };
          // Filter out any broken admin references and add fresh one
          loadedUsers = [initialSuperAdmin, ...loadedUsers.filter(u => u.email !== 'DBA.ADMIN')];
          
          await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loadedUsers)
          });
        }
        setSystemUsers(loadedUsers);
      } catch (error) {
        console.error("Failed to load users", error);
      }
    };
    fetchUsers();
  }, []);

  const handleSSO = () => {
    setLoading(true);
    setTimeout(() => {
      const ssoUser = systemUsers.find(u => u.authType === 'SSO');
      onLogin(ssoUser || {
        id: 'sso_auto_1',
        name: 'Wego Employee',
        email: 'employee@wegochem.com',
        authType: 'SSO',
        role: 'USER'
      });
    }, 1500);
  };

  const handleBasicAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Normalize input
    const inputUser = username.trim();
    const inputPass = password.trim();

    const foundUser = systemUsers.find(u => 
      u.authType === 'BASIC' && 
      (u.email.toLowerCase() === inputUser.toLowerCase() || 
       (u.username && u.username.toLowerCase() === inputUser.toLowerCase()) ||
       u.name.toLowerCase() === inputUser.toLowerCase())
    );

    // Basic password check
    if (foundUser) {
      // Check stored password
      const isValid = foundUser.password === inputPass;
      
      if (isValid) {
        setLoading(true);
        setTimeout(() => {
          onLogin(foundUser);
        }, 800);
      } else {
        setError('Wrong Password / Username');
      }
    } else {
      setError('Wrong Password / Username');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      
      const user = systemUsers.find(u => u.email.toLowerCase() === forgotEmail.toLowerCase());
      
      try {
          if (user && smtpConfig) {
              const tempPass = "Temp1234!"; // In real world, generate secure token
              const template = smtpConfig.templates.passwordReset || 'Hello {name}, your new password is {password}';
              const html = template
                  .replace(/{name}/g, user.name)
                  .replace(/{password}/g, tempPass);

              await fetch('/api/email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      to: forgotEmail,
                      subject: 'Password Reset Request',
                      html: html,
                      config: smtpConfig
                  })
              });
          }
      } catch (e) {
          console.error("Failed to send reset email", e);
      }

      setTimeout(() => {
          setLoading(false);
          // Always show success to prevent email enumeration
          setResetSent(true);
      }, 1000);
  };

  const IconComponent = {
    Box, Globe, Hexagon, Ship, Anchor, Zap
  }[branding.icon] || Hexagon;

  const THEME_BG_MAP = {
    blue: 'bg-blue-600',
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-600',
    violet: 'bg-violet-600',
    slate: 'bg-slate-900'
  };

  const THEME_TEXT_MAP = {
    blue: 'text-blue-600',
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    violet: 'text-violet-600',
    slate: 'text-slate-900'
  };

  const THEME_BTN_MAP = {
    blue: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
    violet: 'bg-violet-600 hover:bg-violet-700 shadow-violet-200',
    slate: 'bg-slate-900 hover:bg-black shadow-slate-200'
  };

  const backgroundStyle = branding.loginBackgroundUrl 
    ? { backgroundImage: `url(${branding.loginBackgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } 
    : {};

  return (
    <div className="min-h-screen flex font-sans bg-white">
      {/* Left Side - Brand & Messaging */}
      <div 
        className={`hidden lg:flex flex-1 flex-col justify-between p-16 relative overflow-hidden ${!branding.loginBackgroundUrl ? THEME_BG_MAP[branding.themeColor] : 'bg-slate-900'}`}
        style={backgroundStyle}
      >
         {/* Overlay if image is used */}
         {branding.loginBackgroundUrl && (
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>
         )}

         {/* Default Icon Background Fader */}
         {!branding.loginBackgroundUrl && (
            <div className="absolute top-0 right-0 p-20 opacity-10 text-white">
                <IconComponent size={400} />
            </div>
         )}
         
         <div className="relative z-10">
            <div className="flex items-center gap-4 text-white mb-12">
               {branding.logoUrl ? (
                   <img src={branding.logoUrl} alt="Logo" className="h-12 w-auto bg-white/10 backdrop-blur-md rounded-lg p-2" />
               ) : (
                   <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <IconComponent size={24} />
                   </div>
               )}
               <span className="font-black text-xl tracking-tight uppercase">Logistics Cloud</span>
            </div>
            <h1 className="text-5xl font-black text-white leading-tight mb-6 drop-shadow-lg">
              {branding.portalName}
            </h1>
            <p className="text-white/90 text-lg max-w-md font-medium leading-relaxed drop-shadow-md">
              {branding.loginMessage || "Manage rates, automate logic, and synchronize your supply chain data with enterprise-grade precision."}
            </p>
         </div>
         <div className="relative z-10 text-white/50 text-xs font-bold uppercase tracking-widest drop-shadow-sm">
            {branding.footerText || "© 2025 Enterprise Systems"}
         </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md bg-white p-10 rounded-[40px] shadow-xl border border-slate-100 relative">
           <div className="mb-10 text-center">
              {branding.logoUrl ? (
                  <div className="flex justify-center mb-6">
                      <img src={branding.logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
                  </div>
              ) : (
                  <div className={`w-16 h-16 mx-auto ${THEME_BG_MAP[branding.themeColor]} rounded-2xl flex items-center justify-center text-white shadow-lg mb-6`}>
                     <UserIcon size={32} />
                  </div>
              )}
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                  {view === 'FORGOT' ? 'Account Recovery' : 'Welcome Back'}
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                  {view === 'FORGOT' ? 'Enter your email to receive reset instructions.' : 'Please authenticate to access your workspace.'}
              </p>
           </div>

           {loading ? (
             <div className="py-12 flex flex-col items-center">
               <Loader2 className={`animate-spin ${THEME_TEXT_MAP[branding.themeColor]}`} size={48} />
               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-4 animate-pulse">
                   {view === 'FORGOT' ? 'Sending Request...' : 'Authenticating...'}
               </p>
             </div>
           ) : view === 'FORGOT' ? (
                resetSent ? (
                    <div className="text-center py-8 animate-in fade-in zoom-in">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 mb-2">Check Your Email</h3>
                        <p className="text-slate-500 text-sm mb-6">We've sent password reset instructions to <strong>{forgotEmail}</strong>.</p>
                        <button 
                            onClick={() => { setView('BASIC'); setResetSent(false); }} 
                            className="text-blue-600 font-bold text-xs uppercase tracking-wide hover:underline"
                        >
                            Return to Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-5">
                       <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                           <input 
                              autoFocus
                              type="email" 
                              required
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                              placeholder="name@company.com"
                              value={forgotEmail}
                              onChange={e => setForgotEmail(e.target.value)}
                           />
                        </div>
                        <div className="pt-2 flex gap-3">
                           <button type="button" onClick={() => setView('BASIC')} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs uppercase hover:bg-slate-50 flex items-center gap-2"><ArrowLeft size={14}/> Back</button>
                           <button type="submit" className={`flex-1 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all ${THEME_BTN_MAP[branding.themeColor]}`}>Send Link</button>
                        </div>
                    </form>
                )
           ) : view === 'CHOICE' ? (
             <div className="space-y-4">
                <button 
                  onClick={handleSSO}
                  className={`w-full py-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-lg ${THEME_BTN_MAP[branding.themeColor]}`}
                >
                  <Globe size={18} /> Enterprise SSO
                </button>
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <div className="relative flex justify-center"><span className="bg-white px-4 text-xs text-slate-400 font-bold uppercase tracking-wider">Or</span></div>
                </div>
                <button 
                  onClick={() => setView('BASIC')}
                  className="w-full py-4 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-all hover:border-slate-300"
                >
                  <ShieldCheck size={18} /> Basic Authentication
                </button>
             </div>
           ) : (
             <form onSubmit={handleBasicAuth} className="space-y-5">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address / Username</label>
                   <input 
                      autoFocus
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                      placeholder="admin"
                      value={username}
                      onChange={e => { setUsername(e.target.value); setError(''); }}
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                   <input 
                      type="password" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                   />
                   <div className="flex justify-end mt-2">
                       <button type="button" onClick={() => setView('FORGOT')} className="text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors">Forgot Password?</button>
                   </div>
                </div>
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div> {error}
                  </div>
                )}
                <div className="pt-2 flex gap-3">
                   <button type="button" onClick={() => setView('CHOICE')} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs uppercase hover:bg-slate-50">Back</button>
                   <button type="submit" className={`flex-1 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all ${THEME_BTN_MAP[branding.themeColor]}`}>Sign In</button>
                </div>
             </form>
           )}
           
           <div className="mt-8 text-center space-y-4">
              <p className="text-[10px] text-slate-300 font-medium">Secured by {branding.portalName} Identity Services</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
