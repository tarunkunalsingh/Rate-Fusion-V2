import { BrandingConfig, TransformationConfig } from './types';

export const RAW_COUNTRIES = `TZ,RE,MM,CH,PK,IE,UG,NL,BS,CR,NC,TM,GY,HN,PE,PT,GR,IM,GL,CN,UA,FJ,HK,FI,AG,WF,GM,TN,PF,DZ,CL,BL,BW,CG,AW,KE,MC,MG,GU,SK,GT,AS,MZ,RO,VU,IQ,ZA,AE,MU,LU,MT,HT,KI,FM,ID,AR,AZ,BH,LB,LK,SE,CO,BN,JM,KZ,BG,BD,LR,NG,VE,HR,NO,RS,EE,LC,SA,MA,JO,UY,HU,KY,SX,BQ,VI,GP,TW,ES,TG,QA,EG,PA,MY,PL,PR,DE,DO,SV,SC,SR,JP,PY,AT,VC,MX,BJ,JE,CU,CY,BO,BM,CI,GQ,DK,TO,SG,PM,GN,FR,KH,KM,IR,CW,TV,ME,SL,IL,ER,RU,YE,LY,GE,GF,SN,US,GH,PW,SD,MQ,BA,TT,IT,AL,AO,CV,FK,KN,TR,VG,KW,LT,DJ,IN,KR,TH,NZ,AI,SO,EC,BZ,DM,BB,GW,GB,AU,WS,MV,BR,LI,MR,GD,OM,PH,CM,CA,BE,SI,PG,SH,NA,CD,SB,MH,VN,GI,LV,GA,GG,CZ,IS,FO`.split(',').map(s => s.trim()).filter(Boolean);

