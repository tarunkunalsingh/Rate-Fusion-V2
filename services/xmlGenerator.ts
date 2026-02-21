
import { XmlType, TransformationConfig, Project, MasterDataCategory } from '../types';

const USER_EMAIL = "ADMIN.WEGO"; 

/**
 * Enhanced Date Formatter with Autocasting capabilities.
 * Supports various input types and ensures OTM-compliant date strings.
 * Updates: Returns empty string for null/empty inputs to preserve data integrity.
 */
const formatOTMDate = (input: any, short: boolean = false) => {
  if (input === undefined || input === null || input === "") {
    return "";
  }

  const strInput = String(input).trim();
  // Regex to detect if already in OTM format (14 digits) or Short OTM (8 digits)
  if (/^\d{8}$|^\d{14}$/.test(strInput)) {
    return short ? strInput.substring(0, 8) : strInput.padEnd(14, '0');
  }

  const d = new Date(input);
  if (isNaN(d.getTime())) {
    return "";
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const full = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return short ? full.substring(0, 8) : full;
};

/**
 * Helper to parse a date string that might already be in OTM format YYYYMMDD...
 * into a JS Date object.
 */
const parseDate = (input: string): Date | null => {
    if (!input) return null;
    const str = String(input).trim();
    
    // Handle OTM Format YYYYMMDD...
    if (/^\d{8,14}$/.test(str)) {
        const y = parseInt(str.substring(0, 4));
        const m = parseInt(str.substring(4, 6)) - 1; // JS months are 0-indexed
        const d = parseInt(str.substring(6, 8));
        return new Date(y, m, d);
    }
    
    // Handle Standard Date Strings
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

/**
 * Advanced Recursive Resolver with Smart Type Casting and Conditional Logic.
 */
export const resolveFormula = (
  formula: string, 
  row: any, 
  project?: Project, 
  masterData?: MasterDataCategory[], 
  variables?: Record<string, string>
): string => {
  let result = formula;

  // 1. Iteratively Resolve User Variables/Constants ($VAR_NAME)
  // Allows variables to reference other variables (nested resolution)
  if (variables) {
      let modified = true;
      let iterations = 0;
      while (modified && iterations < 5) {
          iterations++;
          const prev = result;
          result = result.replace(/\$([a-zA-Z0-9_]+)/g, (_, varName) => {
              // If variable exists, substitute it. Otherwise keep as is (literal $VAR).
              return variables[varName] !== undefined ? variables[varName] : `$${varName}`;
          });
          if (prev === result) modified = false;
      }
  }

  // 2. Resolve basic column variables {COL}
  // This must happen after variable expansion so that variables can contain {COL} references
  result = result.replace(/\{([^}]+)\}/g, (_, content) => {
    const parts = content.split('||').map((p: string) => p.trim());
    const colName = parts[0];
    const fallback = parts[1] || "";
    
    // Explicitly handle 0 as a valid value
    if (row[colName] !== undefined && row[colName] !== null && row[colName] !== "") return String(row[colName]);
    
    const insensitiveKey = Object.keys(row).find(k => k.toLowerCase() === colName.toLowerCase());
    if (insensitiveKey && row[insensitiveKey] !== undefined && row[insensitiveKey] !== null && row[insensitiveKey] !== "") {
      return String(row[insensitiveKey]);
    }
    
    return fallback;
  });

  // 3. Resolve Global System Constants
  if (project) {
    const eff = formatOTMDate(project.effectiveDate);
    const exp = formatOTMDate(project.expiryDate);
    result = result.replace(/\bPROJECT_EFF\b/g, eff || '20250101000000');
    result = result.replace(/\bPROJECT_EXP\b/g, exp || '20251231000000');
  }
  result = result.replace(/\bSYSDATE\b/g, formatOTMDate(Date.now()));
  
  if (row._index !== undefined) {
    result = result.replace(/\bSEQ\b/g, (row._index + 1).toString());
  }

  // 4. Recursive Function Resolver
  const evaluateFunctions = (input: string): string => {
    // Added TO_STRING, TO_NUMBER, TO_DATE
    const funcRegex = /\b(UPPER|LOWER|CONCAT|SUBSTR|DATE|DATE_SHORT|ADD_DAYS|FORMAT_DATE|SUM|SUB|MUL|DIV|XID|IF|LOOKUP|TO_STRING|TO_NUMBER|TO_DATE)\(([^()]*)\)/g;
    const parenRegex = /\(([^()]*)\)/g;
    
    let current = input;
    let modified = true;
    let iterations = 0;
    
    while (modified && iterations < 15) {
      iterations++;
      let next = current.replace(funcRegex, (match, func, args) => {
        // Split args by comma, but handle commas inside quotes
        const argArray: string[] = [];
        let currentArg = "";
        let inQuotes = false;
        let quoteChar = "";

        for (let i = 0; i < args.length; i++) {
            const char = args[i];
            if ((char === '"' || char === "'") && (i === 0 || args[i-1] !== '\\')) {
                if (!inQuotes) {
                    inQuotes = true;
                    quoteChar = char;
                } else if (char === quoteChar) {
                    inQuotes = false;
                }
                currentArg += char;
            } else if (char === ',' && !inQuotes) {
                argArray.push(currentArg.trim());
                currentArg = "";
            } else {
                currentArg += char;
            }
        }
        argArray.push(currentArg.trim());

        const val1 = argArray[0];

        switch (func) {
          case 'LOOKUP': {
            const lookupValue = String(val1 || "");
            let tableName = argArray[1] || "";
            tableName = tableName.replace(/^['"]|['"]$/g, '');
            
            if (!masterData) return lookupValue;

            const table = masterData.find(m => m.name === tableName || m.id === tableName);
            if (!table || table.type !== 'KEY_VALUE' || !table.dataMap) return lookupValue;

            return table.dataMap[lookupValue] || lookupValue;
          }
          case 'IF':
            const condition = val1;
            if (condition.includes('==')) {
              const [l, r] = condition.split('==').map(s => s.trim());
              return l === r ? (argArray[1] || "") : (argArray[2] || "");
            } else if (condition.includes('!=')) {
              const [l, r] = condition.split('!=').map(s => s.trim());
              return l !== r ? (argArray[1] || "") : (argArray[2] || "");
            }
            // Basic truthy check
            return condition && condition !== "false" && condition !== "0" && condition !== "" ? (argArray[1] || "") : (argArray[2] || "");
          case 'UPPER': return String(val1 || "").toUpperCase();
          case 'LOWER': return String(val1 || "").toLowerCase();
          case 'CONCAT': return argArray.map(a => String(a)).join('');
          case 'SUBSTR': 
            const str = String(val1 || "");
            const start = parseInt(argArray[1]) || 0;
            const len = argArray[2] ? (parseInt(argArray[2]) || 0) : undefined;
            return str.substring(start, len !== undefined ? start + len : undefined);
          case 'DATE': return formatOTMDate(val1, false);
          case 'DATE_SHORT': return formatOTMDate(val1, true);
          case 'ADD_DAYS': {
             const dateVal = parseDate(val1);
             const daysToAdd = parseInt(argArray[1]) || 0;
             if (!dateVal) return "";
             dateVal.setDate(dateVal.getDate() + daysToAdd);
             return formatOTMDate(dateVal, false);
          }
          case 'FORMAT_DATE': {
             const dateVal = parseDate(val1);
             if (!dateVal) return "";
             let fmt = argArray[1] || "YYYY-MM-DD";
             fmt = fmt.replace(/^['"]|['"]$/g, ''); // Remove quotes
             
             const pad = (n: number) => n.toString().padStart(2, '0');
             const yyyy = dateVal.getFullYear();
             const mm = pad(dateVal.getMonth() + 1);
             const dd = pad(dateVal.getDate());
             const hh = pad(dateVal.getHours());
             const min = pad(dateVal.getMinutes());
             const ss = pad(dateVal.getSeconds());
             
             return fmt
                .replace('YYYY', yyyy.toString())
                .replace('MM', mm)
                .replace('DD', dd)
                .replace('HH', hh)
                .replace('MI', min)
                .replace('SS', ss);
          }
          case 'SUM': return argArray.reduce((acc, val) => acc + (parseFloat(val) || 0), 0).toString();
          case 'SUB': return argArray.map(v => parseFloat(v) || 0).reduce((acc, val) => acc - val).toString();
          case 'MUL': return argArray.reduce((acc, val) => acc * (parseFloat(val) || 0), 1).toString();
          case 'DIV': 
            const divisor = parseFloat(argArray[1]);
            return divisor !== 0 ? (parseFloat(val1) / divisor).toString() : "0";
          case 'XID':
            const xidVal = String(val1 || "");
            return xidVal.includes('.') ? xidVal.split('.').slice(1).join('.') : xidVal;
            
          // New Casting Functions
          case 'TO_STRING': return String(val1 || "");
          case 'TO_NUMBER': return (parseFloat(String(val1).replace(/[^0-9.-]+/g,"")) || 0).toString();
          case 'TO_DATE': return formatOTMDate(val1, false);
            
          default: return match;
        }
      });

      // Fallback: Resolve parentheses that aren't functions (e.g. nested grouping)
      if (next === current) {
          next = current.replace(parenRegex, (_, content) => content);
      }
      
      if (next === current) modified = false;
      current = next;
    }
    return current;
  };

  return evaluateFunctions(result);
};

const minify = (xml: string) => xml.replace(/>\s+</g, '><').trim();

export const convertToXml = (
    type: XmlType, 
    data: any[], 
    config: TransformationConfig, 
    project?: Project, 
    masterData?: MasterDataCategory[],
    variables?: Record<string, string>
): string => {
  const sheetConfig = config[type];
  if (!sheetConfig) return "";

  const columnList = sheetConfig.fields.map(f => f.name).join(',');
  
  const rows: string[] = [];
  
  data.forEach((row, idx) => {
    const rowWithIdx = { ...row, _index: idx };
    const values = sheetConfig.fields.map(field => {
      let val = resolveFormula(field.formula, rowWithIdx, project, masterData, variables);
      // Escape quotes in content
      if (typeof val === 'string' && val.includes('"')) val = val.replace(/"/g, '""');
      // Quote if comma exists
      if (typeof val === 'string' && val.includes(',')) val = `"${val}"`;
      return val;
    });

    const rowString = values.join(',');
    rows.push(`<otm:CsvRow>${rowString}</otm:CsvRow>`);
  });

  // Updated Structure based on user requirement
  // Includes 'gtm' namespace, specific CsvCommand, and SQL Session Alter Row
  const innerContent = `
<otm:CSVDataLoad>
<otm:CsvCommand>IU</otm:CsvCommand>
<otm:CsvTableName>${sheetConfig.tableName}</otm:CsvTableName>
<otm:CsvColumnList>${columnList}</otm:CsvColumnList>
<otm:CsvRow>EXEC SQL ALTER SESSION SET NLS_DATE_FORMAT = 'YYYYMMDDHH24MISS'</otm:CsvRow>
${rows.join('')}
</otm:CSVDataLoad>`;

  const finalXml = `
<otm:Transmission xmlns:otm="http://xmlns.oracle.com/apps/otm/transmission/v6.4" xmlns:gtm="http://xmlns.oracle.com/apps/gtm/transmission/v6.4">
<otm:TransmissionHeader>
<otm:UserName>{USERNAME}</otm:UserName>
<otm:Password>{PASSWORD}</otm:Password>
<otm:IsProcessInSequence>Y</otm:IsProcessInSequence>
</otm:TransmissionHeader>
<otm:TransmissionBody>
<otm:GLogXMLElement>
${innerContent}
</otm:GLogXMLElement>
</otm:TransmissionBody>
</otm:Transmission>`;
  
  return minify(finalXml);
};
