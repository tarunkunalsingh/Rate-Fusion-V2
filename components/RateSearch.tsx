
import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  Ship, 
  TrainFront, 
  Truck, 
  Box, 
  Container, 
  Cylinder, 
  AlertTriangle, 
  DollarSign, 
  MapPin, 
  Calendar,
  BadgePercent,
  TrendingDown,
  ShieldCheck,
  XCircle,
  Star,
  Check,
  Crown
} from 'lucide-react';

interface RateSearchProps {
  projects: Project[];
  onMarkPreferred?: (row: any) => void;
  preferredRows?: any[];
}

// Helper to normalize data from loose CSV headers
const normalizeRow = (row: any, projectMode: string) => {
  const getVal = (keys: string[]) => {
    for (const k of keys) {
      const found = Object.keys(row).find(rk => rk.toLowerCase().includes(k.toLowerCase()));
      if (found) return row[found];
    }
    return '';
  };

  const priceStr = getVal(['amount', 'price', 'freight', 'cost', 'rate']) || '0';
  const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
  const equipment = getVal(['container', 'equipment', 'size', 'eq']) || '20FT';
  const type = getVal(['type', 'service', 'mode']) || 'AWS';
  const dg = getVal(['dg', 'haz', 'imo', 'dangerous']) || 'N';

  return {
    carrier: getVal(['scac', 'carrier', 'line']) || 'UNKNOWN',
    mode: projectMode,
    price,
    currency: 'USD', // Assumption for demo
    equipment: equipment.toUpperCase(),
    haz: ['Y', 'YES', '1', 'TRUE'].includes(dg.toUpperCase()),
    pol: getVal(['pol', 'origin', 'from', 'load']),
    pod: getVal(['pod', 'dest', 'to', 'discharge']),
    type: type.toUpperCase(), // AWS or MLB
    effective: getVal(['effective', 'valid_from', 'start']),
    expiry: getVal(['expiry', 'valid_to', 'end']),
    originalRow: row
  };
};

