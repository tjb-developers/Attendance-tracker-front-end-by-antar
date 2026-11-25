import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Megaphone,
  FileText,
  Type,
  Upload,
  Download,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Building2,
} from 'lucide-react';
import { Announcement, AnnouncementType } from '../../types';

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const clean = base64.includes(',') ? base64.split(',')[1] : base64;
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function compressPdfToBase64(file: File): Promise<{
  base64: string;
  isCompressed: boolean;
  originalBytes: number;
  compressedBytes: number;
}> {
  const rawBuffer = await file.arrayBuffer();
  const rawBytes = new Uint8Array(rawBuffer);

  if (typeof CompressionStream !== 'undefined') {
    try {
      const cs = new CompressionStream('gzip');
      const writer = cs.writable.getWriter();
      writer.write(rawBytes);
      writer.close();
      const compressedBuffer = await new Response(cs.readable).arrayBuffer();
      const compressedBytes = new Uint8Array(compressedBuffer);

      // Use compressed bytes whenever smaller than original
      if (compressedBytes.byteLength < rawBytes.byteLength) {
        return {
          base64: uint8ToBase64(compressedBytes),
          isCompressed: true,
          originalBytes: rawBytes.byteLength,
          compressedBytes: compressedBytes.byteLength,
        };
      }
    } catch {
      // Fallback to uncompressed Base64 if CompressionStream fails
    }
  }

  return {
    base64: uint8ToBase64(rawBytes),
    isCompressed: false,
    originalBytes: rawBytes.byteLength,
    compressedBytes: rawBytes.byteLength,
  };
}

