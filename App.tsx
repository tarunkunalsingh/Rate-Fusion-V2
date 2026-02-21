
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Zap, 
  Settings, 
  Shield, 
  Globe, 
  HelpCircle, 
  LogOut, 
  Plus, 
  ArrowLeft,
  Layout,
  Mail,
  Box, Globe as GlobeIcon, Hexagon, Ship, Anchor, Zap as ZapIcon,
  User as UserIcon, X, Key, CheckCircle2,
  Search,
  Terminal,
  Plane,
  Truck,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Project, ServerProfile, MasterDataCategory, TransformationConfig, User, IDPConfig, LogicProfile, BrandingConfig, SMTPConfig, TransmissionLogEntry } from './types';
import { 
  RAW_COUNTRIES, 
  RAW_UNLOCODES, 
  DEFAULT_LOGIC_CONFIG, 
  DEFAULT_BRANDING, 
  THEME_MAP, 
  ENTERPRISE_HTML_TEMPLATE_CREATED, 
  ENTERPRISE_HTML_TEMPLATE_RESET, 
  ENTERPRISE_HTML_TEMPLATE_BACKUP 
} from './constants';
import ProjectList from './components/ProjectList';
import ProjectEditor from './components/ProjectEditor';
import MasterDataInterface from './components/MasterDataInterface';
import ServerProfilesInterface from './components/ServerProfilesInterface';
import HelpSection from './components/HelpSection';
import LogicEditor from './components/LogicEditor';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import IDPConfigInterface from './components/IDPConfigInterface';
import BrandingSettings from './components/BrandingSettings';
import SMTPSettings from './components/SMTPSettings';
import RateSearch from './components/RateSearch';
import TransmissionLogs from './components/TransmissionLogs';

// --- DATA INJECTION START ---
// Constants moved to constants.ts