const RateSearch: React.FC<RateSearchProps> = ({ projects, onMarkPreferred, preferredRows = [] }) => {
  const [carrierSearch, setCarrierSearch] = useState('');
  const [polSearch, setPolSearch] = useState('');
  const [podSearch, setPodSearch] = useState('');
  
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dgFilter, setDgFilter] = useState('ALL');
  const [eqFilter, setEqFilter] = useState('ALL');

  // Aggregate and Sort Data
  const allRates = useMemo(() => {
    let rates = projects.flatMap(p => 
      p.csvData.map(row => normalizeRow(row, p.transportMode))
    );

    // 1. Text Filters
    if (carrierSearch) {
      rates = rates.filter(r => r.carrier.toLowerCase().includes(carrierSearch.toLowerCase()));
    }
    if (polSearch) {
      rates = rates.filter(r => r.pol.toLowerCase().includes(polSearch.toLowerCase()));
    }
    if (podSearch) {
      rates = rates.filter(r => r.pod.toLowerCase().includes(podSearch.toLowerCase()));
    }

    // 2. Type Filter
    if (typeFilter !== 'ALL') {
      rates = rates.filter(r => r.type.includes(typeFilter));
    }

    // 3. Equipment Filter
    if (eqFilter !== 'ALL') {
      rates = rates.filter(r => r.equipment.includes(eqFilter));
    }

    // 4. DG Filter
    if (dgFilter !== 'ALL') {
      const isHaz = dgFilter === 'YES';
      rates = rates.filter(r => r.haz === isHaz);
    }

    // Sort by Price Ascending
    return rates.sort((a, b) => a.price - b.price);
  }, [projects, carrierSearch, polSearch, podSearch, typeFilter, dgFilter, eqFilter]);

  const lowestPrice = allRates.length > 0 ? allRates[0].price : 0;

  const clearFilters = () => {
    setCarrierSearch('');
    setPolSearch('');
    setPodSearch('');
    setTypeFilter('ALL');
    setDgFilter('ALL');
    setEqFilter('ALL');
  };

  // Visual Renderers
  const renderEquipment = (eq: string) => {
    if (eq.includes('20')) {
      return (
        <div className="flex flex-col items-center gap-1" title="20 FT Container">
           <div className="w-8 h-8 bg-blue-100 border-2 border-blue-500 rounded flex items-center justify-center">
             <span className="text-[10px] font-black text-blue-700">20</span>
           </div>
           <span className="text-[9px] font-bold text-slate-400">20FT</span>
        </div>
      );
    }
    if (eq.includes('40')) {
      return (
        <div className="flex flex-col items-center gap-1" title="40 FT Container">
           <div className="w-12 h-8 bg-indigo-100 border-2 border-indigo-500 rounded flex items-center justify-center">
             <span className="text-[10px] font-black text-indigo-700">40</span>
           </div>
           <span className="text-[9px] font-bold text-slate-400">40FT</span>
        </div>
      );
    }
    if (eq.includes('ISO') || eq.includes('TANK')) {
      return (
        <div className="flex flex-col items-center gap-1" title="ISO Tank">
           <div className="w-10 h-8 bg-slate-100 border-2 border-slate-500 rounded-full flex items-center justify-center relative overflow-hidden">
             <div className="w-full h-full bg-slate-200 absolute top-1/2"></div>
             <Cylinder size={14} className="relative z-10 text-slate-700"/>
           </div>
           <span className="text-[9px] font-bold text-slate-400">ISO</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-1">
        <Box className="text-slate-400" />
        <span className="text-[9px] font-bold text-slate-400">GEN</span>
      </div>
    );
  };

  const renderServiceType = (type: string) => {
    const isMLB = type.includes('MLB') || type.includes('LAND') || type.includes('RAIL');
    return (
      <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${isMLB ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-sky-50 border-sky-200 text-sky-700'}`}>
        {isMLB ? <TrainFront size={16} /> : <Ship size={16} />}
        <div className="flex flex-col leading-none">
          <span className="text-[10px] font-black uppercase">{isMLB ? 'MLB' : 'AWS'}</span>
          <span className="text-[8px] opacity-70 font-bold">{isMLB ? 'Land Bridge' : 'All Water'}</span>
        </div>
      </div>
    );
  };

  const ToggleSlider = ({ options, value, onChange, label }: { options: string[], value: string, onChange: (v: string) => void, label: string }) => (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</span>
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1 w-fit">
        {options.map(opt => (
          <button 
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all min-w-[40px] text-center ${value === opt ? 'bg-white shadow-sm text-blue-600 ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* Search Header */}
      <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
              <BadgePercent className="text-emerald-500" /> Global Rate Search
            </h2>
            <p className="text-slate-400 text-sm mt-1">Found {allRates.length} active rates across {projects.length} projects.</p>
          </div>
          <button onClick={clearFilters} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors">
             <XCircle size={14} /> Reset Filters
          </button>
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
           
           {/* Text Inputs */}
           <div className="lg:col-span-3 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Carrier / Line</label>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                 <input 
                   type="text" 
                   className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="e.g. MAERSK"
                   value={carrierSearch}
                   onChange={e => setCarrierSearch(e.target.value)}
                 />
              </div>
           </div>
           
           <div className="lg:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origin (POL)</label>
              <div className="relative">
                 <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                 <input 
                   type="text" 
                   className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="e.g. CNSHA"
                   value={polSearch}
                   onChange={e => setPolSearch(e.target.value)}
                 />
              </div>
           </div>

           <div className="lg:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dest (POD)</label>
              <div className="relative">
                 <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                 <input 
                   type="text" 
                   className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="e.g. USNYC"
                   value={podSearch}
                   onChange={e => setPodSearch(e.target.value)}
                 />
              </div>
           </div>

           {/* Toggles */}
           <div className="lg:col-span-5 flex flex-wrap gap-6 items-end">
              <ToggleSlider 
                label="Rate Type"
                options={['ALL', 'AWS', 'MLB']} 
                value={typeFilter} 
                onChange={setTypeFilter} 
              />
              <ToggleSlider 
                label="Equipment"
                options={['ALL', '20', '40', 'ISO']} 
                value={eqFilter} 
                onChange={setEqFilter} 
              />
              <ToggleSlider 
                label="HazMat"
                options={['ALL', 'YES', 'NO']} 
                value={dgFilter} 
                onChange={setDgFilter} 
              />
           </div>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {allRates.map((rate, idx) => {
          const isLowest = rate.price === lowestPrice && rate.price > 0;
          const isPreferred = preferredRows.some(pr => JSON.stringify(pr) === JSON.stringify(rate.originalRow));
          
          return (
            <div 
              key={idx} 
              className={`group bg-white rounded-3xl p-6 border transition-all hover:shadow-xl relative overflow-hidden ${isLowest ? 'border-emerald-500 shadow-emerald-100 ring-4 ring-emerald-50/50' : isPreferred ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200 hover:border-blue-300'}`}
            >
              {isPreferred && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 z-10"></div>
              )}
              {(isLowest || isPreferred) && (
                <div className="absolute top-0 right-0 flex">
                    {isPreferred && (
                        <div className="bg-emerald-600 text-white text-[10px] font-black uppercase px-4 py-1 rounded-bl-2xl flex items-center gap-1 z-20 shadow-sm">
                            <Star size={12} className="fill-white" /> Preferred
                        </div>
                    )}
                    {isLowest && (
                        <div className="bg-emerald-500 text-white text-[10px] font-black uppercase px-4 py-1 rounded-bl-2xl flex items-center gap-1 z-10">
                            <TrendingDown size={12} /> Best Price
                        </div>
                    )}
                </div>
              )}

              <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12">
                
                {/* 1. Carrier & Mode */}
                <div className="flex items-center gap-4 min-w-[180px]">
                   <div className="relative">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xs border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                         {rate.carrier.substring(0, 4)}
                      </div>
                      {isPreferred && (
                        <div className="absolute -top-2 -left-2 bg-white rounded-full p-1 shadow-md border border-emerald-100">
                           <Crown size={14} className="text-emerald-500 animate-[spin_4s_linear_infinite]" />
                        </div>
                      )}
                   </div>
                   <div>
                      <h3 className="font-black text-slate-800 text-sm tracking-tight">{rate.carrier}</h3>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase mt-1">
                         {rate.mode}
                      </div>
                   </div>
                </div>

                {/* 2. Route Visual */}
                <div className="flex-1 flex items-center gap-4 w-full">
                    <div className="text-right flex-1">
                       <div className="text-xl font-black text-slate-700">{rate.pol}</div>
                       <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-end gap-1">
                          Source <MapPin size={10}/>
                       </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2 px-4">
                        <div className="flex items-center gap-1 text-slate-300">
                           <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                           <div className="w-12 h-0.5 bg-slate-200 group-hover:bg-blue-200 transition-colors"></div>
                           <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        </div>
                        {renderServiceType(rate.type)}
                    </div>

                    <div className="text-left flex-1">
                       <div className="text-xl font-black text-slate-700">{rate.pod}</div>
                       <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <MapPin size={10}/> Destination
                       </div>
                    </div>
                </div>

                {/* 3. Specs: Equipment & Haz */}
                <div className="flex items-center gap-6 border-l border-r border-slate-100 px-6 h-12">
                   {renderEquipment(rate.equipment)}
                   
                   <div className="flex flex-col items-center gap-1" title="Hazardous Material">
                      {rate.haz ? (
                        <>
                           <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 animate-pulse">
                              <AlertTriangle size={16} />
                           </div>
                           <span className="text-[9px] font-bold text-amber-600">HAZMAT</span>
                        </>
                      ) : (
                        <>
                           <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300">
                              <ShieldCheck size={16} />
                           </div>
                           <span className="text-[9px] font-bold text-slate-300">STD</span>
                        </>
                      )}
                   </div>
                </div>

                {/* 4. Price */}
                <div className="text-right min-w-[140px]">
                   <div className={`text-3xl font-black tracking-tighter flex items-center justify-end ${isLowest ? 'text-emerald-600' : 'text-slate-800'}`}>
                      <span className="text-sm font-bold opacity-50 mr-1">$</span>
                      {rate.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                   </div>
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Per {rate.equipment.replace('CONTAINER', '')}
                   </div>
                </div>

              </div>

              {/* Footer Meta */}
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                     <span className="flex items-center gap-1"><Calendar size={12}/> EFF: {rate.effective || 'N/A'}</span>
                     <span className="flex items-center gap-1"><Calendar size={12}/> EXP: {rate.expiry || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                      {onMarkPreferred && !isPreferred && (
                          <button 
                            onClick={() => onMarkPreferred(rate.originalRow)}
                            className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-emerald-100"
                          >
                             <Star size={12} className="fill-emerald-500"/> Mark Preferred
                          </button>
                      )}
                      {isPreferred && (
                          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 px-3 py-1.5">
                             <Check size={12} /> Already Preferred
                          </div>
                      )}
                      <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:underline">
                         View Contract Details <ArrowRight size={12}/>
                      </button>
                  </div>
              </div>

            </div>
          );
        })}

        {allRates.length === 0 && (
           <div className="text-center py-20 text-slate-400">
              <Search size={48} className="mx-auto opacity-20 mb-4" />
              <p className="font-bold">No rates found matching your criteria.</p>
           </div>
        )}
      </div>

    </div>
  );
};

export default RateSearch;
