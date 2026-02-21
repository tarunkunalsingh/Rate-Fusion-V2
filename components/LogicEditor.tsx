import React, { useState, useEffect, useRef } from 'react';
import { TransformationConfig, XMLField, FieldDataType, LogicProfile, MasterDataCategory } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { 
  Plus, 
  Trash2, 
  Table, 
  Zap, 
  Cpu, 
  RefreshCw,
  FilePlus,
  Variable,
  Info,
  X,
  ArrowRight,
  MousePointerClick,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { resolveFormula } from '../services/xmlGenerator';
import { saveAs } from 'file-saver';

interface LogicEditorProps {
  logicProfiles: LogicProfile[];
  setLogicProfiles: (profiles: LogicProfile[]) => void;
  masterData: MasterDataCategory[];
}

const FORMULA_TEMPLATES: Record<FieldDataType, { label: string; fn: string; args: string; desc: string }[]> = {
  NUMBER: [
    { label: 'SUM', fn: 'SUM', args: '{VAL}, 10', desc: 'Add values (Autocasts String to Num)' },
    { label: 'SUBTRACT', fn: 'SUB', args: '{VAL}, 5', desc: 'Subtract from current' },
    { label: 'MULTIPLY', fn: 'MUL', args: '{VAL}, 2', desc: 'Scale value' },
    { label: 'DIVIDE', fn: 'DIV', args: '{VAL}, 100', desc: 'Normalize value' },
    { label: 'TO NUMBER', fn: 'TO_NUMBER', args: '{VAL}', desc: 'Force cast to number' },
    { label: 'TEXT TO NUMBER', fn: 'TO_NUMBER', args: '{VAL}', desc: 'Cast String to Number' },
    { label: 'SEQUENCE', fn: 'SEQ', args: '', desc: 'Auto-increment' },
  ],
  STRING: [
    { label: 'LOOKUP', fn: 'LOOKUP', args: '{VAL}, "TableName"', desc: 'Find value in Master Data Key-Value table' },
    { label: 'IF CONDITION', fn: 'IF', args: '{DG}==YES, _DG, ""', desc: 'Conditional logic' },
    { label: 'CONCAT', fn: 'CONCAT', args: '{VAL}, _EXTRA', desc: 'Suffix text' },
    { label: 'UPPERCASE', fn: 'UPPER', args: '{VAL}', desc: 'Capitalize (Autocasts to String)' },
    { label: 'LOWERCASE', fn: 'LOWER', args: '{VAL}', desc: 'Minify case' },
    { label: 'SUBSTRING', fn: 'SUBSTR', args: '{VAL}, 0, 10', desc: 'Limit length' },
    { label: 'EXTRACT ID', fn: 'XID', args: '{VAL}', desc: 'Remove GID prefix' },
    { label: 'TO STRING', fn: 'TO_STRING', args: '{VAL}', desc: 'Force cast to string' },
    { label: 'DATE TO STRING', fn: 'TO_STRING', args: '{VAL}', desc: 'Cast Date to String' },
    { label: 'NUMBER TO STRING', fn: 'TO_STRING', args: '{VAL}', desc: 'Cast Number to String' },
  ],
  DATE: [
    { label: 'FULL DATE', fn: 'DATE', args: '{VAL}', desc: 'OTM Timestamp (14 chars)' },
    { label: 'SHORT DATE', fn: 'DATE_SHORT', args: '{VAL}', desc: 'OTM Short Date (8 chars)' },
    { label: 'ADD DAYS', fn: 'ADD_DAYS', args: '{VAL}, 30', desc: 'Add days to date' },
    { label: 'TO DATE', fn: 'TO_DATE', args: '{VAL}', desc: 'Force cast to date' },
    { label: 'TEXT TO DATE', fn: 'TO_DATE', args: '{VAL}', desc: 'Cast String to Date' },
    { label: 'FORMAT DATE', fn: 'FORMAT_DATE', args: '{VAL}, "YYYY-MM-DD"', desc: 'Format Date to String' },
    { label: 'SYSTEM DATE', fn: 'SYSDATE', args: '', desc: 'Current OTM Timestamp' },
  ],
};

const LogicEditor: React.FC<LogicEditorProps> = ({ logicProfiles, setLogicProfiles, masterData }) => {
  const [localProfiles, setLocalProfilesInternal] = useState<LogicProfile[]>(logicProfiles);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string>(logicProfiles.find(p => p.isDefault)?.id || logicProfiles[0]?.id || '');
  const [newProfileName, setNewProfileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local profiles with props when props change and there are no unsaved changes
  useEffect(() => {
    if (!hasChanges) {
      setLocalProfilesInternal(logicProfiles);
    }
  }, [logicProfiles, hasChanges]);

  const updateLocalProfiles = (newProfiles: LogicProfile[]) => {
    setLocalProfilesInternal(newProfiles);
    setHasChanges(true);
  };

  const handleSave = () => {
    setLogicProfiles(localProfiles);
    setHasChanges(false);
  };

  const handleDiscard = () => {
    setLocalProfilesInternal(logicProfiles);
    setHasChanges(false);
  };
  
  // Sidebar Collapsible Sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    tables: true,
    variables: true,
    mock: true
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Dynamic keys based on profile
  const activeProfile = localProfiles.find(p => p.id === activeProfileId);
  // Use explicit transmission sequence if available, otherwise fallback to keys
  const tableKeys = activeProfile ? (activeProfile.transmissionSequence || Object.keys(activeProfile.config)) : [];
  
  const [selectedSheet, setSelectedSheet] = useState<string>(tableKeys[0] || '');
  
  // Rename State
  const [renameInput, setRenameInput] = useState('');
  
  // Variables State for current profile
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarVal, setNewVarVal] = useState('');

  // Active Input Tracking for Formula Insertion
  type ActiveInput = { type: 'FIELD' | 'VAR', id?: string, start: number, end: number };
  const [activeInput, setActiveInput] = useState<ActiveInput | null>(null);

  // Sync rename input when selected sheet changes
  useEffect(() => {
     setRenameInput(selectedSheet);
  }, [selectedSheet]);

  // Ensure selected sheet is valid when profile changes
  useEffect(() => {
    if (activeProfile && !activeProfile.config[selectedSheet]) {
       const first = Object.keys(activeProfile.config)[0];
       setSelectedSheet(first || '');
    }
  }, [activeProfileId, activeProfile]);

  const [testRow, setTestRow] = useState<any>({
    SCAC: 'KHNN',
    POLUNLOCODE: 'MYPGU',
    PODUNLOCODE: 'MXVER',
    TYPE: 'AWS',
    DG: 'NO',
    Effective: '3/25/2025',
    Expiration: '4/30/2025',
    'DTD Transit time Required': '39',
    'Ocean Freight': '6152',
    'Container Size': '40_FT_CONTAINER',
    'Carrier': 'KUEHNE-NAGEL'
  });

  const sheet = activeProfile?.config[selectedSheet] || { tableName: selectedSheet, fields: [] };
  const variables = activeProfile?.variables || {};

  const handleInputSelect = (e: React.SyntheticEvent<HTMLInputElement>, type: 'FIELD' | 'VAR', id?: string) => {
      const target = e.target as HTMLInputElement;
      setActiveInput({
          type,
          id,
          start: target.selectionStart || 0,
          end: target.selectionEnd || 0
      });
  };

  const handleCreateProfile = () => {
    if (!newProfileName) return;
    const baseProfile = localProfiles.find(p => p.isDefault) || localProfiles[0];
    const newProfile: LogicProfile = {
      id: crypto.randomUUID(),
      name: newProfileName,
      isDefault: false,
      config: JSON.parse(JSON.stringify(baseProfile.config)),
      variables: { ...baseProfile.variables },
      transmissionSequence: [...(baseProfile.transmissionSequence || Object.keys(baseProfile.config))]
    };
    updateLocalProfiles([...localProfiles, newProfile]);
    setNewProfileName('');
    setActiveProfileId(newProfile.id);
  };

  const handleExportProfiles = () => {
    const blob = new Blob([JSON.stringify(localProfiles, null, 2)], { type: 'application/json' });
    saveAs(blob, `logic_profiles_backup_${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleImportProfiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          // Merge logic: Overwrite if ID exists, else add
          const merged = [...localProfiles];
          let addedCount = 0;
          let updatedCount = 0;

          imported.forEach((impProfile: LogicProfile) => {
             const idx = merged.findIndex(p => p.id === impProfile.id);
             if (idx >= 0) {
                 merged[idx] = impProfile;
                 updatedCount++;
             } else {
                 merged.push(impProfile);
                 addedCount++;
             }
          });
          
          updateLocalProfiles(merged);
          alert(`Import Successful!\nAdded: ${addedCount}\nUpdated: ${updatedCount}`);
        } else {
          alert("Invalid file format. Expected an array of profiles.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse JSON file.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const updateConfig = (newConfig: TransformationConfig, newSequence?: string[]) => {
    updateLocalProfiles(localProfiles.map(p => p.id === activeProfileId ? { 
        ...p, 
        config: newConfig,
        transmissionSequence: newSequence || p.transmissionSequence
    } : p));
  };
  
  const addVariable = () => {
      if (!newVarKey.trim() || !newVarVal.trim() || !activeProfile) return;
      const key = newVarKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      const updatedVars = { ...activeProfile.variables, [key]: newVarVal };
      
      updateLocalProfiles(localProfiles.map(p => p.id === activeProfileId ? { ...p, variables: updatedVars } : p));
      setNewVarKey('');
      setNewVarVal('');
  };

  const removeVariable = (key: string) => {
      if (!activeProfile) return;
      const updatedVars = { ...activeProfile.variables };
      delete updatedVars[key];
      updateLocalProfiles(localProfiles.map(p => p.id === activeProfileId ? { ...p, variables: updatedVars } : p));
  };

  const insertToken = (token: string) => {
      if (!activeInput || !activeProfile) return;

      const { start, end } = activeInput;

      if (activeInput.type === 'VAR') {
          const newVal = newVarVal.substring(0, start) + token + newVarVal.substring(end);
          setNewVarVal(newVal);
          // Update cursor position
          setActiveInput({ ...activeInput, start: start + token.length, end: start + token.length });
      } else if (activeInput.type === 'FIELD' && activeInput.id) {
          const sheet = activeProfile.config[selectedSheet];
          const newFields = sheet.fields.map(f => {
              if (f.id === activeInput.id) {
                  const currentFormula = f.formula || '';
                  const newFormula = currentFormula.substring(0, start) + token + currentFormula.substring(end);
                  return { ...f, formula: newFormula };
              }
              return f;
          });
          const newConfig = { ...activeProfile.config, [selectedSheet]: { ...sheet, fields: newFields } };
          updateConfig(newConfig);
          // Update cursor position
          setActiveInput({ ...activeInput, start: start + token.length, end: start + token.length });
      }
  };

  const addField = () => {
    if (!activeProfile) return;
    const newField: XMLField = {
      id: crypto.randomUUID(),
      name: 'NEW_FIELD',
      formula: '',
      dataType: 'STRING'
    };
    const newConfig = {
      ...activeProfile.config,
      [selectedSheet]: {
        ...sheet,
        fields: [...sheet.fields, newField]
      }
    };
    updateConfig(newConfig);
  };

  const updateField = (id: string, updates: Partial<XMLField>) => {
    if (!activeProfile) return;
    const newConfig = {
      ...activeProfile.config,
      [selectedSheet]: {
        ...sheet,
        fields: sheet.fields.map(f => f.id === id ? { ...f, ...updates } : f)
      }
    };
    updateConfig(newConfig);
  };

  const removeField = (id: string) => {
    if (!activeProfile) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Delete Field',
      message: 'Are you sure you want to delete this field? This action cannot be undone.',
      onConfirm: () => {
        const newConfig = {
          ...activeProfile.config,
          [selectedSheet]: {
            ...sheet,
            fields: sheet.fields.filter(f => f.id !== id)
          }
        };
        updateConfig(newConfig);
      }
    });
  };

  // New features for dynamic tables
  const addTable = () => {
      if (!activeProfile) return;
      const tableName = `NEW_TABLE_${Object.keys(activeProfile.config).length + 1}`;
      const newConfig = {
          ...activeProfile.config,
          [tableName]: { tableName: tableName, fields: [] }
      };
      
      const currentSeq = activeProfile.transmissionSequence || Object.keys(activeProfile.config);
      const newSeq = [...currentSeq, tableName];

      updateConfig(newConfig, newSeq);
      setSelectedSheet(tableName);
  };

  const deleteTable = (key: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!activeProfile) return;
      if (Object.keys(activeProfile.config).length <= 1) {
          alert("Cannot delete last table.");
          return;
      }
      
      setConfirmModal({
          isOpen: true,
          title: `Delete Table "${key}"`,
          message: `Are you sure you want to delete the table "${key}"? All fields within it will be lost.`,
          onConfirm: () => {
            const newConfig = { ...activeProfile.config };
            delete newConfig[key];
            
            const currentSeq = activeProfile.transmissionSequence || Object.keys(activeProfile.config);
            const newSeq = currentSeq.filter(k => k !== key);

            // Determine new selected sheet if the deleted one was selected
            if (selectedSheet === key) {
                setSelectedSheet(newSeq[0] || '');
            }
            
            updateConfig(newConfig, newSeq);
          }
      });
  };

  const commitRenameTable = () => {
      const oldKey = selectedSheet;
      const newKey = renameInput.trim();

      if (!activeProfile || oldKey === newKey || !newKey) {
          setRenameInput(oldKey); // Revert
          return;
      }
      
      if (activeProfile.config[newKey]) {
          alert("Table name already exists.");
          setRenameInput(oldKey);
          return;
      }
      
      const config = activeProfile.config;
      const newConfig: TransformationConfig = {};
      
      // Preserve config object order roughly
      Object.keys(config).forEach(k => {
          if (k === oldKey) {
              newConfig[newKey] = { ...config[oldKey], tableName: newKey };
          } else {
              newConfig[k] = config[k];
          }
      });

      // Update sequence with new name
      const currentSeq = activeProfile.transmissionSequence || Object.keys(config);
      const newSeq = currentSeq.map(k => k === oldKey ? newKey : k);
      
      updateConfig(newConfig, newSeq);
      setSelectedSheet(newKey);
  };

  const moveTable = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!activeProfile) return;

      const newSeq = [...tableKeys];
      if (direction === 'up' && index > 0) {
          [newSeq[index], newSeq[index - 1]] = [newSeq[index - 1], newSeq[index]];
      } else if (direction === 'down' && index < newSeq.length - 1) {
          [newSeq[index], newSeq[index + 1]] = [newSeq[index + 1], newSeq[index]];
      }
      
      // Update logic profile with new sequence
      updateConfig(activeProfile.config, newSeq);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Cpu size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Logic Engine</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Active Profile:</span>
              <select 
                value={activeProfileId}
                onChange={(e) => setActiveProfileId(e.target.value)}
                className="bg-slate-100 border-none rounded px-2 py-0.5 font-bold text-slate-800 outline-none"
              >
                {localProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
             {hasChanges && (
               <div className="flex items-center gap-2 mr-4 border-r border-slate-200 pr-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <button 
                    onClick={handleDiscard}
                    className="text-slate-500 hover:text-slate-700 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-colors"
                  >
                    Discard
                  </button>
                  <button 
                    onClick={handleSave}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg shadow-emerald-100"
                  >
                    <RefreshCw size={14} className={hasChanges ? 'animate-spin-slow' : ''} />
                    Save Changes
                  </button>
               </div>
             )}
             <div className="flex items-center gap-2 mr-4 border-r border-slate-200 pr-4">
                <button 
                  onClick={handleExportProfiles}
                  className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                  title="Backup Profiles"
                >
                  <Download size={18} />
                </button>
                <label className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer" title="Restore Profiles">
                  <Upload size={18} />
                  <input 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    onChange={handleImportProfiles}
                    ref={fileInputRef}
                  />
                </label>
             </div>
             <input 
                type="text" 
                placeholder="New Profile Name" 
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 w-48"
                value={newProfileName}
                onChange={e => setNewProfileName(e.target.value)}
              />
              <button onClick={handleCreateProfile} className="bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-black transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wide"><Plus size={14}/> Create Profile</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Schema Selection */}
        <div className="w-80 bg-white border-r border-slate-200 overflow-y-auto flex flex-col shrink-0 custom-scrollbar">
          <div className="border-b border-slate-100">
            <div 
              onClick={() => toggleSection('tables')}
              className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors"
            >
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Table size={12} className="text-blue-500" /> Output Tables
                 </h3>
                 <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); addTable(); }} 
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Plus size={12}/>
                    </button>
                    <ChevronRight size={14} className={`text-slate-400 transition-transform duration-300 ${openSections.tables ? 'rotate-90' : ''}`} />
                 </div>
            </div>
            
            {openSections.tables && (
              <div className="px-6 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-300">
                {tableKeys.map((type, index) => {
                  const isActive = selectedSheet === type;
                  return (
                    <div
                      key={type}
                      onClick={() => setSelectedSheet(type)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${isActive ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                            <Table size={16} />
                          </div>
                          <div className="truncate">
                              <div className={`font-black text-xs uppercase tracking-tight truncate ${isActive ? 'text-blue-800' : 'text-slate-700'}`}>{type}</div>
                          </div>
                      </div>
                      {/* Controls Overlay on Hover */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                              onClick={(e) => moveTable(index, 'up', e)}
                              className="text-slate-300 hover:text-blue-500 p-1 rounded hover:bg-blue-50"
                              disabled={index === 0}
                              title="Move Up"
                          >
                              <ArrowUp size={12} />
                          </button>
                          <button 
                              onClick={(e) => moveTable(index, 'down', e)}
                              className="text-slate-300 hover:text-blue-500 p-1 rounded hover:bg-blue-50"
                              disabled={index === tableKeys.length - 1}
                              title="Move Down"
                          >
                              <ArrowDown size={12} />
                          </button>
                          <button 
                              onClick={(e) => deleteTable(type, e)} 
                              className={`text-slate-300 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors ${isActive ? 'opacity-100' : ''}`}
                              title="Delete Table"
                          >
                              <Trash2 size={14}/>
                          </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Variables Section */}
          <div className="border-b border-slate-100">
             <div 
               onClick={() => toggleSection('variables')}
               className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors"
             >
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Variable size={12} className="text-indigo-500" /> Global Variables
                </h3>
                <ChevronRight size={14} className={`text-slate-400 transition-transform duration-300 ${openSections.variables ? 'rotate-90' : ''}`} />
             </div>
             
             {openSections.variables && (
               <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                 <div className="space-y-2 mb-3">
                     {Object.entries(variables).map(([key, val]) => (
                         <div key={key} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 group shadow-sm">
                             <div className="truncate flex-1 mr-2 cursor-pointer" onClick={() => insertToken(`$${key}`)} title="Click to insert variable">
                                <span className="text-[10px] font-bold text-blue-600 block flex items-center gap-1">${key} <ArrowRight size={8} className="opacity-50"/></span>
                                <span className="text-[9px] text-slate-500 block truncate font-mono bg-slate-50 p-0.5 rounded px-1 mt-0.5">{val}</span>
                             </div>
                             <button onClick={() => removeVariable(key)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"><X size={12}/></button>
                         </div>
                     ))}
                 </div>
                 <div className="flex gap-2 mb-2">
                     <input 
                        className="w-1/2 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase outline-none focus:ring-1 focus:ring-blue-500" 
                        placeholder="VAR_NAME" 
                        value={newVarKey} 
                        onChange={e => setNewVarKey(e.target.value)} 
                     />
                     <input 
                        className={`w-1/2 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] outline-none focus:ring-1 focus:ring-blue-500 ${activeInput?.type === 'VAR' ? 'ring-1 ring-blue-500 border-blue-400' : ''}`} 
                        placeholder="VALUE / FORMULA" 
                        value={newVarVal} 
                        onChange={e => setNewVarVal(e.target.value)}
                        onFocus={(e) => handleInputSelect(e, 'VAR')}
                        onSelect={(e) => handleInputSelect(e, 'VAR')}
                        onClick={(e) => handleInputSelect(e, 'VAR')}
                        onKeyUp={(e) => handleInputSelect(e, 'VAR')}
                     />
                 </div>
                 <button onClick={addVariable} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide shadow-sm">Create Variable</button>
               </div>
             )}
          </div>
          
          <div className="mt-auto border-t border-slate-100">
              <div 
                onClick={() => toggleSection('mock')}
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <RefreshCw size={12} className="text-emerald-500" /> Mock Data & Columns
                </h3>
                <ChevronRight size={14} className={`text-slate-400 transition-transform duration-300 ${openSections.mock ? 'rotate-90' : ''}`} />
              </div>

              {openSections.mock && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                     <p className="text-[9px] text-slate-400 leading-relaxed"><MousePointerClick size={8} className="inline mr-1"/>Click any field to insert its reference <code>{'{COL}'}</code> into the active formula.</p>
                  </div>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                    {Object.keys(testRow).map(key => (
                      <div key={key} className="flex flex-col gap-1 group/field">
                        <button 
                            onClick={() => insertToken(`{${key}}`)}
                            className="text-[9px] font-black text-slate-500 uppercase px-1 truncate flex justify-between cursor-pointer hover:text-blue-400 transition-colors w-full text-left" 
                            title={`Insert {${key}}`}
                        >
                            <span>{key}</span>
                            <span className="text-blue-500 opacity-0 group-hover/field:opacity-100 bg-slate-100 px-1 rounded">{`+`}</span>
                        </button>
                        <input 
                          type="text" 
                          value={testRow[key]} 
                          onChange={e => setTestRow({ ...testRow, [key]: e.target.value })}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 font-mono shadow-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Main Content: Field Editor */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm min-h-full flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10 rounded-t-[32px]">
                 <div className="flex items-center gap-4 w-1/2">
                    <Table size={20} className="text-blue-600 shrink-0" />
                    <input 
                        type="text" 
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        onBlur={commitRenameTable}
                        onKeyDown={e => e.key === 'Enter' && commitRenameTable()}
                        className="text-lg font-black text-slate-800 outline-none bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 uppercase tracking-tight w-full"
                        title="Rename Table"
                    />
                 </div>
                 <button onClick={addField} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg shadow-blue-100">
                  <Plus size={16} /> Add Field
                 </button>
              </div>

              <div className="divide-y divide-slate-100">
                {sheet.fields.map(field => (
                  <div key={field.id} className="p-6 flex flex-col gap-4 group hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-start gap-6">
                      {/* Field Definition */}
                      <div className="w-1/3 space-y-3">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Target XML Tag</label>
                         <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              value={field.name} 
                              onChange={e => updateField(field.id, { name: e.target.value })}
                              className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 font-bold text-slate-700 text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                            />
                            <button onClick={() => removeField(field.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                <Trash2 size={16} />
                            </button>
                         </div>
                         <div className="flex gap-2">
                             <select 
                                value={field.dataType} 
                                onChange={e => updateField(field.id, { dataType: e.target.value as FieldDataType })}
                                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-500 outline-none uppercase tracking-wide"
                              >
                                <option value="STRING">String</option>
                                <option value="NUMBER">Number</option>
                                <option value="DATE">Date</option>
                              </select>
                         </div>
                      </div>

                      {/* Formula Logic */}
                      <div className="flex-1 space-y-3">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 flex justify-between">
                             <span>Transformation Formula</span>
                             <span className="text-blue-600">Preview: {resolveFormula(field.formula, testRow, undefined, masterData, variables)}</span>
                          </label>
                          <div className="relative group/input">
                              <Zap size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within/input:text-blue-600 transition-colors" />
                              <input 
                                type="text" 
                                value={field.formula} 
                                onChange={e => updateField(field.id, { formula: e.target.value })}
                                onFocus={(e) => handleInputSelect(e, 'FIELD', field.id)}
                                onSelect={(e) => handleInputSelect(e, 'FIELD', field.id)}
                                onClick={(e) => handleInputSelect(e, 'FIELD', field.id)}
                                onKeyUp={(e) => handleInputSelect(e, 'FIELD', field.id)}
                                placeholder="e.g. WEGO.{SCAC}_{TYPE}"
                                className={`w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-mono text-blue-700 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all ${activeInput?.id === field.id ? 'ring-2 ring-blue-500 bg-white' : ''}`}
                              />
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5">
                            {FORMULA_TEMPLATES[field.dataType || 'STRING'].map(t => (
                              <button 
                                key={t.label}
                                onClick={() => insertToken(`${t.fn}(${t.args})`)}
                                title={t.desc}
                                className="bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all"
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                      </div>
                    </div>
                  </div>
                ))}
                 {sheet.fields.length === 0 && (
                  <div className="p-20 text-center text-slate-400 flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Table size={24} className="opacity-20"/>
                    </div>
                    <p className="font-bold text-sm">No fields defined</p>
                    <p className="text-xs mt-1">Add a field to map CSV columns to XML tags.</p>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LogicEditor;