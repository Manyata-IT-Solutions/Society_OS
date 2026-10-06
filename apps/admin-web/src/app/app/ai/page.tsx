'use client';
import { useState } from 'react';
import { Bot, Send, ShieldCheck, FileText } from 'lucide-react';

export default function GovernedAIAssistantPage() {
  const [messages] = useState([
    {
      role: 'assistant',
      text: 'Good morning! Here is your daily operational summary: Collection efficiency is at 95.8% (₹11.97L collected), all high-criticality assets are operational, and there are zero active emergency incidents.',
      sources: ['Metric:finance.collection_efficiency', 'Asset:status_registry'],
    },
  ]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Bot className="h-6 w-6 text-rose-500" /> Governed Enterprise AI Assistant
        </h1>
        <p className="text-sm text-muted">Strictly grounded natural language analytics, document Q&A, and daily operational briefs. Zero autonomous mutations.</p>
      </div>

      <div className="border border-border rounded-lg bg-surface p-4 min-h-[400px] flex flex-col justify-between">
        <div className="space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-surface-muted space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-600">
                <ShieldCheck className="h-4 w-4" /> Grounded AI Response
              </div>
              <p className="text-sm text-foreground">{m.text}</p>
              <div className="flex gap-2 pt-2 border-t border-border/50">
                {m.sources.map((s, sIdx) => (
                  <span key={sIdx} className="text-[11px] px-2 py-0.5 bg-surface text-muted rounded border border-border flex items-center gap-1">
                    <FileText className="h-3 w-3" /> {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 flex gap-2">
          <input
            type="text"
            placeholder="Ask a question about estate finances, tickets, assets, compliance, or parking rules..."
            className="flex-1 px-4 py-2 bg-surface border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium flex items-center gap-1.5">
            <Send className="h-4 w-4" /> Ask
          </button>
        </div>
      </div>
    </div>
  );
}