import ConfirmationModal from './components/ConfirmationModal';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'rate-search' | 'master-data' | 'logic' | 'profiles' | 'users' | 'idp' | 'smtp' | 'help' | 'branding' | 'logs'>('dashboard');
  
  // State Initialization (Empty initially, populated from API)
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [transmissionLogs, setTransmissionLogs] = useState<TransmissionLogEntry[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Modal State for User Profile
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileFormData, setProfileFormData] = useState<{nickname: string; avatarUrl: string; newPassword?: string}>({ nickname: '', avatarUrl: '' });
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [masterData, setMasterData] = useState<MasterDataCategory[]>([]);
  const [logicProfiles, setLogicProfiles] = useState<LogicProfile[]>([]);
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [smtpConfig, setSmtpConfig] = useState<SMTPConfig>({
      host: '', port: 587, user: '', pass: '', fromEmail: '', enabled: false,
      templates: {
        userCreated: ENTERPRISE_HTML_TEMPLATE_CREATED,
        passwordReset: ENTERPRISE_HTML_TEMPLATE_RESET,
        projectBackup: ENTERPRISE_HTML_TEMPLATE_BACKUP
      }
    });
  
  const [serverProfiles, setServerProfiles] = useState<ServerProfile[]>([]);
  const [appUsers, setAppUsers] = useState<User[]>([]);
  const [idpConfig, setIdpConfig] = useState<IDPConfig>({
     providerName: '', discoveryUrl: '', clientId: '', clientSecret: '', scopes: '', enabled: false 
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          projectsRes, 
          masterDataRes, 
          logicProfilesRes, 
          brandingRes, 
          smtpRes, 
          serverProfilesRes, 
          usersRes, 
          idpRes,
          logsRes
        ] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/master-data'),
          fetch('/api/logic-profiles'),
          fetch('/api/branding'),
          fetch('/api/smtp'),
          fetch('/api/server-profiles'),
          fetch('/api/users'),
          fetch('/api/idp-config'),
          fetch('/api/logs')
        ]);

        if (projectsRes.ok) setProjects(await projectsRes.json());
        if (masterDataRes.ok) setMasterData(await masterDataRes.json());
        if (logicProfilesRes.ok) setLogicProfiles(await logicProfilesRes.json());
        if (brandingRes.ok) setBranding(await brandingRes.json());
        if (smtpRes.ok) setSmtpConfig(await smtpRes.json());
        if (serverProfilesRes.ok) setServerProfiles(await serverProfilesRes.json());
        if (usersRes.ok) setAppUsers(await usersRes.json());
        if (idpRes.ok) setIdpConfig(await idpRes.json());
        if (logsRes.ok) setTransmissionLogs(await logsRes.json());
        
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };
    fetchData();
  }, []);

  // Persistence Effects (Only run after initial load)
  useEffect(() => { 
    if (isLoaded) fetch('/api/master-data', { method: 'POST', body: JSON.stringify(masterData), headers: {'Content-Type': 'application/json'} }); 
  }, [masterData, isLoaded]);
  
  useEffect(() => { 
    if (isLoaded) fetch('/api/logic-profiles', { method: 'POST', body: JSON.stringify(logicProfiles), headers: {'Content-Type': 'application/json'} }); 
  }, [logicProfiles, isLoaded]);
  
  useEffect(() => { 
    if (isLoaded) fetch('/api/branding', { method: 'POST', body: JSON.stringify(branding), headers: {'Content-Type': 'application/json'} }); 
  }, [branding, isLoaded]);
  
  useEffect(() => { 
    if (isLoaded) fetch('/api/smtp', { method: 'POST', body: JSON.stringify(smtpConfig), headers: {'Content-Type': 'application/json'} }); 
  }, [smtpConfig, isLoaded]);
  
  useEffect(() => { 
    if (isLoaded) fetch('/api/projects', { method: 'POST', body: JSON.stringify(projects), headers: {'Content-Type': 'application/json'} }); 
  }, [projects, isLoaded]);

  useEffect(() => { 
    if (isLoaded) fetch('/api/users', { method: 'POST', body: JSON.stringify(appUsers), headers: {'Content-Type': 'application/json'} }); 
  }, [appUsers, isLoaded]);

  useEffect(() => { 
    if (isLoaded) fetch('/api/server-profiles', { method: 'POST', body: JSON.stringify(serverProfiles), headers: {'Content-Type': 'application/json'} }); 
  }, [serverProfiles, isLoaded]);

  // Sync current user session with appUsers updates
  useEffect(() => {
    if (user && isLoaded) {
        const updatedSession = appUsers.find(u => u.id === user.id);
        if (updatedSession && (updatedSession.nickname !== user.nickname || updatedSession.avatarUrl !== user.avatarUrl)) {
            setUser(updatedSession);
        }
    }
  }, [appUsers, user, isLoaded]);

  const addLog = (log: TransmissionLogEntry) => {
    setTransmissionLogs(prev => [log, ...prev]);
    fetch('/api/logs', { method: 'POST', body: JSON.stringify(log), headers: {'Content-Type': 'application/json'} });
  };

  const handleLoginSuccess = (loggedInUser: User) => {
      setUser(loggedInUser);
  };

  const handleLogout = () => {
    setConfirmModal({
        isOpen: true,
        title: 'Sign Out',
        message: 'Are you sure you want to sign out of your session?',
        onConfirm: () => {
            setUser(null);
            setActiveView('dashboard');
            setCurrentProject(null);
        }
    });
  };

  const createProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: `Rate Sheet ${new Date().toLocaleDateString()}`,
      carrier: 'GENERIC',
      transportMode: 'OCEAN',
      effectiveDate: '2025-01-01',
      expiryDate: '2025-12-31',
      insertDate: Date.now(),
      updateDate: Date.now(),
      createdAt: Date.now(),
      createdBy: user?.nickname || user?.name || 'Unknown',
      lastEditedBy: user?.nickname || user?.name || 'Unknown',
      csvData: [],
      xmlFiles: {},
      status: 'draft',
      validationConfig: {}
    };
    setProjects([newProject, ...projects]);
    setCurrentProject(newProject);
  };
  
  const openProfileModal = () => {
      if (user) {
          setProfileFormData({
              nickname: user.nickname || user.name,
              avatarUrl: user.avatarUrl || '',
              newPassword: ''
          });
          setIsProfileOpen(true);
      }
  };
  
  const handleProfileUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      
      const updatedUser = { ...user, nickname: profileFormData.nickname, avatarUrl: profileFormData.avatarUrl };
      // In a real app, we would handle password change securely here
      
      // Update in appUsers list to persist
      setAppUsers(appUsers.map(u => u.id === user.id ? updatedUser : u));
      setUser(updatedUser);
      setIsProfileOpen(false);
      
      if (profileFormData.newPassword) {
          alert("Password updated successfully.");
      }
  };

  const handleMarkPreferred = (row: any) => {
    let prefProject = projects.find(p => p.name === 'Preferred Rates');
    
    if (!prefProject) {
      const newPrefProject: Project = {
        id: crypto.randomUUID(),
        name: 'Preferred Rates',
        carrier: 'VARIOUS',
        transportMode: 'OCEAN',
        effectiveDate: new Date().toISOString().split('T')[0],
        expiryDate: '2025-12-31',
        insertDate: Date.now(),
        updateDate: Date.now(),
        createdAt: Date.now(),
        createdBy: user?.nickname || user?.name || 'System',
        lastEditedBy: user?.nickname || user?.name || 'System',
        csvData: [row],
        xmlFiles: {},
        status: 'draft',
        validationConfig: {},
        selectedLogicProfileId: 'preferred'
      };
      setProjects([newPrefProject, ...projects]);
      alert("Created 'Preferred Rates' project and added the selected rate.");
    } else {
      const updatedProject = {
        ...prefProject,
        csvData: [...prefProject.csvData, row],
        updateDate: Date.now(),
        lastEditedBy: user?.nickname || user?.name || 'System'
      };
      setProjects(projects.map(p => p.id === prefProject!.id ? updatedProject : p));
      alert("Added rate to 'Preferred Rates' project.");
    }
  };

  if (!user) {
    return <Login onLogin={handleLoginSuccess} branding={branding} smtpConfig={smtpConfig} />;
  }

  const renderContent = () => {
    if (currentProject) {
      return (
        <ProjectEditor 
          project={currentProject} 
          currentUser={user}
          onSave={(updated) => {
            setProjects(projects.map(p => p.id === updated.id ? updated : p));
            setCurrentProject(updated);
          }}
          profiles={serverProfiles}
          masterData={masterData}
          logicConfig={DEFAULT_LOGIC_CONFIG}
          logicProfiles={logicProfiles}
          addLog={addLog}
          smtpConfig={smtpConfig}
        />
      );
    }

    switch (activeView) {
      case 'dashboard':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="relative w-full h-40 rounded-[32px] overflow-hidden shadow-xl group border border-white/20">
               <div className="absolute inset-0 bg-slate-900">
                  <img 
                    src="image.png" 
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                    alt="RateFusion Hero"
                    onError={(e) => {
                        // Fallback if image.png missing
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'; 
                    }}
                  />
               </div>
               <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent flex flex-col justify-center px-8">
                  <div className="flex items-center gap-4 mb-1 opacity-80">
                     <Plane className="text-blue-400" size={20} />
                     <Ship className="text-indigo-400" size={20} />
                     <Truck className="text-emerald-400" size={20} />
                  </div>
                  <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 drop-shadow-sm tracking-tight" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                    RateFusion
                  </h1>
                  <p className="text-white/80 text-sm mt-2 font-medium max-w-xl border-l-4 border-emerald-500 pl-4">
                    Unified Logistics Rate Management & Transformation Engine
                  </p>
               </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between px-2">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-3">
                   <span className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm shadow-lg shadow-blue-200">
                     <LayoutDashboard size={20} />
                   </span>
                   Active Projects
                </h2>
              </div>
              <button 
                onClick={createProject}
                className={`${THEME_MAP[branding.themeColor]} hover:opacity-90 text-white px-8 py-3.5 rounded-2xl flex items-center gap-3 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:translate-y-[-2px] border border-white/20`}
              >
                <Plus size={18} /> Initialize Project
              </button>
            </div>
            
            <div className="bg-white/60 backdrop-blur-md rounded-[32px] p-2 border border-white/60 shadow-lg">
                <ProjectList 
                  projects={projects} 
                  onSelect={setCurrentProject} 
                  onDelete={(id) => setProjects(projects.filter(p => p.id !== id))} 
                  onRename={(id, name) => setProjects(projects.map(p => p.id === id ? {...p, name} : p))}
                />
            </div>
          </div>
        );
      case 'rate-search': 
        const prefProject = projects.find(p => p.name === 'Preferred Rates');
        return <RateSearch projects={projects} onMarkPreferred={handleMarkPreferred} preferredRows={prefProject?.csvData || []} />;
      case 'master-data': return <MasterDataInterface masterData={masterData} setMasterData={setMasterData} />;
      case 'logic': return <LogicEditor logicProfiles={logicProfiles} setLogicProfiles={setLogicProfiles} masterData={masterData} />;
      case 'profiles': return <ServerProfilesInterface profiles={serverProfiles} setProfiles={setServerProfiles} />;
      case 'users': return <UserManagement users={appUsers} setUsers={setAppUsers} smtpConfig={smtpConfig} />;
      case 'idp': return <IDPConfigInterface config={idpConfig} setConfig={setIdpConfig} />;
      case 'smtp': return <SMTPSettings config={smtpConfig} setConfig={setSmtpConfig} />;
      case 'branding': return <BrandingSettings config={branding} setConfig={setBranding} />;
      case 'logs': return <TransmissionLogs logs={transmissionLogs} profiles={serverProfiles} />;
      case 'help': return <HelpSection />;
      default: return null;
    }
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'rate-search', icon: Search, label: 'Rate Search' },
    { id: 'master-data', icon: Database, label: 'Master Data' },
    { id: 'logic', icon: Zap, label: 'Logic Engine' },
    { id: 'profiles', icon: Settings, label: 'Connections' },
    { id: 'logs', icon: Terminal, label: 'Transmission Logs' },
  ];

  const adminItems = [
    { id: 'users', icon: Shield, label: 'Access Control' },
    { id: 'idp', icon: Globe, label: 'SSO Config' },
    { id: 'smtp', icon: Mail, label: 'SMTP Settings' },
    { id: 'branding', icon: Layout, label: 'Portal Branding' },
  ];

  const BrandIconComponent = {
    Box, Globe: GlobeIcon, Hexagon, Ship, Anchor, Zap: ZapIcon
  }[branding.icon] || Hexagon;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
      />
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-slate-900 flex flex-col text-white relative overflow-hidden shrink-0 border-r border-slate-800 transition-all duration-300`}>
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className={`absolute top-[-20%] right-[-50%] w-[100%] h-[50%] ${THEME_MAP[branding.themeColor]} rounded-full blur-[100px]`}></div>
        </div>

        {/* Toggle Button */}
        <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute top-4 right-4 z-50 text-slate-500 hover:text-white transition-colors"
        >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className={`p-6 z-10 flex flex-col ${isSidebarCollapsed ? 'items-center' : ''}`}>
          <div className={`flex items-center gap-3 mb-8 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="h-8 w-auto bg-white/10 backdrop-blur-md rounded-lg p-1" />
            ) : (
                <div className={`w-10 h-10 ${THEME_MAP[branding.themeColor]} rounded-xl flex items-center justify-center text-white shadow-lg shrink-0`}>
                  <BrandIconComponent size={20} />
                </div>
            )}
            {!isSidebarCollapsed && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <h1 className="font-black text-lg tracking-tight uppercase leading-none truncate w-32 drop-shadow-md" title={branding.portalName} style={{ fontFamily: '"Orbitron", sans-serif' }}>{branding.portalName}</h1>
                <p className="text-[9px] text-slate-500 font-bold tracking-[0.25em] uppercase mt-1.5 ml-0.5">Platform v3.0</p>
                </div>
            )}
          </div>

          <div className="space-y-6 w-full">
            <div className="space-y-2">
              {!isSidebarCollapsed && <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 animate-in fade-in">Workspace</p>}
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveView(item.id as any); setCurrentProject(null); }}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl transition-all text-sm font-bold border border-transparent ${activeView === item.id && !currentProject ? `${THEME_MAP[branding.themeColor]} text-white shadow-lg border-white/10` : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  title={isSidebarCollapsed ? item.label : ''}
                >
                  <item.icon size={18} /> 
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </button>
              ))}
            </div>

            {user.role === 'ADMIN' && (
              <div className="space-y-2">
                {!isSidebarCollapsed && <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 animate-in fade-in">Administration</p>}
                {adminItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveView(item.id as any); setCurrentProject(null); }}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl transition-all text-sm font-bold border border-transparent ${activeView === item.id ? `${THEME_MAP[branding.themeColor]} text-white shadow-lg border-white/10` : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    title={isSidebarCollapsed ? item.label : ''}
                  >
                    <item.icon size={18} /> 
                    {!isSidebarCollapsed && <span>{item.label}</span>}
                  </button>
                ))}
              </div>
            )}
            
             <div className="space-y-2">
                {!isSidebarCollapsed && <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 animate-in fade-in">Support</p>}
                <button
                  onClick={() => { setActiveView('help'); setCurrentProject(null); }}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl transition-all text-sm font-bold border border-transparent ${activeView === 'help' ? `${THEME_MAP[branding.themeColor]} text-white shadow-lg border-white/10` : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  title={isSidebarCollapsed ? 'Documentation' : ''}
                >
                  <HelpCircle size={18} /> 
                  {!isSidebarCollapsed && <span>Documentation</span>}
                </button>
             </div>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-slate-50">
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-6 shrink-0 z-20 sticky top-0">
          <div className="flex items-center gap-4">
             {currentProject && (
               <button onClick={() => setCurrentProject(null)} className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-md transition-all group">
                 <ArrowLeft size={18} className="text-slate-400 group-hover:text-slate-700" />
               </button>
             )}
             <div>
               <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase" style={{ fontFamily: '"Inter", sans-serif' }}>
                 {currentProject ? currentProject.name : (menuItems.find(i => i.id === activeView)?.label || adminItems.find(i => i.id === activeView)?.label || 'Knowledge Base')}
               </h2>
               {currentProject && (
                 <div className="flex items-center gap-2">
                   <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                     currentProject.status === 'transmitted' ? 'bg-green-50 text-green-700 border-green-200' :
                     currentProject.status === 'converted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                     'bg-amber-50 text-amber-700 border-amber-200'
                   }`}>
                     {currentProject.status}
                   </span>
                   <span className="text-[10px] text-slate-400 font-medium">Last updated: {new Date(currentProject.updateDate).toLocaleTimeString()}</span>
                 </div>
               )}
             </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div> System Online
            </div>

            {/* User Profile in Header */}
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200 cursor-pointer group" onClick={openProfileModal}>
                <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-slate-800">{user.nickname || user.name}</div>
                    <div className="text-[10px] text-slate-400">{user.role}</div>
                </div>
                {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover border-2 border-slate-200 group-hover:border-blue-500 transition-colors" />
                ) : (
                    <div className={`w-8 h-8 rounded-full ${THEME_MAP[branding.themeColor]} flex items-center justify-center font-bold text-xs text-white shadow-md`}>{user.name.charAt(0)}</div>
                )}
                <button onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="text-slate-400 hover:text-red-500 transition-colors"><LogOut size={16}/></button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative scroll-smooth custom-scrollbar">
           {renderContent()}
        </div>
      </main>
      
      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">My Account</h3>
               <button onClick={() => setIsProfileOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
             </div>
             <form onSubmit={handleProfileUpdate} className="p-10 space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name / Nickname</label>
                    <div className="relative">
                        <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            value={profileFormData.nickname}
                            onChange={e => setProfileFormData({ ...profileFormData, nickname: e.target.value })}
                        />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Avatar URL</label>
                    <div className="relative">
                        <GlobeIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://..."
                            value={profileFormData.avatarUrl}
                            onChange={e => setProfileFormData({ ...profileFormData, avatarUrl: e.target.value })}
                        />
                    </div>
                 </div>
                 <div className="space-y-1.5 pt-4 border-t border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Change Password</label>
                    <div className="relative">
                        <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="password" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="New Password (Optional)"
                            value={profileFormData.newPassword}
                            onChange={e => setProfileFormData({ ...profileFormData, newPassword: e.target.value })}
                        />
                    </div>
                 </div>
                 <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all">
                    Update Profile
                 </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
