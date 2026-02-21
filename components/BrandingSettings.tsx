
import React, { useState, useRef } from 'react';
import { BrandingConfig, ThemeColor, BrandIcon } from '../types';
import { Palette, Layout, Type, Save, CheckCircle2, Box, Globe, Hexagon, Ship, Anchor, Zap, MessageSquare, Image, Link2, Upload, X, Trash2, Loader2, Check } from 'lucide-react';
import ImageCropper from './ImageCropper';

interface BrandingSettingsProps {
  config: BrandingConfig;
  setConfig: (config: BrandingConfig) => void;
}

const BrandingSettings: React.FC<BrandingSettingsProps> = ({ config, setConfig }) => {
  // Cropper State
  const [cropperState, setCropperState] = useState<{
    isOpen: boolean;
    imageSrc: string;
    field: 'logoUrl' | 'loginBackgroundUrl';
    aspect: number;
    maxDim: number;
  } | null>(null);

  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const themes: { id: ThemeColor; color: string; label: string }[] = [
    { id: 'blue', color: 'bg-blue-600', label: 'Corporate Blue' },
    { id: 'indigo', color: 'bg-indigo-600', label: 'Modern Indigo' },
    { id: 'emerald', color: 'bg-emerald-600', label: 'Sustainable Green' },
    { id: 'violet', color: 'bg-violet-600', label: 'Creative Violet' },
    { id: 'slate', color: 'bg-slate-800', label: 'Dark Slate' },
  ];

  const icons: { id: BrandIcon; icon: React.ElementType }[] = [
    { id: 'Hexagon', icon: Hexagon },
    { id: 'Box', icon: Box },
    { id: 'Globe', icon: Globe },
    { id: 'Ship', icon: Ship },
    { id: 'Anchor', icon: Anchor },
    { id: 'Zap', icon: Zap },
  ];

  const handleUpdate = (field: keyof BrandingConfig, value: any) => {
      setConfig({ ...config, [field]: value });
      setStatus('idle');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'loginBackgroundUrl', aspect: number, maxDim: number) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropperState({
          isOpen: true,
          imageSrc: reader.result?.toString() || '',
          field,
          aspect,
          maxDim
        });
      });
      reader.readAsDataURL(file);
      // Reset input so same file can be selected again if needed
      e.target.value = ''; 
    }
  };

  const handleCropComplete = (base64: string) => {
    if (cropperState) {
      setConfig({ ...config, [cropperState.field]: base64 });
      setStatus('idle');
      setCropperState(null);
    }
  };

  const removeImage = (field: 'logoUrl' | 'loginBackgroundUrl') => {
    setConfig({ ...config, [field]: undefined });
    setStatus('idle');
  };

  const handleSave = () => {
    setStatus('saving');
    // Simulate persistent save
    setTimeout(() => {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 text-slate-100 opacity-20">
          <Palette size={180} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-4 uppercase tracking-tight relative z-10">
          <span className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
            <Layout size={24} />
          </span>
          Portal Branding
        </h2>
        <p className="text-slate-500 mt-4 text-sm font-medium leading-relaxed max-w-2xl relative z-10">
          Customize the visual identity, system labels, and login experience. 
          Changes reflect immediately across the application.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Type size={16} /> General Information
          </h3>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Application Name</label>
            <input 
              type="text" 
              value={config.portalName}
              onChange={(e) => handleUpdate('portalName', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="e.g. Rate Maintenance Pro"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Admin Contact Email</label>
            <input 
              type="text" 
              value={config.adminEmail}
              onChange={(e) => handleUpdate('adminEmail', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="e.g. admin@company.com"
            />
          </div>
          
           <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Copyright / Footer Text</label>
            <input 
              type="text" 
              value={config.footerText || ''}
              onChange={(e) => handleUpdate('footerText', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="e.g. © 2025 Logistics Corp"
            />
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Palette size={16} /> Visual Theme
            </h3>
            
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Primary Color</label>
              <div className="flex flex-wrap gap-2">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleUpdate('themeColor', theme.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${theme.color} ${config.themeColor === theme.id ? 'ring-4 ring-offset-2 ring-slate-200 scale-110' : 'hover:scale-105'}`}
                    title={theme.label}
                  >
                    {config.themeColor === theme.id && <CheckCircle2 size={16} className="text-white"/>}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Default Icon</label>
              <div className="flex flex-wrap gap-3">
                {icons.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleUpdate('icon', item.id)}
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${config.icon === item.id ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                  >
                    <item.icon size={24} />
                  </button>
                ))}
              </div>
            </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1"><Link2 size={10}/> Custom Logo</label>
                {config.logoUrl ? (
                  <div className="relative group w-fit">
                    <img src={config.logoUrl} alt="Logo Preview" className="h-16 w-auto border border-slate-200 rounded-xl bg-slate-50 p-2" />
                    <button 
                      onClick={() => removeImage('logoUrl')} 
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full h-20 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer gap-1"
                  >
                    <Upload size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Upload Logo</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={logoInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, 'logoUrl', 1, 512)}
                />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare size={16} /> Login Experience
            </h3>
             <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Login Welcome Message</label>
              <textarea 
                value={config.loginMessage || ''}
                onChange={(e) => handleUpdate('loginMessage', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-500 min-h-[100px] resize-none"
                placeholder="e.g. Welcome to the Enterprise Portal. Please sign in to continue."
              />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1"><Image size={10}/> Login Background</label>
                {config.loginBackgroundUrl ? (
                  <div className="relative group w-full h-32 rounded-2xl overflow-hidden border border-slate-200">
                    <img src={config.loginBackgroundUrl} alt="Background Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                       <button onClick={() => bgInputRef.current?.click()} className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-xl backdrop-blur-md transition-colors"><Upload size={16}/></button>
                       <button onClick={() => removeImage('loginBackgroundUrl')} className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-xl backdrop-blur-md transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => bgInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer gap-1"
                  >
                    <Image size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Upload Wallpaper</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={bgInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, 'loginBackgroundUrl', 16/9, 1920)}
                />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={status === 'saving'}
          className={`px-8 py-4 rounded-2xl flex items-center gap-3 transition-all font-black text-xs uppercase tracking-widest shadow-xl ${status === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-900 hover:bg-black text-white shadow-slate-200'}`}
        >
            {status === 'saving' ? (
              <Loader2 size={18} className="animate-spin" />
            ) : status === 'success' ? (
              <Check size={18} />
            ) : (
              <Save size={18} />
            )}
            {status === 'saving' ? 'Saving...' : status === 'success' ? 'Saved Successfully' : 'Save Configuration'}
        </button>
      </div>

      {cropperState && (
        <ImageCropper
          imageSrc={cropperState.imageSrc}
          aspect={cropperState.aspect}
          maxDimension={cropperState.maxDim}
          onCancel={() => setCropperState(null)}
          onComplete={handleCropComplete}
        />
      )}
    </div>
  );
};

export default BrandingSettings;
