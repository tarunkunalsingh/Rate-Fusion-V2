
import React, { useState, useRef } from 'react';
import { MasterDataCategory } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { Database, Plus, Trash2, Upload, Search, X, Download, Table, List, ChevronRight, AlertCircle, FileSpreadsheet, MoreHorizontal, Edit2, Check } from 'lucide-react';
import Papa from 'papaparse';

interface MasterDataInterfaceProps {
  masterData: MasterDataCategory[];
  setMasterData: React.Dispatch<React.SetStateAction<MasterDataCategory[]>>;
}

const MasterDataInterface: React.FC<MasterDataInterfaceProps> = ({ masterData, setMasterData }) => {
  // State for creating new category
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'LIST' | 'KEY_VALUE'>('LIST');

  // Modal State
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  
  // Inline rename state for Categories
  const [renamingCatId, setRenamingCatId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  
  // Search & Inputs within Modal
  const [searchTerm, setSearchTerm] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [inputValue, setInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCategory = masterData.find(c => c.id === selectedCatId);

  const handleAddCategory = () => {
    if (!newCatName) return;
    const newCat: MasterDataCategory = {
      id: crypto.randomUUID(),
      name: newCatName,
      type: newCatType,
      records: [],
      dataMap: newCatType === 'KEY_VALUE' ? {} : undefined
    };
    setMasterData(prev => [...prev, newCat]);
    setNewCatName('');
  };

  const removeCategory = (id: string, name?: string) => {
    setConfirmModal({
        isOpen: true,
        title: 'Delete Dataset',
        message: `Are you sure you want to permanently delete the "${name || 'selected'}" dataset? This action cannot be undone.`,
        onConfirm: () => {
            setMasterData(prev => prev.filter(m => m.id !== id));
            setSelectedCatId(null);
        }
    });
  };

  const startRename = (e: React.MouseEvent, cat: MasterDataCategory) => {
    e.preventDefault();
    e.stopPropagation();
    setRenamingCatId(cat.id);
    setRenameValue(cat.name);
  };

  const saveRename = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (renameValue.trim()) {
        setMasterData(prev => prev.map(m => m.id === id ? { ...m, name: renameValue } : m));
    }
    setRenamingCatId(null);
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeCategory) return;
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          setMasterData(prev => prev.map(m => {
            if (m.id === activeCategory.id) {
              if (m.type === 'LIST') {
                const flatStrings = Array.from(new Set(results.data.flat() as string[]))
                  .filter(s => !!s && s.trim().length > 0)
                  .map(s => s.trim());
                return { ...m, records: [...new Set([...m.records, ...flatStrings])].sort() };
              } else {
                const newEntries: Record<string, string> = {};
                (results.data as string[][]).forEach(row => {
                  if (row[0] && row[0].trim()) {
                    newEntries[row[0].trim()] = row[1] ? row[1].trim() : '';
                  }
                });
                return { ...m, dataMap: { ...(m.dataMap || {}), ...newEntries } };
              }
            }
            return m;
          }));
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      });
    }
  };

  const handleExport = () => {
    if (!activeCategory) return;
    let csvContent = "";
    if (activeCategory.type === 'LIST') {
      csvContent = activeCategory.records.join("\n");
    } else if (activeCategory.dataMap) {
      csvContent = Object.entries(activeCategory.dataMap).map(([k, v]) => `${k},${v}`).join("\n");
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${activeCategory.name.replace(/\s+/g, '_')}_MasterData.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddRecord = () => {
    if (!activeCategory || !inputKey.trim()) return;
    const key = inputKey.trim();
    
    setMasterData(prev => prev.map(m => {
        if (m.id === activeCategory.id) {
            if (m.type === 'LIST') {
                if (m.records.includes(key)) return m;
                return { ...m, records: [...m.records, key].sort() };
            } else {
                return { ...m, dataMap: { ...(m.dataMap || {}), [key]: inputValue.trim() } };
            }
        }
        return m;
    }));
    setInputKey('');
    setInputValue('');
  };

  const handleDeleteRecord = (keyToDelete: string) => {
    if (!activeCategory) return;
    setMasterData(prev => prev.map(m => {
      if (m.id === activeCategory.id) {
        if (m.type === 'LIST') {
          return { ...m, records: m.records.filter(r => r !== keyToDelete) };
        } else if (m.dataMap) {
          const newMap = { ...m.dataMap };
          delete newMap[keyToDelete];
          return { ...m, dataMap: newMap };
        }
      }
      return m;
    }));
  };

  // Prepare visible records for the modal
  const getVisibleRecords = () => {
     if (!activeCategory) return [];
     const isKV = activeCategory.type === 'KEY_VALUE';
     const allKeys = isKV ? Object.keys(activeCategory.dataMap || {}) : activeCategory.records;
     
     if (!searchTerm) return allKeys;
     
     return allKeys.filter(k => {
       const keyMatch = k.toLowerCase().includes(searchTerm.toLowerCase());
       const valMatch = isKV ? activeCategory.dataMap?.[k]?.toLowerCase().includes(searchTerm.toLowerCase()) : false;
       return keyMatch || valMatch;
     });
  };

  const visibleRecords = getVisibleRecords();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
      {/* Creation Header */}
      <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-blue-50 opacity-10">
          <Database size={140} />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-4 uppercase tracking-tight">
            <span className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200"><Database size={24} /></span>
            Master Data Registry
          </h2>
          <p className="text-slate-500 mt-4 text-sm font-medium leading-relaxed max-w-2xl">
            Central repository for validation logic and data lookup. Manage standard datasets (UNLOCODEs, ISO Codes) and Key-Value lookup tables for the Logic Engine.
          </p>
          
          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <input 
                type="text" 
                placeholder="New Category Name (e.g. CarrierMap)" 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm font-bold placeholder:text-slate-400"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <select
                className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-600"
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as any)}
              >
                <option value="LIST">Validation List</option>
                <option value="KEY_VALUE">Lookup Table</option>
              </select>
            </div>
            <button 
              onClick={handleAddCategory}
              className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl flex items-center gap-3 transition-all font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-xl"
            >
              <Plus size={18} /> Create Dataset
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         {masterData.map(cat => {
            const count = cat.type === 'LIST' ? cat.records.length : Object.keys(cat.dataMap || {}).length;
            return (
              <div 
                key={cat.id} 
                className="group relative bg-white rounded-3xl p-6 border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all text-left flex flex-col h-48 justify-between cursor-pointer"
                onClick={() => {
                   // Ensure we don't open modal if we are renaming
                   if (renamingCatId !== cat.id) {
                     setSelectedCatId(cat.id);
                     setSearchTerm('');
                     setInputKey('');
                     setInputValue('');
                   }
                }}
              >
                 <div className="flex justify-between items-start">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${cat.type === 'KEY_VALUE' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                       {cat.type === 'KEY_VALUE' ? <Table size={24} /> : <List size={24} />}
                    </div>
                    <div className="flex gap-2 relative z-10">
                        {renamingCatId !== cat.id && (
                           <>
                            <button 
                                onClick={(e) => startRename(e, cat)}
                                className="bg-slate-50 hover:bg-blue-50 text-slate-300 hover:text-blue-500 p-1.5 rounded-full transition-colors"
                                title="Rename Dataset"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeCategory(cat.id, cat.name);
                                }}
                                className="bg-slate-50 hover:bg-red-50 text-slate-300 hover:text-red-500 p-1.5 rounded-full transition-colors"
                                title="Delete Dataset"
                            >
                                <Trash2 size={16} />
                            </button>
                           </>
                        )}
                        <div className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition-colors">
                           {cat.type === 'KEY_VALUE' ? 'LOOKUP' : 'LIST'}
                        </div>
                    </div>
                 </div>
                 
                 <div>
                    {renamingCatId === cat.id ? (
                        <div className="flex items-center gap-2 mb-2" onClick={e => e.stopPropagation()}>
                           <input 
                             type="text" 
                             value={renameValue} 
                             onChange={e => setRenameValue(e.target.value)}
                             className="w-full bg-white border border-blue-500 rounded px-2 py-1 text-lg font-black outline-none"
                             autoFocus
                           />
                           <button onClick={(e) => saveRename(e, cat.id)} className="text-emerald-500 p-1 hover:bg-emerald-50 rounded"><Check size={18}/></button>
                           <button onClick={(e) => { e.stopPropagation(); setRenamingCatId(null); }} className="text-slate-400 p-1 hover:bg-slate-100 rounded"><X size={18}/></button>
                        </div>
                    ) : (
                        <h3 className="text-lg font-black text-slate-800 group-hover:text-blue-700 transition-colors truncate mb-1">{cat.name}</h3>
                    )}
                    <p className="text-sm font-medium text-slate-400">{count.toLocaleString()} Records</p>
                 </div>

                 <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                    <div className="bg-blue-50 p-2 rounded-full text-blue-600">
                       <ChevronRight size={20} />
                    </div>
                 </div>
              </div>
            );
         })}
      </div>

      {/* Maintenance Modal */}
      {activeCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
               <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeCategory.type === 'KEY_VALUE' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                      {activeCategory.type === 'KEY_VALUE' ? <Table size={24} /> : <List size={24} />}
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-slate-800 tracking-tight">{activeCategory.name}</h2>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        {activeCategory.type === 'KEY_VALUE' ? 'Key-Value Lookup Table' : 'Validation List'}
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        {visibleRecords.length} Entries
                     </p>
                  </div>
               </div>
               <button onClick={() => setSelectedCatId(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
               </button>
            </div>

            {/* Toolbar */}
            <div className="px-8 py-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between shrink-0">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                     type="text" 
                     className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Search records..."
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     autoFocus
                  />
               </div>
               <div className="flex items-center gap-2">
                  <button onClick={handleExport} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 font-bold text-xs uppercase tracking-wide transition-all shadow-sm">
                     <Download size={16} /> Export
                  </button>
                  <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 font-bold text-xs uppercase tracking-wide transition-all shadow-sm cursor-pointer">
                     <Upload size={16} /> Import CSV
                     <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleCsvImport} />
                  </label>
                  <div className="w-px h-8 bg-slate-300 mx-2"></div>
                  <button 
                     onClick={() => removeCategory(activeCategory.id, activeCategory.name)}
                     className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 hover:bg-red-600 hover:text-white font-bold text-xs uppercase tracking-wide transition-all shadow-sm"
                  >
                     <Trash2 size={16} /> Delete Dataset
                  </button>
               </div>
            </div>

            {/* Add Record Area */}
            <div className="px-8 py-4 bg-white border-b border-slate-100 flex gap-3 shrink-0">
               <input 
                  type="text" 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={activeCategory.type === 'KEY_VALUE' ? "Key (e.g. USNY)" : "Add new value..."}
                  value={inputKey}
                  onChange={e => setInputKey(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddRecord()}
               />
               {activeCategory.type === 'KEY_VALUE' && (
                  <input 
                     type="text" 
                     className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Value (e.g. New York)"
                     value={inputValue}
                     onChange={e => setInputValue(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && handleAddRecord()}
                  />
               )}
               <button 
                  onClick={handleAddRecord}
                  disabled={!inputKey.trim()}
                  className="bg-slate-900 hover:bg-blue-600 text-white px-6 rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  <Plus size={20} />
               </button>
            </div>

            {/* Records List */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
               {visibleRecords.length > 0 ? (
                  activeCategory.type === 'KEY_VALUE' ? (
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                              <th className="pb-3 pl-4 w-1/3">Key</th>
                              <th className="pb-3">Mapped Value</th>
                              <th className="pb-3 text-right pr-4">Action</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                           {visibleRecords.map((key) => (
                              <tr key={key} className="group hover:bg-white transition-colors">
                                 <td className="py-3 pl-4 text-sm font-bold text-slate-700 font-mono">{key}</td>
                                 <td className="py-3 text-sm text-slate-600">{activeCategory.dataMap?.[key]}</td>
                                 <td className="py-3 text-right pr-4">
                                    <button 
                                       onClick={() => handleDeleteRecord(key)}
                                       className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                                       title="Delete Record"
                                    >
                                       <Trash2 size={16} />
                                    </button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  ) : (
                     <div className="flex flex-wrap gap-3 content-start">
                        {visibleRecords.map((r) => (
                           <div key={r} className="group flex items-center gap-3 bg-white border border-slate-200 text-sm font-bold text-slate-700 px-4 py-2.5 rounded-xl shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-all">
                              <span>{r}</span>
                              <button 
                                 onClick={() => handleDeleteRecord(r)}
                                 className="text-slate-300 group-hover:text-red-500 transition-colors border-l border-slate-100 group-hover:border-red-200 pl-3"
                                 title="Delete Record"
                              >
                                 <X size={14} strokeWidth={3} />
                              </button>
                           </div>
                        ))}
                     </div>
                  )
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                     <FileSpreadsheet size={48} strokeWidth={1} />
                     <p className="mt-4 text-sm font-medium">No records found matching your criteria.</p>
                  </div>
               )}
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default MasterDataInterface;
