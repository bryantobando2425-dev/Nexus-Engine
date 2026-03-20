import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'wouter';
import { useGetRun, useGenerateNarrative, useGetRunEvents, GenerateNarrativeBodyVoice } from '@workspace/api-client-react';
import { useEngineStore } from '@/store/engine-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Map as MapIcon, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

export default function Game() {
  const { runId } = useParams<{ runId: string }>();
  const { playerId, narrativeVoice } = useEngineStore();
  
  const { data: run, isLoading: isRunLoading } = useGetRun(runId || '');
  const { data: events, refetch: refetchEvents } = useGetRunEvents(runId || '');
  const generateNarrative = useGenerateNarrative();

  const [inputAction, setInputAction] = useState('');
  const [localHistory, setLocalHistory] = useState<{role: 'user'|'narrator', text: string, img?: string}[]>([]);
  
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localHistory]);

  // Procedural Map Placeholder Generator
  useEffect(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0c0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw some noise for terrain
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const val = Math.random();
      if (val > 0.9) ctx.fillStyle = 'rgba(61,142,255,0.2)'; // water
      else if (val > 0.7) ctx.fillStyle = 'rgba(0,212,168,0.1)'; // forest
      else ctx.fillStyle = 'rgba(255,255,255,0.02)'; // plains
      
      ctx.fillRect(x, y, 4, 4);
    }
    
    // Draw player pos
    ctx.fillStyle = '#f5a623';
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#f5a623';

  }, [runId]);

  // Initial load simulation
  useEffect(() => {
    if (events && events.length > 0 && localHistory.length === 0) {
      setLocalHistory(events.map(e => ({ role: 'narrator', text: e.narrativeSnapshot })));
    } else if (localHistory.length === 0) {
      setLocalHistory([{ 
        role: 'narrator', 
        text: `You awaken. The air is cold. You are ${run?.character?.name || 'alive'}. It is the year ${run?.eraConfig?.year || 'unknown'}. What do you do?` 
      }]);
    }
  }, [events, run, localHistory.length]);

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAction.trim() || generateNarrative.isPending) return;

    const actionText = inputAction;
    setInputAction('');
    setLocalHistory(prev => [...prev, { role: 'user', text: actionText }]);

    generateNarrative.mutate({
      data: {
        runId,
        playerId: playerId || '',
        gameConfig: { name: 'A Life' },
        voice: narrativeVoice,
        tone: { realism: 9 },
        character: run?.character || {},
        worldState: { weather: 'overcast' },
        playerAction: actionText,
        currentLocation: { name: 'Unknown', description: 'Wilderness' },
        inGameDateTime: 'Morning',
        era: run?.eraConfig || {}
      }
    }, {
      onSuccess: (data) => {
        setLocalHistory(prev => [
          ...prev, 
          { 
            role: 'narrator', 
            text: data.narrative,
            img: data.shouldGenerateImage ? `${import.meta.env.BASE_URL}images/moment-placeholder.png` : undefined
          }
        ]);
        refetchEvents();
      },
      onError: (err) => {
        setLocalHistory(prev => [...prev, { role: 'narrator', text: "The universe failed to respond to your action. (API Error)" }]);
      }
    });
  };

  if (isRunLoading) return <div className="h-screen flex items-center justify-center font-mono text-muted-foreground animate-pulse">Initializing World State...</div>;

  return (
    <div className="h-screen w-full flex overflow-hidden bg-background relative z-10 pt-0">
      {/* Top persistent nav for game */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Link href={`/editor/${runId}`}>
          <Button variant="outline" size="icon" className="bg-surface/50 backdrop-blur border-border/50">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </Button>
        </Link>
        <Link href="/profile">
          <Button variant="outline" size="icon" className="bg-surface/50 backdrop-blur border-border/50">
            <User className="w-4 h-4 text-muted-foreground" />
          </Button>
        </Link>
      </div>

      {/* Left Status Panel */}
      <div className="w-64 border-r border-border/30 bg-surface/40 backdrop-blur-md p-6 flex flex-col hidden md:flex">
        <h3 className="font-display font-bold text-lg text-primary/80 border-b border-border/50 pb-2 mb-6 uppercase tracking-wider">
          {run?.character?.name || 'Entity'}
        </h3>
        
        <div className="space-y-5">
          <StatBar label="Health" value={run?.character?.stats?.health ?? 100} color="bg-accent-teal" />
          <StatBar label="Energy" value={run?.character?.stats?.hunger ?? 80} color="bg-accent-amber" />
          <StatBar label="Morale" value={run?.character?.stats?.morale ?? 60} color="bg-accent-blue" />
          <StatBar label="Sanity" value={run?.character?.stats?.mentalHealth ?? 90} color="bg-white/80" />
        </div>

        <div className="mt-auto pt-6 border-t border-border/50 space-y-2">
          <div className="text-xs font-mono text-muted-foreground flex justify-between">
            <span>YEAR</span>
            <span className="text-primary">{run?.eraConfig?.year || '----'}</span>
          </div>
          <div className="text-xs font-mono text-muted-foreground flex justify-between">
            <span>LOC</span>
            <span className="text-primary truncate ml-2">Wilderness</span>
          </div>
        </div>
      </div>

      {/* Center Narrative Panel */}
      <div className="flex-1 flex flex-col relative max-w-3xl mx-auto w-full shadow-2xl shadow-black/50 border-x border-border/20 bg-surface/20">
        
        {/* Story Scroll */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 pb-32">
          <AnimatePresence initial={false}>
            {localHistory.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn(
                  "max-w-2xl mx-auto",
                  item.role === 'user' ? "text-right" : "text-left"
                )}
              >
                {item.role === 'user' ? (
                  <div className="inline-block px-4 py-2 bg-surface border border-border/50 rounded-lg text-sm font-mono text-muted-foreground">
                    &gt; {item.text}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="font-serif text-[1.1rem] md:text-lg leading-relaxed text-gray-300 drop-shadow-sm">
                      {item.text}
                    </p>
                    {item.img && (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}
                        className="w-[110%] -ml-[5%] my-8 border-y border-border/50 relative group overflow-hidden"
                      >
                         <div className="absolute inset-0 bg-accent-blue/10 mix-blend-overlay group-hover:bg-transparent transition-colors duration-1000 z-10" />
                         <img src={item.img} alt="Moment" className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000" />
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {generateNarrative.isPending && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center py-4">
              <span className="inline-block w-2 h-2 bg-accent-teal rounded-full animate-pulse mr-1" />
              <span className="inline-block w-2 h-2 bg-accent-teal rounded-full animate-pulse delay-75 mr-1" />
              <span className="inline-block w-2 h-2 bg-accent-teal rounded-full animate-pulse delay-150" />
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent pt-12">
          <form onSubmit={handleAction} className="relative max-w-2xl mx-auto">
            <Input 
              value={inputAction}
              onChange={e => setInputAction(e.target.value)}
              placeholder="What do you do?"
              className="h-14 pl-6 pr-14 bg-surface/80 backdrop-blur border-border/60 font-serif text-lg shadow-lg focus-visible:ring-accent-teal"
              disabled={generateNarrative.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              variant="ghost" 
              className="absolute right-2 top-2 text-muted-foreground hover:text-accent-teal hover:bg-transparent"
              disabled={generateNarrative.isPending || !inputAction.trim()}
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Right Map Panel */}
      <div className="w-72 border-l border-border/30 bg-surface/40 backdrop-blur-md p-4 flex flex-col hidden lg:flex">
        <div className="flex items-center gap-2 mb-4 text-muted-foreground border-b border-border/50 pb-2">
          <MapIcon size={16} />
          <span className="font-mono text-xs tracking-widest">WORLD ATLAS</span>
        </div>
        <div className="flex-1 bg-background border border-border/50 rounded-md overflow-hidden relative group">
           <canvas 
            ref={mapCanvasRef} 
            width={256} 
            height={400} 
            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
          />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMCAwdjhINHYtOEgwem00IDR2NGg0VjRINFoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiLz48L3N2Zz4=')] opacity-20 pointer-events-none" />
        </div>
      </div>

    </div>
  );
}

function StatBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-mono mb-1.5 text-muted-foreground">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <Progress value={value} indicatorColor={color} className="h-1.5 bg-background border-none" />
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
