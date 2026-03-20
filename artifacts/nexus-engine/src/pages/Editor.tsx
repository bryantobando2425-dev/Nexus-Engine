import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useEngineStore } from '@/store/engine-store';
import { GenerateNarrativeBodyVoice } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export default function Editor() {
  const { runId } = useParams<{ runId: string }>();
  const { narrativeVoice, setNarrativeVoice, explicitMode, setExplicitMode } = useEngineStore();
  const [activeTab, setActiveTab] = useState('narrative');

  const tabs = [
    { id: 'narrative', label: 'NARRATIVE' },
    { id: 'world', label: 'WORLD' },
    { id: 'character', label: 'CHARACTER' },
    { id: 'legacy', label: 'LEGACY' }
  ];

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-accent-amber mb-2">Engine Editor</h1>
        <p className="font-mono text-xs text-muted-foreground">OVERRIDE PARAMETERS FOR RUN: {runId}</p>
      </div>

      <div className="flex border-b border-border/50 mb-8 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-mono text-sm tracking-widest transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'border-accent-amber text-accent-amber bg-accent-amber/5' 
                : 'border-transparent text-muted-foreground hover:text-primary hover:bg-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border/50 rounded-xl p-8 shadow-2xl">
        
        {activeTab === 'narrative' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-serif mb-4 text-primary">Narrative Voice</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(GenerateNarrativeBodyVoice).map(voice => (
                  <button
                    key={voice}
                    onClick={() => setNarrativeVoice(voice)}
                    className={`p-4 text-left border rounded-md font-mono text-sm transition-all ${
                      narrativeVoice === voice 
                        ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' 
                        : 'border-border/50 bg-background text-muted-foreground hover:border-accent-blue/50'
                    }`}
                  >
                    {voice.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-xs font-serif italic text-muted-foreground mt-3">
                Changes how the AI narrator constructs responses immediately.
              </p>
            </div>

            <div className="pt-6 border-t border-border/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif text-primary">Explicit Mode</h3>
                <p className="text-xs font-serif text-muted-foreground">Enable unfiltered narration of violent/mature events.</p>
              </div>
              <Switch checked={explicitMode} onCheckedChange={setExplicitMode} />
            </div>
          </div>
        )}

        {activeTab !== 'narrative' && (
          <div className="text-center py-12">
            <p className="font-mono text-muted-foreground">Editor module "{activeTab}" is locked in this build.</p>
            <Button variant="outline" className="mt-4 border-border/50" disabled>REQUEST UNLOCK</Button>
          </div>
        )}

      </div>
    </div>
  );
}