async function decompressBase64ToPdfBlob(base64: string, isCompressed?: boolean): Promise<Blob> {
  const bytes = base64ToUint8(base64);
  if (isCompressed && typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(bytes as unknown as BufferSource);
    writer.close();
    const outBuffer = await new Response(ds.readable).arrayBuffer();
    return new Blob([outBuffer], { type: 'application/pdf' });
  }
  return new Blob([bytes as unknown as BufferSource], { type: 'application/pdf' });
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const Announcements: React.FC = () => {
  const {
    announcements,
    addAnnouncement,
    deleteAnnouncement,
    offices,
    selectedOfficeId,
    isSuperAdmin,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AnnouncementType>('text');
  const [textContent, setTextContent] = useState('');
  const [targetOfficeId, setTargetOfficeId] = useState<string>(
    isSuperAdmin ? 'all' : selectedOfficeId || 'all'
  );

  // PDF Compression + Base64 state
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfBase64, setPdfBase64] = useState('');
  const [isCompressed, setIsCompressed] = useState(false);
  const [originalBytes, setOriginalBytes] = useState(0);
  const [compressedBytes, setCompressedBytes] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const showToast = (t: 'success' | 'error', text: string) => {
    setToast({ type: t, text });
    setTimeout(() => setToast(null), 4500);
  };

  const resetForm = () => {
    setTitle('');
    setType('text');
    setTextContent('');
    setPdfFileName('');
    setPdfBase64('');
    setIsCompressed(false);
    setOriginalBytes(0);
    setCompressedBytes(0);
    setTargetOfficeId(isSuperAdmin ? 'all' : selectedOfficeId || 'all');
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('error', 'Only PDF files are allowed for PDF announcements.');
      return;
    }

    setIsCompressing(true);
    try {
      const result = await compressPdfToBase64(file);
      setPdfFileName(file.name);
      setPdfBase64(result.base64);
      setIsCompressed(result.isCompressed);
      setOriginalBytes(result.originalBytes);
      setCompressedBytes(result.compressedBytes);
    } catch {
      showToast('error', 'Failed to compress and encode PDF file.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('error', 'Announcement title is required.');
      return;
    }
    if (type === 'text' && !textContent.trim()) {
      showToast('error', 'Please enter announcement text.');
      return;
    }
    if (type === 'pdf' && !pdfBase64) {
      showToast('error', 'Please select a PDF file.');
      return;
    }

    setIsSubmitting(true);
    const ok = await addAnnouncement({
      title: title.trim(),
      type,
      content: type === 'text' ? textContent.trim() : null,
      pdf_base64: type === 'pdf' ? pdfBase64 : null,
      file_name: type === 'pdf' ? pdfFileName : null,
      is_compressed: type === 'pdf' ? isCompressed : false,
      original_size_bytes: type === 'pdf' ? originalBytes : null,
      compressed_size_bytes: type === 'pdf' ? compressedBytes : null,
      office_id: targetOfficeId === 'all' ? null : targetOfficeId,
    });
    setIsSubmitting(false);

    if (ok) {
      setIsModalOpen(false);
      resetForm();
      showToast('success', 'Announcement published successfully!');
    }
  };

  const handleOpenPdf = async (ann: Announcement, download = false) => {
    if (!ann.pdf_base64) return;
    try {
      const blob = await decompressBase64ToPdfBlob(ann.pdf_base64, ann.is_compressed);
      const url = URL.createObjectURL(blob);
      if (download) {
        const a = document.createElement('a');
        a.href = url;
        a.download = ann.file_name || `${ann.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      showToast('error', 'Unable to decode PDF file.');
    }
  };

  const handleDelete = async (id: string, annTitle: string) => {
    if (confirm(`Delete announcement "${annTitle}"?`)) {
      const ok = await deleteAnnouncement(id);
      if (ok) showToast('success', 'Announcement deleted.');
    }
  };

  const reductionPct =
    originalBytes > 0 && compressedBytes < originalBytes
      ? Math.round(((originalBytes - compressedBytes) / originalBytes) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Announcements &amp; Circulars
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-blue-900">
              Official Notices
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Publish official Text notices or compressed Base64 PDF circulars for staff.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="p-0.5 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Announcements List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Published Announcements ({announcements.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Text &amp; Compressed PDF</span>
        </div>

        {announcements.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">No Announcements Published Yet</h4>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Click &quot;New Announcement&quot; to post a text notice or upload a PDF circular.
            </p>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Announcement</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {announcements.map((ann) => {
              const targetOffice = ann.office_id
                ? offices.find((o) => o.id === ann.office_id)?.office_name || 'Assigned Office'
                : 'All Offices (Global)';
              const isPdf = ann.type === 'pdf';

              return (
                <div
                  key={ann.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 ${
                        isPdf ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      {isPdf ? <FileText className="w-5 h-5" /> : <Type className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{ann.title}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isPdf
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isPdf ? 'PDF Circular' : 'Text Notice'}
                        </span>
                        {ann.is_compressed && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Gzip Compressed Base64
                          </span>
                        )}
                      </div>

                      {!isPdf && ann.content && (
                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                          {ann.content}
                        </p>
                      )}

                      {isPdf && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-xs font-mono text-slate-600">
                            {ann.file_name || 'circular.pdf'}
                          </span>
                          {ann.compressed_size_bytes && (
                            <span className="text-[11px] text-slate-400">
                              ({formatBytes(ann.compressed_size_bytes)} stored)
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenPdf(ann, false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            <FileText className="w-3 h-3" />
                            <span>View PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenPdf(ann, true)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {targetOffice}
                        </span>
                        <span>&bull;</span>
                        <span>{new Date(ann.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(ann.id, ann.title)}
                    title="Delete Announcement"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer self-end sm:self-start"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 !mt-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Publish Announcement
                  </h3>
                  <p className="text-xs text-slate-500">
                    Choose Text or PDF (automatically compressed to Base64)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Revised Office Timings / Circular No. 14"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Format Switcher: Text OR PDF only */}
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                  Announcement Format *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setType('text')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition cursor-pointer ${
                      type === 'text'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Type className="w-4 h-4" />
                    <span>Text Notice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('pdf')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition cursor-pointer ${
                      type === 'pdf'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF Document</span>
                  </button>
                </div>
              </div>

              {type === 'text' ? (
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Announcement Message *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Write your announcement text here..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Select PDF File (Any Size — Auto Compressed to Base64) *
                  </label>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfSelect}
                    className="hidden"
                  />

                  <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center space-y-2.5">
                    {isCompressing ? (
                      <p className="text-xs font-bold text-blue-700 animate-pulse">
                        Compressing PDF &amp; converting to Base64...
                      </p>
                    ) : pdfBase64 ? (
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          <FileCheck2 className="w-4 h-4" />
                          <span>{pdfFileName}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 p-2.5 bg-white border border-slate-200 rounded-lg text-center text-[10px]">
                          <div>
                            <span className="block text-slate-400 font-bold uppercase">Original</span>
                            <span className="font-mono font-bold text-slate-800">{formatBytes(originalBytes)}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 font-bold uppercase">Compressed</span>
                            <span className="font-mono font-bold text-emerald-700">{formatBytes(compressedBytes)}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 font-bold uppercase">Saved</span>
                            <span className="font-mono font-bold text-blue-700">
                              {reductionPct > 0 ? `${reductionPct}%` : '0%'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Select any PDF file. It will be compressed and stored as a Base64 string.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>{pdfBase64 ? 'Change PDF File' : 'Choose PDF File'}</span>
                    </button>
                  </div>
                </div>
              )}

              {isSuperAdmin && (
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Target Office
                  </label>
                  <select
                    value={targetOfficeId}
                    onChange={(e) => setTargetOfficeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:outline-none"
                  >
                    <option value="all">All Offices (Global)</option>
                    {offices.map((off) => (
                      <option key={off.id} value={off.id}>
                        {off.office_name} {off.office_code ? `(${off.office_code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isCompressing}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

