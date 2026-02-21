
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, ServerProfile, MasterDataCategory, XML_TYPES, XmlType, TransformationConfig, LogicProfile, User, TransmissionLogEntry, SMTPConfig } from '../types';
import { 
  Upload, 
  CheckCircle2, 
  FileCode, 
  Send, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Download, 
  Terminal, 
  Database, 
  Search, 
  Save, 
  Check, 
  ListFilter, 
  Calendar, 
  Truck, 
  Building2, 
  Clock, 
  Filter, 
  X,
  Cpu,
  RefreshCw,
  Edit2,
  User as UserIcon,
  Server,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  AlertTriangle,
  LayoutTemplate,
  FileSpreadsheet,
  Link,
  TableProperties,
  ArrowDown,
  ArrowUp,
  Play,
  StopCircle,
  Clock3,
  Globe,
  ShieldAlert,
  Mail
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { convertToXml } from '../services/xmlGenerator';

interface ProjectEditorProps {
  project: Project;
  currentUser: User;
  onSave: (project: Project) => void;
  profiles: ServerProfile[];
  masterData: MasterDataCategory[];
  logicConfig: TransformationConfig;
  logicProfiles: LogicProfile[];
  addLog?: (log: TransmissionLogEntry) => void;
  smtpConfig?: SMTPConfig;
}

// Standard Fields expected by Default Logic
const STANDARD_FIELDS = [
  { key: 'SCAC', label: 'Carrier SCAC', required: true },
  { key: 'POLUNLOCODE', label: 'Origin (POL)', required: true },
  { key: 'PODUNLOCODE', label: 'Destination (POD)', required: true },
  { key: 'Ocean Freight', label: 'Base Rate / Price', required: true },
  { key: 'TYPE', label: 'Service Mode (AWS/MLB)', required: false },
  { key: 'Container Size', label: 'Equipment Size', required: false },
  { key: 'Effective', label: 'Effective Date', required: false },
  { key: 'Expiration', label: 'Expiration Date', required: false },
  { key: 'TransitTime', label: 'Transit Time (Days)', required: false },
  { key: 'DG', label: 'HazMat / DG', required: false },
  { key: 'Currency', label: 'Currency', required: false },
];

function getSimilarityScore(str1: string, str2: string): number {
  str1 = (str1 || "").toLowerCase().replace(/[^a-z0-9]/g, '');
  str2 = (str2 || "").toLowerCase().replace(/[^a-z0-9]/g, '');
  if (str1 === str2) return 100;
  if (str2.includes(str1) || str1.includes(str2)) return 80;
  
  let matches = 0;
  const length = Math.min(str1.length, str2.length);
  for (let i = 0; i < length; i++) if (str1[i] === str2[i]) matches++;
  return (matches / Math.max(str1.length, str2.length)) * 100;
}

const generateMockResponse = (fileName: string) => {
  const transNo = Math.floor(Math.random() * 1000000000);
  return `
<otm:TransmissionAck xmlns:otm="http://xmlns.oracle.com/apps/otm/transmission/v6.4">
    <otm:EchoedTransmissionHeader>
        <otm:TransmissionHeader>
            <otm:ReferenceTransmissionNo>${transNo}</otm:ReferenceTransmissionNo>
            <otm:SenderTransmissionNo>MOCK_${transNo}</otm:SenderTransmissionNo>
            <otm:Status>PROCESSED</otm:Status>
        </otm:TransmissionHeader>
    </otm:EchoedTransmissionHeader>
</otm:TransmissionAck>`;
};

const ProjectEditor: React.FC<ProjectEditorProps> = ({ project, currentUser, onSave, profiles, masterData, logicConfig, logicProfiles, addLog, smtpConfig }) => {
  // Steps: 0=Upload, 1=Mapping, 2=Validation, 3=Conversion/Transmit
  const [step, setStep] = useState<number>(project.csvData.length > 0 ? (project.status === 'converted' || project.status === 'transmitted' ? 3 : 2) : 0);
  
  const [selectedLogicId, setSelectedLogicId] = useState<string>(project.selectedLogicProfileId || logicProfiles.find(p => p.isDefault)?.id || logicProfiles[0]?.id || '');
  
  // Use selected profile to determine initial sequence
  const activeProfile = logicProfiles.find(p => p.id === selectedLogicId);
  const initialSequence = activeProfile?.transmissionSequence || XML_TYPES;
  
  const [selectedXml, setSelectedXml] = useState<XmlType>(initialSequence[0]);
  const [transmitSequence, setTransmitSequence] = useState<string[]>(initialSequence as string[]);
  
  // Selective Transmission State: Map filename -> boolean
  const [checkedFiles, setCheckedFiles] = useState<Record<string, boolean>>(() => {
      const initial: Record<string, boolean> = {};
      (initialSequence as string[]).forEach(f => initial[f] = true);
      return initial;
  });
  
  // Update checked files when sequence changes (e.g. logic profile change)
  useEffect(() => {
      const newChecked = { ...checkedFiles };
      transmitSequence.forEach(f => {
          if (newChecked[f] === undefined) newChecked[f] = true;
      });
      setCheckedFiles(newChecked);
  }, [transmitSequence]);

  // Transmission State
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionLog, setTransmissionLog] = useState<string[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [transmitDelay, setTransmitDelay] = useState<number>(2); // seconds
  const [currentTransmittingFile, setCurrentTransmittingFile] = useState<string | null>(null);
  const [forcePublicProxy, setForcePublicProxy] = useState(false);

  // Validation & Mapping State
  const [validationResults, setValidationResults] = useState<Record<string, string[]>>({});
  const [localXmlContent, setLocalXmlContent] = useState<string>('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({}); // Target -> Source
  const [rawData, setRawData] = useState<any[]>([]); // Data before mapping

  // UI State
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: string } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: string } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [colorFilter, setColorFilter] = useState<'ALL' | 'VALID' | 'ERROR'>('ALL');
  const [activeFilterMenu, setActiveFilterMenu] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [metadataExpanded, setMetadataExpanded] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveFilterMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (project.xmlFiles[selectedXml]) setLocalXmlContent(project.xmlFiles[selectedXml]);
  }, [selectedXml, project.xmlFiles]);

  useEffect(() => { if (step === 2) runValidation(false); }, [project.csvData, project.validationConfig, masterData]);

  // Initial Auto-Map when raw headers change
  useEffect(() => {
    if (rawHeaders.length > 0 && Object.keys(columnMapping).length === 0) {
      const newMap: Record<string, string> = {};
      STANDARD_FIELDS.forEach(field => {
        let bestMatch = '';
        let bestScore = 0;
        
        rawHeaders.forEach(header => {
          const score = getSimilarityScore(field.key, header) + (getSimilarityScore(field.label, header) * 0.5);
          if (score > bestScore && score > 60) {
            bestScore = score;
            bestMatch = header;
          }
        });
        
        // Specific overrides for common logistics terms
        if (!bestMatch) {
            const lowerKey = field.key.toLowerCase();
            if (lowerKey.includes('scac')) bestMatch = rawHeaders.find(h => h.toLowerCase().includes('carrier') || h.toLowerCase().includes('line')) || '';
            if (lowerKey.includes('pol')) bestMatch = rawHeaders.find(h => h.toLowerCase().includes('origin') || h.toLowerCase().includes('load') || h.toLowerCase().includes('from')) || '';
            if (lowerKey.includes('pod')) bestMatch = rawHeaders.find(h => h.toLowerCase().includes('dest') || h.toLowerCase().includes('disch') || h.toLowerCase().includes('to')) || '';
            if (lowerKey.includes('price') || lowerKey.includes('freight')) bestMatch = rawHeaders.find(h => h.toLowerCase().includes('amount') || h.toLowerCase().includes('rate') || h.toLowerCase().includes('cost')) || '';
        }

        if (bestMatch) newMap[field.key] = bestMatch;
      });
      setColumnMapping(newMap);
    }
  }, [rawHeaders]);

  const updateMetadata = (field: keyof Project, value: any) => {
    onSave({
      ...project,
      [field]: value,
      lastEditedBy: currentUser.name,
      updateDate: Date.now()
    });
  };

  const processParsedData = (data: any[]) => {
    if (data && data.length > 0) {
      const headers = Object.keys(data[0]);
      setRawHeaders(headers);
      setRawData(data);
      setStep(1); // Go to Mapping
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true, 
        skipEmptyLines: true,
        complete: (results) => processParsedData(results.data)
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        processParsedData(data);
      };
      reader.readAsBinaryString(file);
    } else {
      alert("Unsupported file format. Please upload CSV or Excel.");
    }
  };

  const applyMapping = () => {
    // Transform rawData based on columnMapping
    const transformedData = rawData.map((row: any) => {
      const newRow: any = {};
      // 1. Map standard fields
      Object.entries(columnMapping).forEach(([target, source]) => {
        if (source && source !== 'IGNORE') {
          newRow[target] = row[source as string];
        }
      });
      // 2. Keep unmapped fields if needed (Optional: currently strictly mapping to standards keeps it clean)
      // We could add a "Pass Through" option later
      return newRow;
    });

    onSave({
      ...project, 
      csvData: transformedData, 
      status: 'draft', 
      xmlFiles: {}, 
      validationConfig: {}, 
      lastEditedBy: currentUser.name, 
      updateDate: Date.now() 
    });
    setStep(2); // Go to Validation
    setColumnFilters({});
    setColorFilter('ALL');
  };

  const handleValidationMapping = (header: string, catId: string) => {
    const newConfig = { ...project.validationConfig };
    if (!catId) delete newConfig[header]; else newConfig[header] = catId;
    onSave({ ...project, validationConfig: newConfig, lastEditedBy: currentUser.name, updateDate: Date.now() });
  };

  const runValidation = (updateStatus: boolean = true) => {
    const errors: Record<string, string[]> = {};
    Object.entries(project.validationConfig).forEach(([header, catId]) => {
      const category = masterData.find(m => m.id === catId);
      if (!category || category.type !== 'LIST') return;
      
      const lowercaseRecords = new Set(category.records.map(r => r.toLowerCase()));
      const invalidRows: string[] = [];
      
      project.csvData.forEach((row: any, idx) => {
        const val = row[header]?.toString().trim().toLowerCase() || "";
        if (!lowercaseRecords.has(val)) {
          invalidRows.push(idx.toString());
        }
      });
      if (invalidRows.length > 0) errors[header] = invalidRows;
    });
    setValidationResults(errors);
    if (updateStatus && Object.keys(errors).length === 0) onSave({ ...project, status: 'validated', lastEditedBy: currentUser.name, updateDate: Date.now() });
  };

  const handleCellEdit = (rowIndex: number, header: string, newValue: string) => {
    const oldValue = project.csvData[rowIndex][header];
    if (oldValue === newValue) return;
    const newData = project.csvData.map((row, idx) => {
      if (idx === rowIndex || row[header] === oldValue) return { ...row, [header]: newValue };
      return row;
    });
    onSave({ ...project, csvData: newData, lastEditedBy: currentUser.name, updateDate: Date.now() });
  };

  const runConversion = () => {
    const selectedLogic = logicProfiles.find(p => p.id === selectedLogicId);
    const configToUse = selectedLogic ? selectedLogic.config : logicConfig;
    const variables = selectedLogic ? selectedLogic.variables : undefined;

    const xmls: Record<string, string> = {};
    const types = Object.keys(configToUse);
    types.forEach(type => {
      xmls[type] = convertToXml(type, project.csvData, configToUse, project, masterData, variables);
    });
    
    // Update sequence from Logic Profile if available
    if (selectedLogic && selectedLogic.transmissionSequence) {
        setTransmitSequence(selectedLogic.transmissionSequence);
    } else {
        setTransmitSequence(types);
    }
    
    onSave({ ...project, xmlFiles: xmls, status: 'converted', selectedLogicProfileId: selectedLogicId, lastEditedBy: currentUser.name, updateDate: Date.now() });
    setStep(3);
  };

  const getSuggestions = (val: string, categoryId: string) => {
    const category = masterData.find(m => m.id === categoryId);
    if (!category || category.type !== 'LIST') return [];
    return category.records
      .map(rec => ({ rec, score: getSimilarityScore(val, rec) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10).map(item => item.rec);
  };

  const filteredData = useMemo(() => {
    return project.csvData.map((row, index) => ({ row, index }))
      .filter(({ row, index }: { row: any; index: number }) => {
        if (colorFilter !== 'ALL') {
          let hasAnyError = false;
          Object.keys(project.validationConfig).forEach(header => {
            if (validationResults[header]?.includes(index.toString())) hasAnyError = true;
          });
          if (colorFilter === 'ERROR' && !hasAnyError) return false;
          if (colorFilter === 'VALID' && (hasAnyError || Object.keys(project.validationConfig).length === 0)) return false;
        }
        for (const [header, activeValues] of Object.entries(columnFilters) as [string, string[]][]) {
          if (activeValues.length > 0 && !activeValues.includes(row[header]?.toString() || '')) {
            return false;
          }
        }
        return true;
      });
  }, [project.csvData, columnFilters, colorFilter, validationResults, project.validationConfig]);

  const getUniqueValues = (header: string): string[] => {
    const values: string[] = project.csvData.map(row => row[header]?.toString() || '');
    return Array.from(new Set(values)).sort();
  };

  const toggleFilterValue = (header: string, value: string) => {
    const current = columnFilters[header] || [];
    const next = current.includes(value) 
      ? current.filter(v => v !== value) 
      : [...current, value];
    setColumnFilters({ ...columnFilters, [header]: next });
  };

  const clearFilter = (header: string) => {
    const next = { ...columnFilters };
    delete next[header];
    setColumnFilters(next);
  };

  const handleSaveXmlEdit = () => {
    setSaveStatus('saving');
    const updatedXmls = { ...project.xmlFiles, [selectedXml]: localXmlContent };
    onSave({ ...project, xmlFiles: updatedXmls, lastEditedBy: currentUser.name, updateDate: Date.now() });
    
    // Simulate save delay and ack
    setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };
  
  const moveSequence = (index: number, direction: 'up' | 'down') => {
      // NOTE: This reordering is local to the transmission session and doesn't affect the Logic Profile configuration.
      const newSeq = [...transmitSequence];
      if (direction === 'up' && index > 0) {
          [newSeq[index], newSeq[index - 1]] = [newSeq[index - 1], newSeq[index]];
      } else if (direction === 'down' && index < newSeq.length - 1) {
          [newSeq[index], newSeq[index + 1]] = [newSeq[index + 1], newSeq[index]];
      }
      setTransmitSequence(newSeq);
  };

  const toggleFileSelection = (fileName: string) => {
      setCheckedFiles(prev => ({ ...prev, [fileName]: !prev[fileName] }));
  };

  const transmitOneFile = async (fileName: string, xmlContent: string, profile: ServerProfile, method: 'PROXY' | 'CORS' | 'DIRECT'): Promise<{ xml: string, status: string, error?: string }> => {
      // NOTE: xmlContent is passed in already processed (variables replaced)
      const authString = btoa(`${profile.username}:${profile.password || ''}`);
      
      try {
          if (method === 'PROXY') {
              // Attempt 1: Serverless Proxy (Vercel)
              const response = await fetch('/api/proxy', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({
                       targetUrl: profile.url,
                       username: profile.username,
                       password: profile.password || '',
                       xmlContent: xmlContent
                   })
               });
               
               if (!response.ok) {
                   if (response.status === 404) throw new Error("Proxy Endpoint Not Found");
                   // Attempt to read detailed JSON error
                   let details = response.statusText;
                   try {
                       const errBody = await response.json();
                       if (errBody.details) details = errBody.details;
                       else if (errBody.error) details = errBody.error;
                   } catch(e) {}
                   
                   if (response.status === 500) throw new Error(`Proxy Internal Error: ${details}`);
                   throw new Error(`Proxy Error ${response.status}: ${details}`);
               }
               
               const text = await response.text();
               return { xml: text, status: `${response.status} OK` };
          } 
          else if (method === 'CORS') {
              // Attempt 2: Public CORS Proxy
              const corsUrl = `https://corsproxy.io/?${encodeURIComponent(profile.url)}`;
              const response = await fetch(corsUrl, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/xml',
                      'Authorization': `Basic ${authString}`
                  },
                  body: xmlContent
              });
              
              if (!response.ok) throw new Error(`CORS Proxy Error ${response.status}: ${response.statusText}`);
              const text = await response.text();
              return { xml: text, status: `${response.status} OK (VIA PUBLIC PROXY)` };
          }
          else {
              // Attempt 3: Direct Fetch
               const response = await fetch(profile.url, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/xml',
                      'Authorization': `Basic ${authString}`
                  },
                  body: xmlContent
              });
              if (!response.ok) throw new Error(`Direct Fetch Error ${response.status}: ${response.statusText}`);
              const text = await response.text();
              return { xml: text, status: `${response.status} OK (DIRECT)` };
          }
      } catch (e: any) {
          return { xml: '', status: 'ERROR', error: e.message };
      }
  };

  const sendProjectBackup = async (profile: ServerProfile, finalTransId: string) => {
      // Send Backup Email via API
      if (!smtpConfig) return;
      
      const template = smtpConfig.templates.projectBackup || 'Project {projectName} completed. Transaction: {transactionId}';
      
      // Basic Interpolation
      const emailBody = template
        .replace(/{projectName}/g, project.name)
        .replace(/{status}/g, 'TRANSMITTED')
        .replace(/{recordCount}/g, project.csvData.length.toString())
        .replace(/{transactionId}/g, finalTransId)
        .replace(/{xmlCount}/g, Object.keys(project.xmlFiles).length.toString());

      setTransmissionLog(prev => [...prev, `>> SENDING BACKUP: Emailing original CSV and XMLs to ${currentUser.email}...`]);
      
      try {
          const response = await fetch('/api/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  to: currentUser.email,
                  subject: `Project Backup: ${project.name}`,
                  html: emailBody,
                  config: smtpConfig
              })
          });
          
          if (response.ok) {
              const resData = await response.json();
              if (resData.status === 'SENT') {
                  setTransmissionLog(prev => [...prev, `>> EMAIL SENT: Backup delivered successfully.`]);
                  
                  // Capture in Transmission Logs
                  if (addLog) {
                      addLog({
                          id: crypto.randomUUID(),
                          timestamp: Date.now(),
                          projectName: project.name,
                          fileName: 'EMAIL_BACKUP',
                          serverName: `SMTP: ${smtpConfig.host}`,
                          status: '200 OK (SENT)',
                          message: `Backup sent to ${currentUser.email}.`,
                          transactionNo: resData.messageId
                      });
                  }
              } else {
                  setTransmissionLog(prev => [...prev, `>> EMAIL SKIPPED: ${resData.message}`]);
              }
          } else {
              setTransmissionLog(prev => [...prev, `!! EMAIL FAILED: Server responded with ${response.status}`]);
          }
      } catch (error: any) {
          setTransmissionLog(prev => [...prev, `!! EMAIL ERROR: ${error.message}`]);
      }
  };

  const handleTransmitSequence = async () => {
    const profile = profiles.find(p => p.id === selectedProfileId);
    if (!profile) return;
    
    setIsTransmitting(true);
    setTransmissionLog([]);
    
    let lastTransactionId = 'N/A';
    const filesToTransmit = transmitSequence.filter(type => checkedFiles[type] && project.xmlFiles[type]);

    if (filesToTransmit.length === 0) {
        setTransmissionLog(['No files selected for transmission.']);
        setIsTransmitting(false);
        return;
    }

    for (const type of filesToTransmit) {
        setCurrentTransmittingFile(type);
        setTransmissionLog(prev => [...prev, `Preparing ${type}.xml...`]);
        await new Promise(resolve => setTimeout(resolve, transmitDelay * 1000));

        // Prepare the XML payload with credentials injected
        let xmlPayload = project.xmlFiles[type];
        
        // Dynamic Credential Injection using regex for robustness
        xmlPayload = xmlPayload
            .replace(/\{USERNAME\}/g, profile.username)
            .replace(/\{PASSWORD\}/g, profile.password || '');
        
        // --- TRANSMISSION STRATEGY ENGINE ---
        let result: { xml: string, status: string, error?: string } = { xml: '', status: '', error: '' };
        
        // Check for MOCK keyword for demos
        if (profile.url === 'MOCK' || profile.url.includes('example.com')) {
             setTransmissionLog(prev => [...prev, `>> Simulating transmission to ${profile.url}...`]);
             result = { xml: generateMockResponse(`${type}.xml`), status: '200 OK (MOCK)' };
        } else {
             // 1. Try Local Proxy (Default) unless forced otherwise
             if (!forcePublicProxy) {
                 setTransmissionLog(prev => [...prev, `>> Attempting Local Proxy for ${type}.xml...`]);
                 result = await transmitOneFile(type, xmlPayload, profile, 'PROXY');
             }

             // 2. If Local Proxy failed or is bypassed, try Public CORS Proxy
             if (forcePublicProxy || result.status === 'ERROR') {
                 if (result.status === 'ERROR') setTransmissionLog(prev => [...prev, `!! Local Proxy Failed (${result.error}). Switching to Public CORS Proxy...`]);
                 else setTransmissionLog(prev => [...prev, `>> Using Public CORS Proxy for ${type}.xml...`]);
                 
                 result = await transmitOneFile(type, xmlPayload, profile, 'CORS');
             }
             
             // 3. If Public Proxy failed, try Direct (Last Resort)
             if (result.status === 'ERROR') {
                 setTransmissionLog(prev => [...prev, `!! Public Proxy Failed (${result.error}). Attempting Direct Connection...`]);
                 result = await transmitOneFile(type, xmlPayload, profile, 'DIRECT');
             }
        }
        
        // Process Result
        if (result.status === 'ERROR') {
             setTransmissionLog(prev => [...prev, `!! FATAL: All transmission methods failed. ${result.error}`]);
        } else {
             // Extract ReferenceTransmissionNo (Preferred) or TransactionNo (Fallback)
             // Handles: <otm:ReferenceTransmissionNo>123</otm:ReferenceTransmissionNo> or <ReferenceTransmissionNo>123</ReferenceTransmissionNo>
             const refMatch = result.xml.match(/<(?:\w+:)?ReferenceTransmissionNo>([^<]+)<\/(?:\w+:)?ReferenceTransmissionNo>/i);
             const transMatch = result.xml.match(/<(?:\w+:)?TransactionNo>([^<]+)<\/(?:\w+:)?TransactionNo>/i);
             
             const id = refMatch ? refMatch[1] : (transMatch ? transMatch[1] : 'UNKNOWN_ID');
             lastTransactionId = id;
            
            setTransmissionLog(prev => [...prev, `<< [${result.status}] ACK Received. Ref ID: ${id}`]);
            
            if (addLog) {
                addLog({
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    projectName: project.name,
                    fileName: `${type}.xml`,
                    serverName: profile.name,
                    status: result.status,
                    transactionNo: id,
                    transmissionId: id,
                    message: `Successfully processed ${type}.xml. ID: ${id}`,
                    rawResponse: result.xml
                });
            }
        }
    }
    
    setCurrentTransmittingFile(null);
    setIsTransmitting(false);
    setTransmissionLog(prev => [...prev, 'Transmission sequence completed.']);
    
    // Trigger Backup
    await sendProjectBackup(profile, lastTransactionId);
    
    onSave({ 
      ...project, 
      status: 'transmitted',
      lastEditedBy: currentUser.name,
      updateDate: Date.now(),
      lastTransmission: {
        serverName: profile.name,
        timestamp: Date.now(),
        user: currentUser.name,
        status: 'COMPLETED'
      }
    });
  };

  const handleStepClick = (newStep: number) => {
    // Navigation Guard Rails
    if (newStep === 0) {
       setStep(0); // Always allow going back to upload
    } else if (newStep === 1) {
       if (rawData.length > 0) setStep(1); // Only if we have raw data
    } else if (newStep === 2) {
       if (project.csvData.length > 0) setStep(2); // Only if mapped
    } else if (newStep === 3) {
       if (project.status === 'converted' || project.status === 'transmitted') setStep(3); // Only if converted
       else if (project.csvData.length > 0) runConversion();
    }
  };

  // Step 0: Upload View
  if (step === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in duration-300">
        <div className="bg-white border border-slate-200 rounded-[40px] p-16 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-50 transition-opacity"></div>
          <div className="w-32 h-32 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-8 relative z-10 shadow-lg shadow-blue-100"><Upload size={56} /></div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase relative z-10">Data Ingestion</h2>
          <p className="text-slate-500 mt-4 text-lg max-w-lg relative z-10">Upload your rate sheet (CSV or Excel). The system will normalize columns and prepare the data for OTM.</p>
          
          <div className="flex gap-4 mt-10 relative z-10">
             <label className="bg-slate-900 hover:bg-black text-white px-10 py-5 rounded-2xl cursor-pointer transition-all font-black text-sm uppercase tracking-widest shadow-xl flex items-center gap-3 transform hover:scale-105">
               <Upload size={20}/> Select File
               <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
             </label>
          </div>
          <div className="mt-4 flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest relative z-10">
            <span className="flex items-center gap-1"><FileCode size={12}/> CSV</span>
            <span className="flex items-center gap-1"><FileSpreadsheet size={12}/> Excel</span>
          </div>
          {project.csvData.length > 0 && (
             <button onClick={() => setStep(2)} className="mt-8 text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center gap-2 relative z-10 hover:underline">
               Resume Previous Session <ArrowRight size={16}/>
             </button>
           )}
        </div>
      </div>
    );
  }

  // Step 1: Mapping View
  if (step === 1) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-6rem)] flex flex-col">
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm shrink-0 mb-6">
             <div className="flex items-center justify-between">
                <div>
                   <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-3">
                     <TableProperties className="text-blue-500" /> Column Mapping
                   </h2>
                   <p className="text-slate-500 text-sm mt-1">Map your file headers (Right) to the System Standard Fields (Left).</p>
                </div>
                <div className="flex gap-3">
                   <button onClick={() => setStep(0)} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs uppercase hover:bg-slate-50">Cancel</button>
                   <button onClick={applyMapping} className="px-8 py-3 rounded-xl bg-blue-600 text-white font-black text-xs uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 flex items-center gap-2">
                     Confirm Mapping <ArrowRight size={16}/>
                   </button>
                </div>
             </div>
          </div>

          <div className="flex-1 flex gap-8 overflow-hidden">
             {/* Mapping List */}
             <div className="w-1/2 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Field</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source Column</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                   {STANDARD_FIELDS.map(field => {
                     const mappedSource = columnMapping[field.key];
                     const isMapped = !!mappedSource && mappedSource !== 'IGNORE';
                     return (
                       <div key={field.key} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isMapped ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex flex-col">
                             <span className="text-sm font-bold text-slate-700">{field.label}</span>
                             <span className="text-[10px] font-mono text-slate-400">{field.key} {field.required && <span className="text-red-400">*</span>}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                             <Link size={14} className={isMapped ? "text-blue-400" : "text-slate-300"} />
                             <select 
                               value={columnMapping[field.key] || ''} 
                               onChange={(e) => setColumnMapping({...columnMapping, [field.key]: e.target.value})}
                               className={`w-48 text-xs font-bold p-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${isMapped ? 'bg-white border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500'}`}
                             >
                                <option value="">-- Select Column --</option>
                                <option value="IGNORE">-- Ignore --</option>
                                {rawHeaders.map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                             </select>
                          </div>
                       </div>
                     );
                   })}
                </div>
             </div>

             {/* Live Preview */}
             <div className="w-1/2 bg-slate-900 rounded-[32px] border border-slate-800 shadow-xl overflow-hidden flex flex-col relative">
                <div className="absolute top-0 right-0 p-6 opacity-20 text-white pointer-events-none"><Terminal size={120}/></div>
                <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm z-10">
                   <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2"><RefreshCw size={14} className="text-emerald-400"/> Data Preview</h3>
                </div>
                <div className="flex-1 overflow-auto p-6 relative z-10 custom-scrollbar">
                   {rawData.slice(0, 3).map((row, idx) => (
                      <div key={idx} className="mb-6 last:mb-0 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                         <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Row {idx + 1} Preview</div>
                         <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {STANDARD_FIELDS.map(field => {
                               const mapped = columnMapping[field.key];
                               const val = mapped && mapped !== 'IGNORE' ? row[mapped] : <span className="text-slate-600 italic">Not Mapped</span>;
                               return (
                                  <div key={field.key} className="flex flex-col">
                                     <span className="text-[9px] text-blue-300 font-mono">{field.key}</span>
                                     <span className="text-xs text-slate-200 font-medium truncate">{val}</span>
                                  </div>
                               );
                            })}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] w-full bg-slate-50">
      {/* Top Bar: Metadata & Actions */}
      <div className="bg-white border-b border-slate-200 shrink-0 z-20 shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><LayoutTemplate size={20}/></div>
                   <div>
                     <input 
                      type="text" 
                      value={project.name}
                      onChange={(e) => updateMetadata('name', e.target.value)}
                      className="text-lg font-black text-slate-800 outline-none bg-transparent placeholder:text-slate-300 w-64"
                      placeholder="Project Name"
                     />
                     <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        <span>{project.csvData.length} Rows</span>
                        <span>•</span>
                        <span>{step === 2 ? 'Validation Mode' : 'Transmission Mode'}</span>
                     </div>
                   </div>
                 </div>
                 
                 {/* Steps Indicator */}
                 <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                    {['Upload', 'Map', 'Validate', 'Transmit'].map((l, i) => (
                      <button 
                        key={i}
                        onClick={() => handleStepClick(i)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${step === i ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        disabled={i > step && i !== 0 && project.csvData.length === 0}
                      >
                        {l}
                      </button>
                    ))}
                 </div>
            </div>

            <div className="flex items-center gap-3">
               <button 
                onClick={() => setMetadataExpanded(!metadataExpanded)}
                className={`p-2 rounded-lg border transition-all ${metadataExpanded ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
                title="Toggle Metadata Panel"
               >
                 {metadataExpanded ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
               </button>
               
               <div className="h-8 w-px bg-slate-200 mx-2"></div>

               {step === 2 && (
                  <button 
                    disabled={Object.keys(validationResults).length > 0} 
                    onClick={runConversion} 
                    className={`px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-wide transition-all shadow-lg ${Object.keys(validationResults).length === 0 ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                  >
                    Generate XML <ArrowRight size={16}/>
                  </button>
               )}
            </div>
        </div>

        {/* Collapsible Metadata Panel */}
        {metadataExpanded && (
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-5 gap-6 animate-in slide-in-from-top-2 duration-200">
             <div className="space-y-1">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Carrier SCAC</label>
               <div className="relative">
                  <Building2 size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={project.carrier} onChange={(e) => updateMetadata('carrier', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500" />
               </div>
             </div>
             <div className="space-y-1">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Transport Mode</label>
               <div className="relative">
                  <Truck size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={project.transportMode} onChange={(e) => updateMetadata('transportMode', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 appearance-none">
                    <option value="OCEAN">OCEAN</option><option value="DRAYAGE">DRAYAGE</option><option value="TL">TRUCK LOAD</option><option value="LTL">LESS THAN TRUCK</option>
                  </select>
               </div>
             </div>
             <div className="space-y-1">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Effective Date</label>
               <div className="relative">
                  <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="date" value={project.effectiveDate} onChange={(e) => updateMetadata('effectiveDate', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500" />
               </div>
             </div>
             <div className="space-y-1">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
               <div className="relative">
                  <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="date" value={project.expiryDate} onChange={(e) => updateMetadata('expiryDate', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500" />
               </div>
             </div>
             <div className="space-y-1">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Logic Strategy</label>
               <div className="relative">
                  <Cpu size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={selectedLogicId} onChange={(e) => setSelectedLogicId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 appearance-none">
                     {logicProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
               </div>
             </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {step === 2 && (
          <div className="h-full flex flex-col">
            {/* Filter / Legend Bar */}
            <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-2">
                 {[
                    { id: 'ALL', label: 'Show All', color: 'bg-slate-400' },
                    { id: 'VALID', label: 'Valid Records', color: 'bg-emerald-500' },
                    { id: 'ERROR', label: 'Errors Found', color: 'bg-red-500' }
                  ].map(f => (
                    <button key={f.id} onClick={() => setColorFilter(f.id as any)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-2 transition-all ${colorFilter === f.id ? 'bg-white border border-slate-200 shadow-sm text-slate-800' : 'text-slate-400 hover:bg-white'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${f.color}`}></div>{f.label}
                    </button>
                  ))}
               </div>
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Showing {filteredData.length} of {project.csvData.length} records
               </div>
            </div>

            {/* Data Grid */}
            <div className="flex-1 overflow-auto bg-white">
              <table className="w-full text-[11px] text-left border-collapse min-w-[1200px]">
                <thead className="bg-slate-50 sticky top-0 z-30 shadow-sm">
                  <tr>
                    {project.csvData.length > 0 && Object.keys(project.csvData[0]).map(h => (
                      <th key={h} className="px-4 py-3 border-b border-r border-slate-200/60 font-black bg-slate-50 w-[200px] min-w-[150px] align-top group">
                        <div className="flex flex-col gap-2">
                          {/* Row 1: Name & Actions */}
                          <div className="flex items-center justify-between text-slate-500 uppercase tracking-tight">
                            <span className="truncate" title={h}>{h}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setActiveFilterMenu(h); setFilterSearch(''); }} className={`p-1 rounded hover:bg-slate-200 ${columnFilters[h]?.length > 0 ? 'text-blue-600' : 'text-slate-400'}`}><Filter size={10}/></button>
                            </div>
                          </div>
                          
                          {/* Row 2: Validation Mapping */}
                          <div className="relative">
                            <select 
                              className={`w-full text-[10px] font-bold border rounded-lg py-1 pl-2 pr-1 outline-none appearance-none transition-colors ${project.validationConfig[h] ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                              value={project.validationConfig[h] || ''}
                              onChange={(e) => handleValidationMapping(h, e.target.value)}
                            >
                              <option value="">-- No Validation --</option>
                              {masterData.filter(c => c.type === 'LIST').map(c => (
                                <option key={c.id} value={c.id}>Map: {c.name}</option>
                              ))}
                            </select>
                            <ChevronDown size={10} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${project.validationConfig[h] ? 'text-blue-400' : 'text-slate-300'}`} />
                          </div>

                          {/* Filter Dropdown */}
                          {activeFilterMenu === h && (
                            <div ref={menuRef} className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 z-[60] p-3 animate-in fade-in zoom-in-95 duration-100">
                                <div className="relative mb-2"><Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"/><input type="text" placeholder="Filter..." className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-7 pr-2 py-1.5 text-[10px] outline-none" value={filterSearch} onChange={e => setFilterSearch(e.target.value)} autoFocus /></div>
                                <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-0.5">
                                  {getUniqueValues(h).filter(v => v.toLowerCase().includes(filterSearch.toLowerCase())).map(val => (
                                    <label key={val} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer"><input type="checkbox" className="w-3 h-3 rounded border-slate-300 text-blue-600" checked={!columnFilters[h] || columnFilters[h].includes(val)} onChange={() => toggleFilterValue(h, val)} /><span className="text-[10px] text-slate-600 truncate">{val || '(Empty)'}</span></label>
                                  ))}
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-100 flex gap-2">
                                  <button onClick={() => clearFilter(h)} className="flex-1 text-[9px] font-bold text-slate-400 hover:text-slate-600">Clear</button>
                                  <button onClick={() => setColumnFilters({...columnFilters, [h]: getUniqueValues(h)})} className="flex-1 text-[9px] font-bold text-blue-600 hover:text-blue-700">Select All</button>
                                </div>
                            </div>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredData.map(({ row, index: originalIdx }) => (
                    <tr key={originalIdx} className="hover:bg-slate-50/80 transition-colors">
                      {Object.keys(row).map((header, vidx) => {
                        const val = row[header] || ''; 
                        const catId = project.validationConfig[header]; 
                        const hasError = validationResults[header]?.includes(originalIdx.toString()); 
                        const isValid = catId && !hasError;
                        const isFocused = focusedCell?.row === originalIdx && focusedCell?.col === header;
                        const isHovered = hoveredCell?.row === originalIdx && hoveredCell?.col === header;
                        
                        return (
                          <td 
                            key={vidx} 
                            className={`relative p-0 border-r border-slate-100 last:border-0 align-top h-[34px] group/cell ${hasError ? 'bg-red-50/30' : ''}`}
                            onMouseEnter={() => setHoveredCell({ row: originalIdx, col: header })}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            <input 
                              type="text" 
                              value={val} 
                              onChange={(e) => handleCellEdit(originalIdx, header, e.target.value)}
                              onFocus={() => setFocusedCell({ row: originalIdx, col: header })}
                              onBlur={(e) => {
                                // Important: Check if relatedTarget is inside our suggestions list
                                // This prevents closing when clicking a suggestion
                                if (!e.relatedTarget || !(e.relatedTarget as HTMLElement).closest('.suggestions-list')) {
                                   setFocusedCell(null);
                                }
                              }}
                              className={`w-full h-full px-4 py-2 bg-transparent outline-none transition-all font-medium truncate text-slate-600 focus:bg-white focus:ring-inset focus:ring-2 focus:ring-blue-500 focus:z-10 ${hasError ? 'text-red-600 font-bold' : isValid ? 'text-emerald-700' : ''}`} 
                            />
                            
                            {/* Error Indicator / Tooltip Trigger */}
                            {hasError && catId && !isFocused && (
                               <div className="absolute top-0 right-0 p-1 pointer-events-none">
                                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                               </div>
                            )}

                            {/* Hover Tooltip (Mouse Over Event Fix) */}
                            {hasError && isHovered && !isFocused && (
                              <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-slate-900 text-white text-[10px] p-2 rounded shadow-xl pointer-events-none">
                                <div className="font-bold flex items-center gap-1 mb-1"><AlertTriangle size={10} className="text-red-400"/> Invalid Value</div>
                                <div className="opacity-80">Value "{val}" not found in {masterData.find(m => m.id === catId)?.name}. Click to fix.</div>
                                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                              </div>
                            )}

                            {/* Editor & Suggestions (LOV) */}
                            {isFocused && hasError && catId && (
                              <div className="suggestions-list absolute left-0 top-full z-[100] mt-1 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 animate-in fade-in zoom-in-95 duration-100">
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2 pt-1 flex items-center justify-between">
                                  <span>Suggestions</span>
                                  <span className="text-blue-500 text-[9px] cursor-pointer" onMouseDown={(e) => {e.preventDefault(); setFocusedCell(null)}}>Close</span>
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                                  {getSuggestions(val, catId).length > 0 ? getSuggestions(val, catId).map(record => (
                                    <button 
                                      key={record} 
                                      onMouseDown={(e) => { 
                                        e.preventDefault(); // Prevents input blur
                                        handleCellEdit(originalIdx, header, record);
                                        setFocusedCell(null); 
                                      }}
                                      className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between group/item transition-colors"
                                    >
                                      <span className="truncate">{record}</span>
                                      <Check size={10} className="text-blue-400 opacity-0 group-hover/item:opacity-100 transition-opacity"/>
                                    </button>
                                  )) : (
                                    <div className="text-[9px] text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg">No matches found.</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="h-full flex flex-col lg:flex-row">
            {/* Sidebar for Step 3: Sequencing & Selection */}
            <div className="w-full lg:w-80 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
               <div className="p-6">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Transmission Sequence</h3>
                 <div className="space-y-2">
                   {transmitSequence.map((type, index) => {
                      if (!project.xmlFiles[type]) return null;
                      const isActive = selectedXml === type;
                      return (
                        <div key={type} className={`w-full text-left px-3 py-2 rounded-xl transition-all border flex items-center justify-between group ${isActive ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50 text-slate-600'}`}>
                          <div className="flex items-center gap-2 truncate flex-1 mr-2">
                              <input 
                                  type="checkbox" 
                                  checked={!!checkedFiles[type]} 
                                  onChange={() => toggleFileSelection(type)}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                              />
                              <button onClick={() => setSelectedXml(type)} className="text-left font-bold text-xs truncate w-full">
                                 {index + 1}. {type}.xml
                              </button>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => moveSequence(index, 'up')} className="p-1 hover:bg-blue-100 rounded text-slate-400 hover:text-blue-600 disabled:opacity-30" disabled={index === 0}><ArrowUp size={12}/></button>
                             <button onClick={() => moveSequence(index, 'down')} className="p-1 hover:bg-blue-100 rounded text-slate-400 hover:text-blue-600 disabled:opacity-30" disabled={index === transmitSequence.length - 1}><ArrowDown size={12}/></button>
                          </div>
                          
                          {currentTransmittingFile === type && (
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-2"></div>
                          )}
                        </div>
                      );
                   })}
                 </div>
               </div>
               
               <div className="mt-auto p-6 border-t border-slate-100 bg-slate-50/50">
                  <div className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transmission Target</label>
                        <select className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 mt-1" value={selectedProfileId} onChange={e => setSelectedProfileId(e.target.value)}>
                            <option value="">Select Profile...</option>
                            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                     </div>

                     <div className="flex items-end gap-2">
                         <div className="flex-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Delay (Sec)</label>
                            <div className="relative mt-1">
                                <Clock3 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="number" 
                                    min="1"
                                    max="60"
                                    value={transmitDelay}
                                    onChange={(e) => setTransmitDelay(parseInt(e.target.value))}
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                         </div>
                     </div>
                     
                     <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg">
                        <input type="checkbox" id="publicProxy" checked={forcePublicProxy} onChange={(e) => setForcePublicProxy(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                        <label htmlFor="publicProxy" className="text-[9px] font-bold text-slate-600 uppercase tracking-wide cursor-pointer flex items-center gap-1">
                            <Globe size={10} /> Force Public Proxy
                        </label>
                     </div>
                     
                     <button 
                        onClick={handleTransmitSequence}
                        disabled={isTransmitting || !selectedProfileId}
                        className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wide transition-all shadow-lg ${isTransmitting || !selectedProfileId ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'}`}
                      >
                        {isTransmitting ? <StopCircle size={16} className="animate-pulse"/> : <Send size={16}/>}
                        {isTransmitting ? 'Sending...' : 'Start Transmission'}
                      </button>
                  </div>
               </div>
            </div>

            {/* XML Editor & Logs */}
            <div className="flex-1 bg-slate-900 flex flex-col overflow-hidden relative">
               <div className="absolute top-0 right-0 p-4 flex gap-2 z-10">
                 <button onClick={handleSaveXmlEdit} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase backdrop-blur-md transition-all flex items-center gap-2 group">
                    <Save size={12}/> 
                    {saveStatus === 'saved' ? <span className="text-emerald-400 animate-in fade-in">Saved!</span> : 'Save Changes'}
                 </button>
                 <button onClick={() => { const b = new Blob([localXmlContent], {type:'text/xml'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href=u; a.download=`${selectedXml}.xml`; a.click(); }} className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg backdrop-blur-md transition-all"><Download size={14}/></button>
               </div>
               
               <div className="flex-1 overflow-hidden p-8">
                  <textarea 
                    className="w-full h-full bg-transparent text-emerald-400 font-mono text-xs leading-relaxed resize-none focus:outline-none custom-scrollbar"
                    spellCheck={false} 
                    value={localXmlContent} 
                    onChange={e => setLocalXmlContent(e.target.value)} 
                  />
               </div>

               {/* Transmission Log Terminal */}
               {transmissionLog.length > 0 && (
                 <div className="h-48 bg-black border-t border-slate-800 p-4 overflow-y-auto font-mono text-[10px] space-y-1">
                    <div className="text-slate-500 uppercase tracking-widest font-black mb-2 flex items-center gap-2"><Terminal size={12}/> Live Log Stream</div>
                    {transmissionLog.map((log, i) => (
                      <div key={i} className={`${log.includes('[200') || log.includes('EMAIL SENT') ? 'text-green-500' : log.includes('>>') ? 'text-blue-400' : log.includes('!!') ? 'text-red-500' : 'text-slate-400'}`}>
                        <span className="text-slate-700 mr-2">[{new Date().toLocaleTimeString()}]</span>{log}
                      </div>
                    ))}
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectEditor;
