import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
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
} from './types';
import { 
  RAW_COUNTRIES, 
  RAW_UNLOCODES, 
  DEFAULT_LOGIC_CONFIG, 
  DEFAULT_BRANDING, 
  ENTERPRISE_HTML_TEMPLATE_CREATED, 
  ENTERPRISE_HTML_TEMPLATE_RESET, 
  ENTERPRISE_HTML_TEMPLATE_BACKUP 
} from './constants';

import emailHandler from './api/email.js';
import proxyHandler from './api/proxy.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for CSV/XML data

// --- IN-MEMORY STORAGE ---
let projects: Project[] = [];
let masterData: MasterDataCategory[] = [
  { id: 'md_countries', name: 'Countries (ISO2)', type: 'LIST', records: [...RAW_COUNTRIES].sort() },
  { id: 'md_unlocodes', name: 'UNLOCODES', type: 'LIST', records: [...RAW_UNLOCODES].sort() }
];
let logicProfiles: LogicProfile[] = [
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
let branding: BrandingConfig = DEFAULT_BRANDING;
let smtpConfigs: SMTPConfig[] = [];
let serverProfiles: ServerProfile[] = [];
let users: User[] = [];
let idpConfigs: IDPConfig[] = [];
let transmissionLogs: TransmissionLogEntry[] = [];
let tenants: Tenant[] = [];

// --- API ROUTES ---

// Helper to filter by tenant
const filterByTenant = (req: express.Request, data: any[]) => {
  const tenantId = req.query.tenantId as string;
  if (!tenantId) return data;
  return data.filter(item => item.tenantId === tenantId || !item.tenantId); // Allow global data
};

// Tenants
app.get('/api/tenants', (req, res) => res.json(tenants));
app.post('/api/tenants', (req, res) => {
  tenants = req.body;
  res.json({ success: true });
});

app.post('/api/tenants/provision', (req, res) => {
  const { tenant, adminUser } = req.body;
  
  // 1. Add Tenant
  tenants.push(tenant);
  
  // 2. Add Admin User
  users.push(adminUser);
  
  // 3. Seed Default Master Data for this tenant
  const tenantMasterData: MasterDataCategory[] = [
    { id: `md_countries_${tenant.id}`, name: 'Countries (ISO2)', type: 'LIST', records: [...RAW_COUNTRIES].sort(), tenantId: tenant.id },
    { id: `md_unlocodes_${tenant.id}`, name: 'UNLOCODES', type: 'LIST', records: [...RAW_UNLOCODES].sort(), tenantId: tenant.id }
  ];
  masterData.push(...tenantMasterData);
  
  // 4. Seed Default Logic Profile for this tenant
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
  
  res.json({ success: true });
});

// Projects
app.get('/api/projects', (req, res) => res.json(filterByTenant(req, projects)));
app.post('/api/projects', (req, res) => {
  const tenantId = req.query.tenantId as string;
  if (tenantId) {
    projects = [...projects.filter(p => p.tenantId !== tenantId), ...req.body.map((p: any) => ({ ...p, tenantId }))];
  } else {
    projects = req.body;
  }
  res.json({ success: true });
});
app.put('/api/projects/:id', (req, res) => {
    const idx = projects.findIndex(p => p.id === req.params.id);
    if (idx >= 0) {
        projects[idx] = req.body;
    } else {
        projects.push(req.body);
    }
    res.json({ success: true });
});

// Master Data
app.get('/api/master-data', (req, res) => res.json(filterByTenant(req, masterData)));
app.post('/api/master-data', (req, res) => {
  const tenantId = req.query.tenantId as string;
  if (tenantId) {
    masterData = [...masterData.filter(m => m.tenantId !== tenantId), ...req.body.map((m: any) => ({ ...m, tenantId }))];
  } else {
    masterData = req.body;
  }
  res.json({ success: true });
});

// Logic Profiles
app.get('/api/logic-profiles', (req, res) => res.json(filterByTenant(req, logicProfiles)));
app.post('/api/logic-profiles', (req, res) => {
  const tenantId = req.query.tenantId as string;
  if (tenantId) {
    logicProfiles = [...logicProfiles.filter(l => l.tenantId !== tenantId), ...req.body.map((l: any) => ({ ...l, tenantId }))];
  } else {
    logicProfiles = req.body;
  }
  res.json({ success: true });
});

// Branding
app.get('/api/branding', (req, res) => res.json(branding)); // Branding is global for now or could be tenant based
app.post('/api/branding', (req, res) => {
  branding = req.body;
  res.json({ success: true });
});

// SMTP
app.get('/api/smtp', (req, res) => {
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
app.post('/api/smtp', (req, res) => {
  const tenantId = req.query.tenantId as string;
  if (tenantId) {
    smtpConfigs = [...smtpConfigs.filter(s => s.tenantId !== tenantId), { ...req.body, tenantId }];
  }
  res.json({ success: true });
});

// Server Profiles
app.get('/api/server-profiles', (req, res) => res.json(filterByTenant(req, serverProfiles)));
app.post('/api/server-profiles', (req, res) => {
  const tenantId = req.query.tenantId as string;
  if (tenantId) {
    serverProfiles = [...serverProfiles.filter(s => s.tenantId !== tenantId), ...req.body.map((s: any) => ({ ...s, tenantId }))];
  } else {
    serverProfiles = req.body;
  }
  res.json({ success: true });
});

// Users
app.get('/api/users', (req, res) => res.json(filterByTenant(req, users)));
app.post('/api/users', (req, res) => {
  const tenantId = req.query.tenantId as string;
  if (tenantId) {
    users = [...users.filter(u => u.tenantId !== tenantId), ...req.body.map((u: any) => ({ ...u, tenantId }))];
  } else {
    users = req.body;
  }
  res.json({ success: true });
});

// IDP Config
app.get('/api/idp-config', (req, res) => {
  const tenantId = req.query.tenantId as string;
  const config = idpConfigs.find(i => i.tenantId === tenantId);
  res.json(config || {
    providerName: '', discoveryUrl: '', clientId: '', clientSecret: '', scopes: '', enabled: false, tenantId
  });
});
app.post('/api/idp-config', (req, res) => {
  const tenantId = req.query.tenantId as string;
  if (tenantId) {
    idpConfigs = [...idpConfigs.filter(i => i.tenantId !== tenantId), { ...req.body, tenantId }];
  }
  res.json({ success: true });
});

// Transmission Logs
app.get('/api/logs', (req, res) => res.json(filterByTenant(req, transmissionLogs)));
app.post('/api/logs', (req, res) => {
  const newLog = req.body;
  transmissionLogs = [newLog, ...transmissionLogs];
  res.json({ success: true });
});

// External Services
app.post('/api/email', emailHandler);
app.post('/api/proxy', proxyHandler);


// --- VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static files from dist
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    
    // SPA Fallback
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
