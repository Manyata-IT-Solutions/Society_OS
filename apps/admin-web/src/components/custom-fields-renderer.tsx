'use client';

import React from 'react';

export interface CustomFieldOption {
  key: string;
  label: string;
  isActive: boolean;
}

export interface CustomFieldDefinition {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  fieldType: string;
  required?: boolean;
  options?: CustomFieldOption[] | null;
  visibility?: string;
}

interface CustomFieldsRendererProps {
  definitions: CustomFieldDefinition[];
  values: Record<string, any>;
  onChange: (definitionId: string, value: any) => void;
  readOnly?: boolean;
}

export function CustomFieldsRenderer({
  definitions,
  values,
  onChange,
  readOnly = false,
}: CustomFieldsRendererProps) {
  if (!definitions || definitions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted">
        Custom Metadata Fields
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {definitions.map((def) => {
          const val = values[def.id];

          return (
            <div key={def.id} className="space-y-1">
              <label className="block text-xs font-medium text-foreground">
                {def.label}
                {def.required && <span className="text-destructive ml-1">*</span>}
              </label>

              {def.fieldType === 'TEXT' ||
              def.fieldType === 'EMAIL' ||
              def.fieldType === 'PHONE' ||
              def.fieldType === 'URL' ? (
                <input
                  type={
                    def.fieldType === 'EMAIL' ? 'email' : def.fieldType === 'URL' ? 'url' : 'text'
                  }
                  disabled={readOnly}
                  value={val || ''}
                  onChange={(e) => onChange(def.id, e.target.value)}
                  placeholder={def.description || `Enter ${def.label.toLowerCase()}`}
                  className="input text-xs w-full"
                />
              ) : def.fieldType === 'LONG_TEXT' ? (
                <textarea
                  rows={2}
                  disabled={readOnly}
                  value={val || ''}
                  onChange={(e) => onChange(def.id, e.target.value)}
                  placeholder={def.description || ''}
                  className="input text-xs w-full"
                />
              ) : def.fieldType === 'NUMBER' || def.fieldType === 'DECIMAL' ? (
                <input
                  type="number"
                  step={def.fieldType === 'DECIMAL' ? '0.01' : '1'}
                  disabled={readOnly}
                  value={val !== undefined && val !== null ? val : ''}
                  onChange={(e) =>
                    onChange(
                      def.id,
                      e.target.value === ''
                        ? null
                        : def.fieldType === 'DECIMAL'
                          ? parseFloat(e.target.value)
                          : parseInt(e.target.value, 10),
                    )
                  }
                  className="input text-xs w-full"
                />
              ) : def.fieldType === 'BOOLEAN' ? (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={Boolean(val)}
                    onChange={(e) => onChange(def.id, e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-xs text-muted">Enabled / Confirmed</span>
                </div>
              ) : def.fieldType === 'DATE' || def.fieldType === 'DATETIME' ? (
                <input
                  type={def.fieldType === 'DATE' ? 'date' : 'datetime-local'}
                  disabled={readOnly}
                  value={val ? String(val).substring(0, def.fieldType === 'DATE' ? 10 : 16) : ''}
                  onChange={(e) =>
                    onChange(def.id, e.target.value ? new Date(e.target.value).toISOString() : null)
                  }
                  className="input text-xs w-full"
                />
              ) : def.fieldType === 'SELECT' ? (
                <select
                  disabled={readOnly}
                  value={val || ''}
                  onChange={(e) => onChange(def.id, e.target.value || null)}
                  className="input text-xs w-full"
                >
                  <option value="">-- Select {def.label} --</option>
                  {(def.options || [])
                    .filter((opt) => opt.isActive)
                    .map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                </select>
              ) : def.fieldType === 'MULTI_SELECT' ? (
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(def.options || [])
                      .filter((opt) => opt.isActive)
                      .map((opt) => {
                        const selectedList: string[] = Array.isArray(val) ? val : [];
                        const isChecked = selectedList.includes(opt.key);

                        return (
                          <button
                            key={opt.key}
                            type="button"
                            disabled={readOnly}
                            onClick={() => {
                              const next = isChecked
                                ? selectedList.filter((k) => k !== opt.key)
                                : [...selectedList, opt.key];
                              onChange(def.id, next);
                            }}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                              isChecked
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-surface text-muted border-border hover:border-primary/50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ) : null}

              {def.description && <p className="text-[10px] text-muted">{def.description}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
