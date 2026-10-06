'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FileText, Plus, ArrowLeft, RefreshCw, Code, Tag, CheckCircle2, X } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('SYSTEM');
  const [channel, setChannel] = useState('IN_APP');
  const [locale, setLocale] = useState('en');
  const [subjectTemplate, setSubjectTemplate] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [newVar, setNewVar] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.notifications.listTemplates();
      setTemplates(res?.items || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleAddVariable = () => {
    if (!newVar.trim()) return;
    if (!variables.includes(newVar.trim())) {
      setVariables([...variables, newVar.trim()]);
    }
    setNewVar('');
  };

  const handleRemoveVariable = (v: string) => {
    setVariables(variables.filter((item) => item !== v));
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage('');
    try {
      await api.notifications.createTemplate({
        code: code.toUpperCase().replace(/\s+/g, '_'),
        name,
        category,
        channel,
        locale,
        subjectTemplate: subjectTemplate || undefined,
        bodyTemplate,
        variables,
      });

      setSuccessMessage('Notification template created successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMessage('');
        setCode('');
        setName('');
        setSubjectTemplate('');
        setBodyTemplate('');
        setVariables([]);
        loadTemplates();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to create notification template.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app/notifications"
            className="rounded-md border border-border bg-surface p-2 text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notification Templates</h1>
            <p className="text-sm text-muted">
              Standardized message formats with safe variable interpolation and locale mappings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTemplates}
            className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium hover:bg-surface-muted transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            New Template
          </button>
        </div>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {loading ? (
          <div className="col-span-2 rounded-lg border border-border bg-surface p-8 text-center text-xs text-muted">
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-2 rounded-lg border border-border bg-surface p-8 text-center text-xs text-muted">
            No notification templates defined yet.
          </div>
        ) : (
          templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="rounded-lg border border-border bg-surface p-5 space-y-3 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-primary">{tmpl.code}</span>
                  <h3 className="text-sm font-semibold text-foreground">{tmpl.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-surface-muted px-2 py-0.5 text-[10px] text-muted uppercase">
                    {tmpl.channel}
                  </span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                    {tmpl.category}
                  </span>
                </div>
              </div>

              {tmpl.subjectTemplate && (
                <div className="rounded bg-surface-muted/50 px-3 py-1.5 text-xs text-muted">
                  <span className="font-semibold text-foreground mr-1">Subject:</span>
                  {tmpl.subjectTemplate}
                </div>
              )}

              <div className="text-xs text-muted line-clamp-3 whitespace-pre-line bg-background/50 p-3 rounded border border-border/50">
                {tmpl.bodyTemplate}
              </div>

              {tmpl.variables && tmpl.variables.length > 0 && (
                <div className="pt-2 border-t border-border flex flex-wrap items-center gap-1.5">
                  <Tag className="h-3 w-3 text-muted mr-1" />
                  {tmpl.variables.map((v: string) => (
                    <span
                      key={v}
                      className="rounded bg-surface-muted px-2 py-0.5 font-mono text-[10px] text-foreground"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold">Create Notification Template</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleCreateTemplate} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-foreground mb-1">Code (Key)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PAYMENT_REMINDER"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs uppercase focus:border-primary focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Template Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Monthly Dues Reminder"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-foreground mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  >
                    <option value="SYSTEM">SYSTEM</option>
                    <option value="ACCOUNT">ACCOUNT</option>
                    <option value="RESIDENT">RESIDENT</option>
                    <option value="PROPERTY">PROPERTY</option>
                    <option value="FINANCE">FINANCE</option>
                    <option value="GOVERNANCE">GOVERNANCE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  >
                    <option value="IN_APP">IN_APP</option>
                    <option value="EMAIL">EMAIL</option>
                    <option value="SMS">SMS</option>
                    <option value="PUSH">PUSH</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Locale</label>
                  <input
                    type="text"
                    required
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Subject Template</label>
                <input
                  type="text"
                  placeholder="e.g. Notice for {{residentName}} - Unit {{unitNumber}}"
                  value={subjectTemplate}
                  onChange={(e) => setSubjectTemplate(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Body Template</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Hello {{residentName}}, your maintenance payment is due on {{dueDate}}."
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Declared Variables</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. residentName"
                    value={newVar}
                    onChange={(e) => setNewVar(e.target.value)}
                    className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariable}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
                  >
                    Add Variable
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {variables.map((v) => (
                    <span
                      key={v}
                      className="inline-flex items-center gap-1 rounded bg-surface-muted px-2 py-0.5 font-mono text-[10px]"
                    >
                      {`{{${v}}}`}
                      <button
                        type="button"
                        onClick={() => handleRemoveVariable(v)}
                        className="text-muted hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