export const RAW_UNLOCODES = `UYJIT,UYPDP,UYPIR,NOSOM,NOSPG,TRTEK,THPKN,THSRI,TMKRW,TNSFA,TRADY,NOTAV,NOULS,NZMAP,NZPRR,NZWKW,PACTB,PEPMC,TRIZT,TRKFZ,TRZEY,TTCHA,PHGES,USBII,USBLI,USDUT,USFPO,PLWLA,PRHUC,PTAGS,USGLS,USHOM,USMEM,USMES,PTFDF,PTPRV,PWROR,USMF8,USMHH,USMJK,USMXH,RUKOZ,RULED,USNTD,USOGG,USOV3,USOW4,USPAE,USPAH,USPAU,USPCR,USPQI,USPWT,USSBA,USSBM,RUVYG,RUVYS,SAKAC,SARAR,USSOV,USTOL,USUIN,USVAN,SEHLD,SEKAN,SEKAR,SEKSD,SELDK,SELYS,SESDL,USVNT,USWRV,USYAS,USYVI,SEYST,SHSHN,SNDKR,BGVAR,BHGBQ,BNMUA,BRFOR,BRIOS,BRNVT,BRSAN,BRSSA,BRTUB,CACOC,CAMHN,CAPRR,CABKF,CNPDG,HUDEB,CASDY,USIPS,USPCI,USPEF,CNCZX,DZALG,AUBNE,CATWS,CAUCL,USELS,USOAK,IDCIN,AEAJM,AEAMF,AESHJ,AOLOB,AOMAL,AREEA,GBIMM,LRGRE,TREYP,TWKEL,UAODS,USPWM,MXAVD,KRSEL,ARCMP,ARROS,CNNTG,BRRIO,USMOB,USCHS,ATLNZ,AUABP,AUBEL,AUCRU,NOEKF,ESVLC,AUGEX,AUHLR,AUHTI,AUNWP,AUPWL,AUSYD,NGTIN,USBNA,AUZBO,AWAUA,BDMGL,BEBRU,BENIE,VCKTN,VISTT,VNCMT,VNDAD,VNHON,ZAELS,NLAPN,NLBEV,NLBRD,NLDFT,JMOCJ,JPANE,JPFNB,JPHHR,NLGIB,NLHAG,JPHIB,JPHIC,JPHRM,JPIMB,JPKIJ,JPKKJ,JPKND,JPKNU,JPKNZ,ITBRI,ITCNT,JPKOK,NLKRP,NLLMU,NLLZA,NOHEY,NOHRD,JPKZU,JPNAO,JPNAZ,JPOTK,JPSAG,JPSBS,JPSMJ,JPSMN,JPSMT,JPTBT,JPTOS,JPTRG,NLSTA,NLVLI,JPUKB,NOKOP,NOMJF,KHKOS,KMYVA,KRCHF,KRHAS,KRKUV,KZKUR,LCVIF,LUMRT,NLWRT,NLZWS,NOBOO,MCMON,MTMAR,MTMGR,MXBDN,MXCME,MXCOA,MXMRE,MXPVR,MXRST,MXSRL,MXTJT,MXTUX,MXVNR,NOELN,NOFLE,NOFLO,NOFNE,NLMLR,NLORJ,NLPER,NLPTK,MYMYY,MYTGG,MYTRB,MYTWU,MZMAT,NGPHC,ITPIO,ITSPE,CLIQQ,CNBHY,CNCWN,GQSSG,GRALO,GRCFU,GRHER,DEPEF,DESTL,DEWIF,DKCPH,FRIRK,FRLC5,FROXA,DKFDH,DKGED,DKHVS,DKKAL,DKKOL,DKRAN,DKRNN,GRLRY,GRMJT,GRPKE,GRSYS,GRVOL,GTPBR,GYNAM,DZBJA,FRRZN,FRSNR,FRURO,FRXBD,GAGAX,CNHUI,CNLSN,ECBAQ,ECESM,ECLLD,EEBEK,EESLM,EEVIR,EGADA,INRTC,IRSXI,CNQDG,CNSHK,CNSWA,CNTAG,CNWEI,CNXIZ,GBAYR,GBCST,IDAMQ,IDBKS,IDBLW,IDBXT,IDCBN,ESADR,ESCEU,GBEYM,GBFAW,GBGRK,GBGSY,GBHPT,ESDNA,ESFRO,ESLEI,ESLPA,ESMLN,ESPNL,ISDRA,ISRAU,CNYTG,IDKHY,IDKOE,IDKRG,IDPNJ,IDSRI,IDSTU,IDTAB,IDTBR,IDTTE,ESQFU,ESSCR,ESTOR,ESZJR,FIKNA,FIMHQ,HRDBV,HROMI,HRVUK,COCVE,CRCAL,CVPON,GBMID,IEHOW,IEKLN,IEORK,IERIN,ILETH,INBOM,INCCU,FITKU,GBPSB,GBPTL,GBTIL,GBTNM,CYVAS,DEBON,DEBOT,FJVUD,FOKVI,FOLVK,FRBAY,FRCER,DEEME,DEHEE,DEHGL,GBWOR,GBWTB,GFDDC,GHTEM,GLJHS,INKAK,DEHRN,DEKRE,DELNU,DEMAG,DENDT,DENHL,USCAE,USLAS,GBMHT,USACW,NLPAP,USOHA,HKG,MXAIQ,PLWAW,NONHS,NONZC,NOPOR,NOSLX,TRALA,NOSRV,NOTRD,NOVST,NZLYT,NZPOE,NZWLG,OMSOH,PAPBM,PEPIO,PGMAG,TRALI,TRBAK,TTPOS,TWTPE,UAILK,UAMPW,PGVAI,PHDVO,PHILO,PHTAG,PLGDY,PLKOL,USADQ,USFOC,USFVH,USGM3,USHNL,USMEZ,PTCNL,PTPRM,PYTER,PYVLL,ROBRA,USMH2,USMI3,ROMAG,RUKOR,RUMMK,RUPGN,RUPKC,USNSS,USOUX,USPIA,USPLL,USPLQ,RUSOC,USPRY,USRAI,USSKY,RUULU,RUVNN,RUVVO,USSPT,SEHKL,SELAA,SELAT,SENYN,USXFP,USYVO,SEVAN,BHKBS,BJCOO,BNKUB,BRPCL,BRSFS,BRVIX,BSMHH,CACBK,CACMS,CALOP,CAPBQ,CAPHW,KRPUS,ESVLG,GBNRK,CAPHY,CAQUE,ITAOI,CNTSN,DEHAM,COMAM,MXMTY,EGAIS,CNNSA,TRKUM,SGSIN,THBKK,CAVAN,CAWED,CISPY,CLCBC,USF8H,AEFJR,MXQRO,USIP2,MYLBU,ARUSH,ARVDM,USSCK,AUADL,AUALH,AUBTB,AUCNS,AUFLS,AUFOT,AUGET,BEANR,CNZSN,AUGTE,AUHPL,AUMEL,USSAV,USTPA,DECGN,YEMKX,FRCL6,USM7O,AUWEP,AUWYA,BDCGP,BECRL,BEVIV,BEWTH`.split(',').map(s => s.trim()).filter(Boolean);

