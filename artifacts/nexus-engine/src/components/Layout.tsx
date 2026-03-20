import React, { useEffect } from 'react';
import { useEngineStore } from '@/store/engine-store';
import { useCreatePlayer } from '@workspace/api-client-react';
import { generateId } from '@/lib/utils';
import { Link, useLocation } from 'wouter';
import { Activity, Settings, User } from 'lucide-react';
import { motion } from 'framer-motion';

export function Layout({ children }: { children: React.ReactNode }) {
  const { playerId, setPlayerId } = useEngineStore();
  const createPlayer = useCreatePlayer();
  const [location] = useLocation();

  useEffect(() => {
    if (!playerId) {
      const newId = generateId();
      createPlayer.mutate(
        { data: { username: `Traveler_${newId.substring(0, 4)}`, settings: {} } },
        {
          onSuccess: (data) => {
            setPlayerId(data.id);
          },
          onError: (err) => {
            console.error("Failed to create player, generating local fallback", err);
            setPlayerId(newId); // Fallback for UI testing
          }
        }
      );
    }
  }, [playerId, setPlayerId, createPlayer]);

  const isGameScreen = location.startsWith('/game/');

  return (
    <div className="min-h-screen flex flex-col bg-grain text-foreground overflow-hidden selection:bg-accent-blue/30 selection:text-white">
      {!isGameScreen && (
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 w-full z-40 border-b border-border/50 bg-background/80 backdrop-blur-md"
        >
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <img 
                src={`${import.meta.env.BASE_URL}images/nexus-logo.png`} 
                alt="Nexus Logo" 
                className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(61,142,255,0.5)]"
              />
              <span className="font-display font-bold tracking-widest text-lg text-primary/90 group-hover:text-primary transition-colors">
                NEXUS<span className="text-accent-blue">ENGINE</span>
              </span>
            </Link>

            <nav className="flex items-center gap-6 text-sm font-mono text-muted-foreground">
              <Link href="/profile" className="hover:text-accent-teal transition-colors flex items-center gap-2">
                <User size={16} /> Profile
              </Link>
              {useEngineStore.getState().currentRunId && (
                <Link href={`/game/${useEngineStore.getState().currentRunId}`} className="hover:text-accent-blue transition-colors flex items-center gap-2">
                  <Activity size={16} /> Active Run
                </Link>
              )}
            </nav>
          </div>
        </motion.header>
      )}

      <main className={cn("flex-1 flex flex-col relative", !isGameScreen && "pt-16")}>
        {children}
      </main>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
