'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Shield,
  Layers,
  Link as LinkIcon,
  X,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function DocumentLibraryPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [docDetailsLoading, setDocDetailsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  // Create Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('POLICY');
  const [classification, setClassification] = useState('PUBLIC');
  const [fileName, setFileName] = useState('');
  const [originalFileName, setOriginalFileName] = useState('');
  const [mimeType, setMimeType] = useState('application/pdf');
  const [sizeBytes, setSizeBytes] = useState('102400');
  const [checksum, setChecksum] = useState(
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  );
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.documents.list({
        category: categoryFilter || undefined,
        classification: classificationFilter || undefined,
        search: search || undefined,
      });
      setDocuments(res?.items || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, classificationFilter, search]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleSelectDoc = async (id: string) => {
    setDocDetailsLoading(true);
    try {
      const doc = await api.documents.get(id);
      setSelectedDoc(doc);
    } catch {
      // ignore
    } finally {
      setDocDetailsLoading(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage('');
    try {
      // Fetch user organizations / communities for context
      const orgs = await api.listOrganizations();
      const orgId = orgs?.data?.[0]?.id;
      if (!orgId) {
        alert('No organization found to attach document.');
        return;
      }

      await api.documents.create(orgId, undefined, {
        title,
        description,
        category,
        classification,
        initialVersion: {
          fileName: fileName || `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
          originalFileName: originalFileName || fileName || `${title}.pdf`,
          mimeType,
          sizeBytes: BigInt(sizeBytes || 102400).toString(),
          checksum: checksum || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          storageKey: `${orgId}/global/documents/${title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        },
      });

      setSuccessMessage('Document created successfully!');
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setSuccessMessage('');
        setTitle('');
        setDescription('');
        loadDocuments();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to create document.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Document Library</h1>
          <p className="text-sm text-muted">
            Enterprise document management, immutable versioning, secure object storage, and access
            controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDocuments}
            className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium hover:bg-surface-muted transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-lg border border-border bg-surface p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search documents by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-xs focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="POLICY">POLICY</option>
            <option value="LEGAL">LEGAL</option>
            <option value="GOVERNANCE">GOVERNANCE</option>
            <option value="FINANCIAL">FINANCIAL</option>
            <option value="RESIDENT">RESIDENT</option>
            <option value="PROPERTY">PROPERTY</option>
            <option value="GENERAL">GENERAL</option>
          </select>
        </div>

        <div>
          <select
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
          >
            <option value="">All Classifications</option>
            <option value="PUBLIC">PUBLIC</option>
            <option value="INTERNAL">INTERNAL</option>
            <option value="CONFIDENTIAL">CONFIDENTIAL</option>
            <option value="RESTRICTED">RESTRICTED</option>
          </select>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {loading ? (
          <div className="col-span-3 rounded-lg border border-border bg-surface p-8 text-center text-xs text-muted">
            Loading document repository...
          </div>
        ) : documents.length === 0 ? (
          <div className="col-span-3 rounded-lg border border-border bg-surface p-8 text-center text-xs text-muted">
            No documents match the active filter criteria.
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleSelectDoc(doc.id)}
              className="cursor-pointer rounded-lg border border-border bg-surface p-5 space-y-3 transition-all hover:border-primary hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-xs text-foreground line-clamp-1">
                      {doc.title}
                    </h3>
                    <span className="text-[10px] text-muted font-mono">v{doc.version}</span>
                  </div>
                </div>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {doc.classification}
                </span>
              </div>

              {doc.description && (
                <p className="text-xs text-muted line-clamp-2">{doc.description}</p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border text-[10px] text-muted">
                <span className="rounded bg-surface-muted px-2 py-0.5 uppercase">
                  {doc.category}
                </span>
                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Document Detail & Version History Drawer */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-base font-semibold">{selectedDoc.title}</h3>
                  <p className="text-xs text-muted font-mono">{selectedDoc.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="rounded p-1 text-muted hover:bg-surface-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-surface-muted/50 p-4">
                <div>
                  <span className="text-muted block text-[10px] uppercase">Category</span>
                  <span className="font-semibold">{selectedDoc.category}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase">Classification</span>
                  <span className="font-semibold">{selectedDoc.classification}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase">Current Version</span>
                  <span>v{selectedDoc.version}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase">Status</span>
                  <span className="font-semibold text-green-600">{selectedDoc.status}</span>
                </div>
              </div>

              {selectedDoc.description && (
                <div>
                  <h4 className="font-semibold text-xs mb-1">Description</h4>
                  <p className="text-muted leading-relaxed">{selectedDoc.description}</p>
                </div>
              )}

              {/* Version History */}
              <div>
                <h4 className="font-semibold text-xs mb-2">Version History</h4>
                <div className="divide-y divide-border rounded-lg border border-border bg-background">
                  {selectedDoc.versions?.map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between p-3">
                      <div>
                        <div className="font-semibold font-mono text-xs">
                          v{v.versionNumber}: {v.fileName}
                        </div>
                        <div className="text-[10px] text-muted">
                          {(Number(v.sizeBytes) / 1024).toFixed(1)} KB • SHA-256:{' '}
                          {v.checksum.slice(0, 12)}...
                        </div>
                      </div>
                      <a
                        href={api.documents.getDownloadUrl(selectedDoc.id, v.versionNumber)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-surface-muted transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked Resources */}
              {selectedDoc.links && selectedDoc.links.length > 0 && (
                <div>
                  <h4 className="font-semibold text-xs mb-2">Attached Resources</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDoc.links.map((link: any) => (
                      <span
                        key={link.id}
                        className="inline-flex items-center gap-1 rounded bg-surface-muted px-2.5 py-1 text-[11px]"
                      >
                        <LinkIcon className="h-3 w-3 text-muted" />
                        {link.resourceType}: {link.resourceId}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold">Upload New Document</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded p-1 text-muted hover:bg-surface-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {successMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-xs text-green-600 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {successMessage}
              </div>
            )}

            <form onSubmit={handleCreateDocument} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Property Deed 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of this document's contents..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-foreground mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  >
                    <option value="POLICY">POLICY</option>
                    <option value="LEGAL">LEGAL</option>
                    <option value="GOVERNANCE">GOVERNANCE</option>
                    <option value="FINANCIAL">FINANCIAL</option>
                    <option value="RESIDENT">RESIDENT</option>
                    <option value="PROPERTY">PROPERTY</option>
                    <option value="GENERAL">GENERAL</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Classification</label>
                  <select
                    value={classification}
                    onChange={(e) => setClassification(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  >
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="INTERNAL">INTERNAL</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="RESTRICTED">RESTRICTED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-foreground mb-1">File Name</label>
                  <input
                    type="text"
                    placeholder="property_deed_2026.pdf"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">MIME Type</label>
                  <input
                    type="text"
                    value={mimeType}
                    onChange={(e) => setMimeType(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Uploading...' : 'Upload & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