export const DEFAULT_LOGIC_CONFIG: TransformationConfig = {
  'RATE_GEO': { tableName: 'RATE_GEO', fields: [
    { id: 'rg1', name: 'RATE_GEO_GID', formula: 'WEGO.{SCAC}_{POLUNLOCODE}_{PODUNLOCODE}_{TYPE || OCEAN}', dataType: 'STRING' },
    { id: 'rg2', name: 'RATE_GEO_XID', formula: '{SCAC}_{POLUNLOCODE}_{PODUNLOCODE}_{TYPE || OCEAN}', dataType: 'STRING' },
    { id: 'rg3', name: 'RATE_OFFERING_GID', formula: 'WEGO.{SCAC}_{TYPE || OCEAN}', dataType: 'STRING' },
    { id: 'rg4', name: 'X_LANE_GID', formula: 'WEGO.{TYPE || OCEAN}_{POLUNLOCODE}_{PODUNLOCODE}', dataType: 'STRING' },
    { id: 'rg5', name: 'EFFECTIVE_DATE', formula: 'PROJECT_EFF', dataType: 'DATE' },
    { id: 'rg6', name: 'EXPIRATION_DATE', formula: 'PROJECT_EXP', dataType: 'DATE' },
    { id: 'rg7', name: 'IS_ACTIVE', formula: '"Y"', dataType: 'STRING' },
    { id: 'rg8', name: 'DOMAIN_NAME', formula: '"WEGO"', dataType: 'STRING' }
  ]},
  'RATE_GEO_COST': { tableName: 'RATE_GEO_COST', fields: [
    { id: 'rgc1', name: 'RATE_GEO_COST_GID', formula: 'WEGO.{SCAC}_{POLUNLOCODE}_{PODUNLOCODE}_{TYPE || OCEAN}_BASE', dataType: 'STRING' },
    { id: 'rgc2', name: 'RATE_GEO_COST_XID', formula: '{SCAC}_{POLUNLOCODE}_{PODUNLOCODE}_{TYPE || OCEAN}_BASE', dataType: 'STRING' },
    { id: 'rgc3', name: 'RATE_GEO_GID', formula: 'WEGO.{SCAC}_{POLUNLOCODE}_{PODUNLOCODE}_{TYPE || OCEAN}', dataType: 'STRING' },
    { id: 'rgc4', name: 'AMOUNT', formula: '{Ocean Freight}', dataType: 'NUMBER' },
    { id: 'rgc5', name: 'CHARGE_UNIT_COUNT', formula: '"1"', dataType: 'NUMBER' },
    { id: 'rgc6', name: 'CHARGE_UNIT_UOM', formula: '"SHIPMENT"', dataType: 'STRING' },
    { id: 'rgc7', name: 'COST_TYPE', formula: '"B"', dataType: 'STRING' },
    { id: 'rgc8', name: 'DOMAIN_NAME', formula: '"WEGO"', dataType: 'STRING' }
  ]},
  'RATE_GEO_COST_GROUP': { tableName: 'RATE_GEO_COST_GROUP', fields: [
    { id: 'rgcg1', name: 'RATE_GEO_COST_GROUP_GID', formula: 'WEGO.{SCAC}_{TYPE || OCEAN}', dataType: 'STRING' },
    { id: 'rgcg2', name: 'RATE_GEO_COST_GROUP_XID', formula: '{SCAC}_{TYPE || OCEAN}', dataType: 'STRING' },
    { id: 'rgcg3', name: 'RATE_GEO_COST_GID', formula: 'WEGO.{SCAC}_{POLUNLOCODE}_{PODUNLOCODE}_{TYPE || OCEAN}_BASE', dataType: 'STRING' },
    { id: 'rgcg4', name: 'DOMAIN_NAME', formula: '"WEGO"', dataType: 'STRING' }
  ]},
  'RATE_OFFERING': { tableName: 'RATE_OFFERING', fields: [
    { id: 'ro1', name: 'RATE_OFFERING_GID', formula: 'WEGO.{SCAC}_{TYPE || OCEAN}', dataType: 'STRING' },
    { id: 'ro2', name: 'RATE_OFFERING_XID', formula: '{SCAC}_{TYPE || OCEAN}', dataType: 'STRING' },
    { id: 'ro3', name: 'RATE_SERVICE_GID', formula: 'WEGO.RS_{TYPE || OCEAN}', dataType: 'STRING' },
    { id: 'ro4', name: 'SERVICE_PROVIDER_GID', formula: 'WEGO.{SCAC}', dataType: 'STRING' },
    { id: 'ro5', name: 'EFFECTIVE_DATE', formula: 'PROJECT_EFF', dataType: 'DATE' },
    { id: 'ro6', name: 'EXPIRATION_DATE', formula: 'PROJECT_EXP', dataType: 'DATE' },
    { id: 'ro7', name: 'DOMAIN_NAME', formula: '"WEGO"', dataType: 'STRING' }
  ]},
  'RATE_SERVICE': { tableName: 'RATE_SERVICE', fields: [
    { id: 'rs1', name: 'RATE_SERVICE_GID', formula: 'WEGO.RS_{TYPE || OCEAN}', dataType: 'STRING' },
    { id: 'rs2', name: 'RATE_SERVICE_XID', formula: 'RS_{TYPE || OCEAN}', dataType: 'STRING' },
    { id: 'rs3', name: 'RATE_SERVICE_TYPE_GID', formula: 'WEGO.{TYPE || OCEAN}', dataType: 'STRING' },
    { id: 'rs4', name: 'DOMAIN_NAME', formula: '"WEGO"', dataType: 'STRING' }
  ]},
  'SERVICE_TIME': { tableName: 'SERVICE_TIME', fields: [
    { id: 'st1', name: 'X_LANE_GID', formula: 'WEGO.{TYPE || OCEAN}_{POLUNLOCODE}_{PODUNLOCODE}', dataType: 'STRING' },
    { id: 'st2', name: 'RATE_SERVICE_GID', formula: 'WEGO.RS_{TYPE || OCEAN}', dataType: 'STRING' },
    { id: 'st3', name: 'SERVICE_DAYS', formula: '{TransitTime || 14}', dataType: 'NUMBER' },
    { id: 'st4', name: 'DOMAIN_NAME', formula: '"WEGO"', dataType: 'STRING' }
  ]},
  'X_LANE': { tableName: 'X_LANE', fields: [
    { id: 'xl1', name: 'X_LANE_GID', formula: 'WEGO.{TYPE || OCEAN}_{POLUNLOCODE}_{PODUNLOCODE}', dataType: 'STRING' },
    { id: 'xl2', name: 'X_LANE_XID', formula: '{TYPE || OCEAN}_{POLUNLOCODE}_{PODUNLOCODE}', dataType: 'STRING' },
    { id: 'xl3', name: 'SOURCE_LOCATION_GID', formula: 'WEGO.{POLUNLOCODE}', dataType: 'STRING' },
    { id: 'xl4', name: 'DEST_LOCATION_GID', formula: 'WEGO.{PODUNLOCODE}', dataType: 'STRING' },
    { id: 'xl5', name: 'DOMAIN_NAME', formula: '"WEGO"', dataType: 'STRING' }
  ]},
  'PREFERRED_RATES': { tableName: 'PREFERRED_RATES', fields: [
    { id: 'pr1', name: 'RATE_GID', formula: 'WEGO.PREF_{SCAC}_{POLUNLOCODE}_{PODUNLOCODE}', dataType: 'STRING' },
    { id: 'pr2', name: 'AMOUNT', formula: '{Ocean Freight}', dataType: 'NUMBER' },
    { id: 'pr3', name: 'EFFECTIVE_DATE', formula: 'PROJECT_EFF', dataType: 'DATE' },
    { id: 'pr4', name: 'EXPIRATION_DATE', formula: 'PROJECT_EXP', dataType: 'DATE' },
    { id: 'pr5', name: 'IS_PREFERRED', formula: 'IS_PREFERRED_VAR', dataType: 'STRING' },
    { id: 'pr6', name: 'PREFERENCE_LEVEL', formula: '"GOLD"', dataType: 'STRING' }
  ]},
};

