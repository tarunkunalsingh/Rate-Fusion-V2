import express from 'express';
import fs from 'fs';
import path from 'path';
import { 
  Project, 
  User, 
  MasterDataCategory, 
  LogicProfile, 
  BrandingConfig, 
  SMTPConfig, 
  ServerProfile, 
  IDPConfig, 
  TransmissionLogEntry,
  Tenant
} from '../types.js';
import { 
  RAW_COUNTRIES, 
  RAW_UNLOCODES, 
  DEFAULT_LOGIC_CONFIG, 
  DEFAULT_BRANDING, 
  ENTERPRISE_HTML_TEMPLATE_CREATED, 
  ENTERPRISE_HTML_TEMPLATE_RESET, 
  ENTERPRISE_HTML_TEMPLATE_BACKUP 
} from '../constants.js';

import emailHandler from './email.js';
import proxyHandler from './proxy.js';

const router = express.Router();

// --- PERSISTENCE HELPERS ---
const DB_FILE = path.resolve('db.json');

const loadDB = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load DB:', e);
  }
  return null;
};

const saveDB = (data: any) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to save DB:', e);
  }
};

// --- IN-MEMORY STORAGE (INITIALIZED FROM DB) ---
const initialDB = loadDB() || {};

let projects: Project[] = initialDB.projects || [];
let masterData: MasterDataCategory[] = initialDB.masterData || [
  { id: 'md_countries', name: 'Countries (ISO2)', type: 'LIST', records: [...RAW_COUNTRIES].sort() },
  { id: 'md_unlocodes', name: 'UNLOCODES', type: 'LIST', records: [...RAW_UNLOCODES].sort() }
];
let logicProfiles: LogicProfile[] = initialDB.logicProfiles || [
  { 
    id: 'default', 
    name: 'Standard OTM Logic', 
    isDefault: true, 
    config: DEFAULT_LOGIC_CONFIG,
    variables: {
      'IS_PREFERRED_VAR': '"Y"'
    },
    transmissionSequence: Object.keys(DEFAULT_LOGIC_CONFIG) 
  }
];
let branding: BrandingConfig = initialDB.branding || DEFAULT_BRANDING;
let smtpConfigs: SMTPConfig[] = initialDB.smtpConfigs || [];
let serverProfiles: ServerProfile[] = initialDB.serverProfiles || [];
let users: User[] = initialDB.users || [];
let idpConfigs: IDPConfig[] = initialDB.idpConfigs || [];
let transmissionLogs: TransmissionLogEntry[] = initialDB.transmissionLogs || [];
let tenants: Tenant[] = initialDB.tenants || [];

const syncToDisk = () => {
  saveDB({
    projects,
    masterData,
    logicProfiles,
    branding,
    smtpConfigs,
    serverProfiles,
    users,
    idpConfigs,
    transmissionLogs,
    tenants
  });
};

// Helper to filter by tenant
const filterByTenant = (req: express.Request, data: any[]) => {
  const tenantId = req.query.tenantId as string;
  if (!tenantId || tenantId === 'all') return data;
  return data.filter(item => item.tenantId === tenantId || !item.tenantId);
};

// Tenants
router.get('/tenants', (req, res) => res.json(tenants));
router.post('/tenants', (req, res) => {
  tenants = req.body;
  syncToDisk();
  res.json({ success: true });
});

router.post('/tenants/provision', (req, res) => {
  const { tenant, adminUser } = req.body;
  tenants.push(tenant);
  users.push(adminUser);
  const tenantMasterData: MasterDataCategory[] = [
    { id: `md_countries_${tenant.id}`, name: 'Countries (ISO2)', type: 'LIST', records: [...RAW_COUNTRIES].sort(), tenantId: tenant.id },
    { id: `md_unlocodes_${tenant.id}`, name: 'UNLOCODES', type: 'LIST', records: [...RAW_UNLOCODES].sort(), tenantId: tenant.id }
  ];
  masterData.push(...tenantMasterData);
  const tenantLogicProfile: LogicProfile = { 
    id: `default_${tenant.id}`, 
    name: 'Standard OTM Logic', 
    isDefault: true, 
    config: DEFAULT_LOGIC_CONFIG,
    variables: {
      'IS_PREFERRED_VAR': '"Y"'
    },
    transmissionSequence: Object.keys(DEFAULT_LOGIC_CONFIG),
    tenantId: tenant.id
  };
  logicProfiles.push(tenantLogicProfile);
  syncToDisk();
  res.json({ success: true });
});

