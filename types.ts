
export interface User {
  id: string;
  name: string;
  nickname?: string;
  avatarUrl?: string;
  email: string;
  authType: 'SSO' | 'BASIC';
  role: 'ADMIN' | 'USER';
  password?: string;
}

export interface IDPConfig {
  providerName: string;
  discoveryUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string;
  enabled: boolean;
}

export interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
  enabled: boolean;
  templates: {
    userCreated: string;
    passwordReset: string;
    projectBackup: string;
  };
}

export type ThemeColor = 'blue' | 'indigo' | 'emerald' | 'slate' | 'violet';
export type BrandIcon = 'Box' | 'Globe' | 'Hexagon' | 'Ship' | 'Anchor' | 'Zap';

export interface BrandingConfig {
  portalName: string;
  adminEmail: string;
  themeColor: ThemeColor;
  icon: BrandIcon;
  loginMessage: string;
  footerText: string;
  loginBackgroundUrl?: string;
  logoUrl?: string;
}

export interface ServerProfile {
  id: string;
  name: string;
  url: string;
  username: string;
  password?: string;
  type: 'SOAP' | 'REST';
}

export interface MasterDataCategory {
  id: string;
  name: string;
  type: 'LIST' | 'KEY_VALUE'; // Distinguished type
  records: string[]; // Used for LIST validation
  dataMap?: Record<string, string>; // Used for KEY_VALUE lookups
}

export type TransportMode = 'OCEAN' | 'DRAYAGE' | 'TL' | 'LTL';

export type FieldDataType = 'STRING' | 'NUMBER' | 'DATE';

export interface XMLField {
  id: string;
  name: string;
  formula: string;
  dataType?: FieldDataType;
}

export interface XMLSheetConfig {
  tableName: string;
  fields: XMLField[];
}

export type TransformationConfig = Record<string, XMLSheetConfig>;

export interface LogicProfile {
  id: string;
  name: string;
  isDefault: boolean;
  config: TransformationConfig;
  variables?: Record<string, string>; // User defined constants/variables
  transmissionSequence?: string[]; // Defines the order of XML generation and transmission
}

export interface TransmissionLogEntry {
  id: string;
  timestamp: number;
  projectName: string;
  fileName: string;
  serverName: string;
  status: string; // e.g., '200 OK', '401 Unauthorized'
  transactionNo?: string;
  transmissionId?: string; // New field for OTM REST status check
  otmStatus?: any; // To store the REST response JSON
  message: string;
  rawResponse?: string;
}

export interface Project {
  id: string;
  name: string;
  carrier: string;
  transportMode: TransportMode;
  effectiveDate: string;
  expiryDate: string;
  insertDate: number;
  updateDate: number;
  createdAt: number;
  createdBy: string;         // Audit: Creator
  lastEditedBy: string;      // Audit: Last Editor
  lastTransmission?: {       // Audit: Transmission Log
    serverName: string;
    timestamp: number;
    user: string;
    status: string;
  };
  csvData: any[];
  xmlFiles: Record<string, string>; // map of fileType -> xmlContent
  status: 'draft' | 'validated' | 'converted' | 'transmitted';
  validationConfig: Record<string, string>; // map of csvHeader -> masterDataCategoryId
  selectedLogicProfileId?: string; // Track which logic was used
}

// Kept for initial default generation, but Logic Editor now supports dynamic keys
export const XML_TYPES = [
  'RATE_GEO',
  'RATE_GEO_COST',
  'RATE_GEO_COST_GROUP',
  'RATE_OFFERING',
  'RATE_SERVICE',
  'SERVICE_TIME',
  'X_LANE'
] as const;

export type XmlType = string;