export const DEFAULT_BRANDING: BrandingConfig = {
  portalName: 'RateFusion',
  adminEmail: 'support@ratefusion.com',
  themeColor: 'blue',
  icon: 'Hexagon',
  loginMessage: 'Access the RateFusion Portal to manage logistics contracts and master data.',
  footerText: '© 2025 RateFusion Logistics'
};

export const THEME_MAP = {
  blue: 'bg-blue-600',
  indigo: 'bg-indigo-600',
  emerald: 'bg-emerald-600',
  violet: 'bg-violet-600',
  slate: 'bg-slate-900'
};

export const ENTERPRISE_HTML_TEMPLATE_CREATED = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
  <div style="background-color: #0f172a; padding: 32px; text-align: center; background-image: url('https://img.freepik.com/free-vector/gradient-technological-background_23-2148884155.jpg'); background-size: cover;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Welcome Aboard</h1>
  </div>
  <div style="background-color: #ffffff; padding: 40px;">
    <h2 style="color: #1e293b; margin-top: 0;">Hello, {name}!</h2>
    <p style="color: #64748b; line-height: 1.6;">Your account has been successfully provisioned. You can now access the RateFusion Portal using the credentials below.</p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0; color: #475569; font-size: 14px;"><strong>Username:</strong> {email}</p>
      <p style="margin: 8px 0 0 0; color: #475569; font-size: 14px;"><strong>Password:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; color: #0f172a;">{password}</span></p>
    </div>
    <div style="text-align: center;">
      <a href="{url}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: bold; text-transform: uppercase; font-size: 14px;">Access Portal</a>
    </div>
  </div>
  <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
    &copy; 2025 RateFusion Logistics. All rights reserved.<br/>
    This is an automated system notification.
  </div>
