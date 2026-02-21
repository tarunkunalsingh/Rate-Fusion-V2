import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  aspect: number;
  onCancel: () => void;
  onComplete: (base64: string) => void;
  maxDimension?: number; // Max width/height for output
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); 
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  maxDimension: number = 1280
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  // Calculate scaling factor to limit size (prevents massive base64 strings in localStorage)
  let width = pixelCrop.width;
  let height = pixelCrop.height;
  
  if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height);
      width *= ratio;
      height *= ratio;
  }

  canvas.width = width;
  canvas.height = height;

  // Draw the cropped image onto the canvas with scaling
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height
  );

  // Return as JPEG with 0.8 quality for compression
  return canvas.toDataURL('image/jpeg', 0.8);
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, aspect, onCancel, onComplete, maxDimension = 1280 }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, maxDimension);
      onComplete(croppedImage);
    } catch (e) {
      console.error(e);
      alert('Failed to crop image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[80vh] md:h-[600px]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
           <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
             <ImageIcon size={16} className="text-blue-600"/> Adjust Image
           </h3>
           <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors">
             <X size={20} />
           </button>
        </div>

        {/* Cropper Area */}
        <div className="relative flex-1 bg-slate-900 overflow-hidden">
           <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              showGrid={true}
           />
        </div>

        {/* Controls */}
        <div className="px-8 py-6 bg-white border-t border-slate-100 flex flex-col gap-4 z-10">
           <div className="flex items-center gap-4">
              <ZoomOut size={16} className="text-slate-400"/>
              <input 
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700"
              />
              <ZoomIn size={16} className="text-slate-400"/>
           </div>
           
           <div className="flex gap-3">
              <button 
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wide hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-wide hover:bg-black transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isProcessing ? 'Processing...' : <><Check size={16}/> Apply Crop</>}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;