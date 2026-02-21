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
  TransmissionLogEntry 
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
let smtpConfig: SMTPConfig = {
  host: '', port: 587, user: '', pass: '', fromEmail: '', enabled: false,
  templates: {
    userCreated: ENTERPRISE_HTML_TEMPLATE_CREATED,
    passwordReset: ENTERPRISE_HTML_TEMPLATE_RESET,
    projectBackup: ENTERPRISE_HTML_TEMPLATE_BACKUP
  }
};
let serverProfiles: ServerProfile[] = [];
let users: User[] = [];
let idpConfig: IDPConfig = {
  providerName: '', discoveryUrl: '', clientId: '', clientSecret: '', scopes: '', enabled: false 
};
let transmissionLogs: TransmissionLogEntry[] = [];

// --- API ROUTES ---

// Projects
app.get('/api/projects', (req, res) => res.json(projects));
app.post('/api/projects', (req, res) => {
  projects = req.body;
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
app.get('/api/master-data', (req, res) => res.json(masterData));
app.post('/api/master-data', (req, res) => {
  masterData = req.body;
  res.json({ success: true });
});

// Logic Profiles
app.get('/api/logic-profiles', (req, res) => res.json(logicProfiles));
app.post('/api/logic-profiles', (req, res) => {
  logicProfiles = req.body;
  res.json({ success: true });
});

// Branding
app.get('/api/branding', (req, res) => res.json(branding));
app.post('/api/branding', (req, res) => {
  branding = req.body;
  res.json({ success: true });
});

// SMTP
app.get('/api/smtp', (req, res) => res.json(smtpConfig));
app.post('/api/smtp', (req, res) => {
  smtpConfig = req.body;
  res.json({ success: true });
});

// Server Profiles
app.get('/api/server-profiles', (req, res) => res.json(serverProfiles));
app.post('/api/server-profiles', (req, res) => {
  serverProfiles = req.body;
  res.json({ success: true });
});

// Users
app.get('/api/users', (req, res) => res.json(users));
app.post('/api/users', (req, res) => {
  users = req.body;
  res.json({ success: true });
});

// IDP Config
app.get('/api/idp-config', (req, res) => res.json(idpConfig));
app.post('/api/idp-config', (req, res) => {
  idpConfig = req.body;
  res.json({ success: true });
});

// Transmission Logs
app.get('/api/logs', (req, res) => res.json(transmissionLogs));
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