</div>`;

export const ENTERPRISE_HTML_TEMPLATE_RESET = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
  <div style="background-color: #b91c1c; padding: 32px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Security Alert</h1>
  </div>
  <div style="background-color: #ffffff; padding: 40px;">
    <h2 style="color: #1e293b; margin-top: 0;">Password Reset</h2>
    <p style="color: #64748b; line-height: 1.6;">Hello {name}, your password has been reset.</p>
    <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0; color: #881337; font-size: 14px;"><strong>New Temporary Password:</strong> <span style="font-family: monospace; background: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #fecdd3;">{password}</span></p>
    </div>
    <p style="color: #64748b; font-size: 12px;">Please change this password immediately after logging in.</p>
  </div>
</div>`;

export const ENTERPRISE_HTML_TEMPLATE_BACKUP = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
  <div style="background-color: #059669; padding: 32px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Project Backup</h1>
  </div>
  <div style="background-color: #ffffff; padding: 40px;">
    <h2 style="color: #1e293b; margin-top: 0;">Transmission Complete</h2>
    <p style="color: #64748b; line-height: 1.6;">The project <strong>{projectName}</strong> has been processed. Attached are the original source data and generated XML artifacts for your records.</p>
    
    <div style="background-color: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
         <span style="color: #065f46; font-size: 13px; font-weight: bold;">Status</span>
         <span style="color: #047857;">{status}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
         <span style="color: #065f46; font-size: 13px; font-weight: bold;">Total Records</span>
         <span style="color: #047857;">{recordCount}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
         <span style="color: #065f46; font-size: 13px; font-weight: bold;">Transaction ID</span>
         <span style="color: #047857; font-family: monospace;">{transactionId}</span>
      </div>
    </div>

    <h3 style="font-size: 14px; color: #1e293b; text-transform: uppercase; letter-spacing: 1px; margin-top: 24px;">Included Attachments</h3>
    <ul style="color: #64748b; font-size: 14px; line-height: 1.8;">
       <li>Original_Data.csv</li>
       <li>Generated_OTM_Files.zip ({xmlCount} files)</li>
    </ul>
  </div>
  <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
    &copy; 2025 RateFusion Logistics.
  </div>
</div>`;
