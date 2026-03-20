import React from 'react';
import { useEngineStore } from '@/store/engine-store';
import { useGetPlayerStats, useGetPlayerRuns, useGetPlayerMoments } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { Skull, Clock, Target, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function Profile() {
  const { playerId } = useEngineStore();
  
  // Queries
  const { data: stats, isLoading: statsLoading } = useGetPlayerStats(playerId || '');
  const { data: runs } = useGetPlayerRuns(playerId || '');
  const { data: moments } = useGetPlayerMoments(playerId || '');

  if (!playerId) {
    return <div className="p-12 text-center text-muted-foreground font-mono">No identity established.</div>;
  }

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-12 pb-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <h1 className="text-4xl font-display font-bold mb-2">Legacy & History</h1>
        <p className="text-muted-foreground font-serif italic">The accumulated echoes of your past lives.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard icon={<Target className="text-accent-teal" />} title="Runs Completed" value={stats?.totalRuns ?? 0} />
        <StatCard icon={<Clock className="text-accent-blue" />} title="Years Lived" value={stats?.totalInGameYears ?? 0} />
        <StatCard icon={<Skull className="text-destructive" />} title="Deaths" value={Object.values(stats?.deathsByCause || {}).reduce((a,b)=>a+b, 0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Historial */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-display font-semibold border-b border-border/50 pb-2">Chronicles</h2>
          <div className="space-y-4">
            {runs?.map((run) => (
              <div key={run.id} className="bg-surface/50 border border-border/50 rounded-lg p-6 hover:bg-surface transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-serif text-lg text-primary/90 group-hover:text-primary">{run.character.name as string || 'Unknown'}</h3>
                  <span className="font-mono text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                    {run.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm font-mono text-muted-foreground space-x-4 mb-4">
                  <span>ERA: {run.eraConfig.year as string}</span>
                  <span>END: {run.endCause || 'None'}</span>
                </div>
                {run.summary && (
                  <p className="text-sm font-serif italic text-gray-400 border-l-2 border-accent-blue/30 pl-4 py-1">
                    "{run.summary}"
                  </p>
                )}
              </div>
            ))}
            {(!runs || runs.length === 0) && (
              <div className="text-center py-12 border border-dashed border-border/50 rounded-lg text-muted-foreground font-mono text-sm">
                No history recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Moments Gallery */}
        <div>
          <h2 className="text-xl font-display font-semibold border-b border-border/50 pb-2 mb-6 flex items-center gap-2">
            <ImageIcon size={18} className="text-accent-amber" /> 
            Captured Moments
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Mock Moments if none exist for visual completeness */}
            {(moments && moments.length > 0 ? moments : [1,2,3,4]).map((m, i) => (
              <div key={i} className="aspect-square bg-surface border border-border/50 rounded-md overflow-hidden relative group">
                {typeof m === 'object' ? (
                  <img src={m.imageUrl} alt="Moment" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <img src={`${import.meta.env.BASE_URL}images/moment-placeholder.png`} alt="Placeholder" className="w-full h-full object-cover opacity-30 group-hover:opacity-70 transition-opacity grayscale" />
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, title, value }: { icon: React.ReactNode, title: string, value: number | string }) {
  return (
    <div className="bg-surface/30 border border-border/50 rounded-xl p-6 flex items-center gap-4 backdrop-blur-sm">
      <div className="p-3 bg-background rounded-lg border border-border/50">
        {icon}
      </div>
      <div>
        <p className="text-sm font-mono text-muted-foreground">{title}</p>
        <p className="text-2xl font-display font-bold">{value}</p>
      </div>
    </div>
  );
}