// Projects
router.get('/projects', (req, res) => res.json(filterByTenant(req, projects)));
router.post('/projects', (req, res) => {
  const tenantId = req.query.tenantId as string;
  if (tenantId && tenantId !== 'all') {
    projects = [...projects.filter(p => p.tenantId !== tenantId), ...req.body];
  } else {
    projects = req.body;
  }
  syncToDisk();
  res.json({ success: true });
});
router.put('/projects/:id', (req, res) => {
    const idx = projects.findIndex(p => p.id === req.params.id);
    if (idx >= 0) {
        projects[idx] = req.body;
    } else {
        projects.push(req.body);
    }
    syncToDisk();
    res.json({ success: true });
});

// Master Data
router.get('/master-data', (req, res) => res.json(filterByTenant(req, masterData)));
router.post('/master-data', (req, res) => {
  const tenantId = req.query.tenantId as string;
  if (tenantId && tenantId !== 'all') {
    masterData = [...masterData.filter(m => m.tenantId !== tenantId), ...req.body];
  } else {
    masterData = req.body;
  }
  syncToDisk();
  res.json({ success: true });
});

// Logic Profiles
router.get('/logic-profiles', (req, res) => res.json(filterByTenant(req, logicProfiles)));
router.post('/logic-profiles', (req, res) => {
  const tenantId = req.query.tenantId as string;
  if (tenantId && tenantId !== 'all') {
    logicProfiles = [...logicProfiles.filter(l => l.tenantId !== tenantId), ...req.body];
  } else {
    logicProfiles = req.body;
  }
  syncToDisk();
  res.json({ success: true });
});

// Branding
router.get('/branding', (req, res) => res.json(branding));
router.post('/branding', (req, res) => {
  branding = req.body;
  syncToDisk();
  res.json({ success: true });
});

// SMTP
router.get('/smtp', (req, res) => {
  const tenantId = req.query.tenantId as string;
  const config = smtpConfigs.find(s => s.tenantId === tenantId);
  res.json(config || {
    host: '', port: 587, user: '', pass: '', fromEmail: '', enabled: false,
    templates: {
      userCreated: ENTERPRISE_HTML_TEMPLATE_CREATED,
      passwordReset: ENTERPRISE_HTML_TEMPLATE_RESET,
      projectBackup: ENTERPRISE_HTML_TEMPLATE_BACKUP
    },
    tenantId
  });
});
router.post('/smtp', (req, res) => {
  const tenantId = req.query.tenantId as string;
  if (tenantId) {
    smtpConfigs = [...smtpConfigs.filter(s => s.tenantId !== tenantId), { ...req.body, tenantId }];
  }
  syncToDisk();
  res.json({ success: true });
});

// Server Profiles
router.get('/server-profiles', (req, res) => res.json(filterByTenant(req, serverProfiles)));
router.post('/server-profiles', (req, res) => {
  const tenantId = req.query.tenantId as string;
  if (tenantId && tenantId !== 'all') {
    serverProfiles = [...serverProfiles.filter(s => s.tenantId !== tenantId), ...req.body];
  } else {
    serverProfiles = req.body;
  }
  syncToDisk();
  res.json({ success: true });
});

// Users
router.get('/users', (req, res) => res.json(filterByTenant(req, users)));
router.post('/users', (req, res) => {
  const tenantId = req.query.tenantId as string;
  if (tenantId && tenantId !== 'all') {
    users = [...users.filter(u => u.tenantId !== tenantId), ...req.body];
  } else {
    users = req.body;
  }
  syncToDisk();
  res.json({ success: true });
});

// IDP Config
router.get('/idp-config', (req, res) => {
  const tenantId = req.query.tenantId as string;
  const config = idpConfigs.find(i => i.tenantId === tenantId);
  res.json(config || {
    providerName: '', discoveryUrl: '', clientId: '', clientSecret: '', scopes: '', enabled: false, tenantId
  });
});
router.post('/idp-config', (req, res) => {
  const tenantId = req.query.tenantId as string;
  if (tenantId) {
    idpConfigs = [...idpConfigs.filter(i => i.tenantId !== tenantId), { ...req.body, tenantId }];
  }
  syncToDisk();
  res.json({ success: true });
});

// Transmission Logs
router.get('/logs', (req, res) => res.json(filterByTenant(req, transmissionLogs)));
router.post('/logs', (req, res) => {
  const newLog = req.body;
  transmissionLogs = [newLog, ...transmissionLogs];
  syncToDisk();
  res.json({ success: true });
});

// External Services
router.post('/email', emailHandler);
router.post('/proxy', proxyHandler);

export default router;
