'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import {
  Sliders,
  Play,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  Code,
  BookOpen,
} from 'lucide-react';

export default function RulesPage() {
  const [activeTab, setActiveTab] = useState<'definitions' | 'simulator' | 'facts'>('definitions');
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [facts, setFacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Simulator state
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [simulationFactsJson, setSimulationFactsJson] = useState<string>(
    JSON.stringify({ resource: { amount: 35000, priority: 'HIGH' } }, null, 2),
  );
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      if (activeTab === 'definitions' || activeTab === 'simulator') {
        const res = await api.rules.listDefinitions();
        setDefinitions(res?.items || []);
        if (res?.items?.length > 0 && !selectedRuleId) {
          setSelectedRuleId(res.items[0].id);
        }
      }
      if (activeTab === 'facts') {
        const res = await api.rules.listFacts();
        setFacts(res?.items || []);
      }
    } catch (err: any) {
      setFeedback(`Error loading rules: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.rules.publishDefinition(id);
      setFeedback('Rule definition published and frozen.');
      loadData();
    } catch (err: any) {
      setFeedback(`Failed to publish rule: ${err.message}`);
    }
  };

  const handleClone = async (id: string) => {
    try {
      await api.rules.cloneDefinition(id);
      setFeedback('New rule draft version created.');
      loadData();
    } catch (err: any) {
      setFeedback(`Failed to clone rule: ${err.message}`);
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    setSimulationResult(null);
    try {
      const parsedFacts = JSON.parse(simulationFactsJson);
      const res = await api.rules.simulateRule({
        facts: parsedFacts,
      });
      setSimulationResult(res);
    } catch (err: any) {
      setFeedback(`Simulation error: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sliders className="h-6 w-6 text-primary" />
            Rules & Policy Guard Engine
          </h1>
          <p className="text-sm text-muted">
            Declarative recursive AST condition engine with fact resolution and safe deterministic
            evaluation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('definitions')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'definitions'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface text-foreground border border-border'
            }`}
          >
            Definitions
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'simulator'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface text-foreground border border-border'
            }`}
          >
            Simulator
          </button>
          <button
            onClick={() => setActiveTab('facts')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'facts'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface text-foreground border border-border'
            }`}
          >
            Fact Registry
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-surface-muted border border-border rounded-md text-sm text-foreground flex items-center justify-between">
          <span>{feedback}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-muted hover:text-foreground text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12 text-muted">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
      ) : activeTab === 'definitions' ? (
        <div className="grid gap-4">
          {definitions.length === 0 ? (
            <div className="bg-surface border border-border rounded-lg p-8 text-center text-muted">
              No rule definitions found.
            </div>
          ) : (
            definitions.map((rule) => (
              <div
                key={rule.id}
                className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground text-base">{rule.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                      v{rule.version}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        rule.status === 'PUBLISHED'
                          ? 'bg-green-500/10 text-green-500'
                          : rule.status === 'DRAFT'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : 'bg-muted/10 text-muted'
                      }`}
                    >
                      {rule.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {rule.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublish(rule.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                      >
                        Publish
                      </button>
                    )}
                    {rule.status === 'PUBLISHED' && (
                      <button
                        onClick={() => handleClone(rule.id)}
                        className="px-3 py-1 bg-surface-muted border border-border text-foreground rounded text-xs font-medium hover:bg-border flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" /> Fork Version
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted font-mono">
                  {rule.key} &bull; Resource: {rule.resourceType}
                </p>
                {rule.description && (
                  <p className="text-sm text-foreground/80">{rule.description}</p>
                )}

                {/* AST Condition Preview */}
                <div className="pt-2">
                  <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Code className="h-3 w-3" /> Condition AST
                  </div>
                  <pre className="p-3 bg-surface-muted border border-border rounded text-xs font-mono overflow-x-auto text-foreground">
                    {JSON.stringify(rule.conditionTree, null, 2)}
                  </pre>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'simulator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Play className="h-4 w-4 text-primary" /> Dry-Run Rule Evaluation
            </h2>
            <p className="text-xs text-muted">
              Select a rule and simulate execution against sample fact payloads deterministically
              without modifying database state.
            </p>

            <div>
              <label className="block text-xs font-medium text-muted uppercase mb-1">
                Target Rule
              </label>
              <select
                value={selectedRuleId}
                onChange={(e) => setSelectedRuleId(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-surface border border-border rounded-md text-foreground"
              >
                {definitions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.key} v{d.version})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted uppercase mb-1">
                Facts JSON
              </label>
              <textarea
                rows={8}
                value={simulationFactsJson}
                onChange={(e) => setSimulationFactsJson(e.target.value)}
                className="w-full text-xs font-mono p-3 bg-surface-muted border border-border rounded-md text-foreground"
              />
            </div>

            <button
              disabled={simulating}
              onClick={handleSimulate}
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              {simulating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run Rule Simulation
            </button>
          </div>

          {/* Trace Output */}
          <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" /> Evaluation Trace
            </h2>

            {simulationResult ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg flex items-center gap-3 ${
                    simulationResult.passed
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {simulationResult.passed ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <XCircle className="h-6 w-6" />
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      Evaluation Result:{' '}
                      {simulationResult.passed ? 'PASSED (TRUE)' : 'FAILED (FALSE)'}
                    </div>
                    <div className="text-xs opacity-80">
                      Evaluated At: {new Date(simulationResult.evaluatedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                    Recursive Trace Tree
                  </h3>
                  <pre className="p-4 bg-surface-muted border border-border rounded-lg text-xs font-mono overflow-x-auto text-foreground">
                    {JSON.stringify(simulationResult.trace, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-muted text-sm border border-dashed border-border rounded-lg">
                Click &quot;Run Rule Simulation&quot; to view execution traces and fact evaluation.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Whitelisted Facts Catalog
            </h2>
            <p className="text-xs text-muted">
              Pre-registered fact paths accessible by declarative rule expressions.
            </p>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-muted border-b border-border text-muted uppercase font-semibold">
              <tr>
                <th className="p-3">Fact Path</th>
                <th className="p-3">Type</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {facts.map((fact) => (
                <tr key={fact.path} className="hover:bg-surface-muted/50">
                  <td className="p-3 font-mono font-semibold text-primary">{fact.path}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-surface-muted border border-border rounded font-mono text-[10px]">
                      {fact.type}
                    </span>
                  </td>
                  <td className="p-3 text-muted">{fact.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
