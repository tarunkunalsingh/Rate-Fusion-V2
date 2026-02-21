
import React, { useState } from 'react';
import { Project } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { FileText, Calendar, Trash2, ChevronRight, Clock, Edit2, Check, X, Download, Star } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

interface ProjectListProps {
  projects: Project[];
  onSelect: (project: Project) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelect, onDelete, onRename }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const startEdit = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditName(project.name);
  };

  const saveEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editName.trim()) {
      onRename(id, editName);
    }
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
      e.stopPropagation();
      setConfirmModal({
          isOpen: true,
          title: 'Delete Project',
          message: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
          onConfirm: () => onDelete(project.id)
      });
  };

  const handleDownload = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    const zip = new JSZip();

    // Add original CSV data
    if (project.csvData && project.csvData.length > 0) {
      const csvString = Papa.unparse(project.csvData);
      zip.file(`${project.name.replace(/\s+/g, '_')}_original.csv`, csvString);
    }

    // Add XML files
    if (project.xmlFiles && Object.keys(project.xmlFiles).length > 0) {
      const xmlFolder = zip.folder("xml_files");
      Object.entries(project.xmlFiles).forEach(([fileName, content]) => {
        xmlFolder?.file(fileName.endsWith('.xml') ? fileName : `${fileName}.xml`, content);
      });
    }

    // Generate and save zip
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${project.name.replace(/\s+/g, '_')}_package.zip`);
  };

  if (projects.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <FileText size={48} strokeWidth={1} />
        <p className="mt-4 text-lg">No projects found. Create your first one to get started.</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div 
            key={project.id}
            className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer relative"
            onClick={() => editingId !== project.id && onSelect(project)}
          >
            {project.name === 'Preferred Rates' && (
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl flex items-center gap-1 z-10 shadow-sm">
                 <Star size={10} className="fill-white" /> Preferred
              </div>
            )}
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                <FileText size={24} />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingId !== project.id && (
                    <>
                      <button 
                        onClick={(e) => handleDownload(e, project)}
                        className="text-slate-400 hover:text-emerald-500 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                        title="Download Project Package"
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        onClick={(e) => startEdit(e, project)}
                        className="text-slate-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Rename Project"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteClick(e, project)}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
              </div>
            </div>

            {editingId === project.id ? (
              <div className="flex items-center gap-2 mb-2">
                 <input 
                   type="text" 
                   value={editName}
                   onChange={(e) => setEditName(e.target.value)}
                   className="w-full bg-slate-50 border border-blue-400 rounded-lg px-2 py-1 text-sm font-bold outline-none"
                   autoFocus
                   onClick={(e) => e.stopPropagation()}
                 />
                 <button onClick={(e) => saveEdit(e, project.id)} className="text-emerald-500 p-1 hover:bg-emerald-50 rounded"><Check size={16}/></button>
                 <button onClick={cancelEdit} className="text-slate-400 p-1 hover:bg-slate-100 rounded"><X size={16}/></button>
              </div>
            ) : (
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                {project.name}
              </h3>
            )}
            
            <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                {new Date(project.createdAt).toLocaleDateString()}
              </div>
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                project.status === 'transmitted' ? 'bg-green-100 text-green-700' :
                project.status === 'converted' ? 'bg-blue-100 text-blue-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {project.status}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs text-slate-400">{project.csvData.length} rate records</span>
              <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ProjectList;
