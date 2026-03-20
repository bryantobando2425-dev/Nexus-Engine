import React from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Play, User, History, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEngineStore } from '@/store/engine-store';

export default function Home() {
  const [, setLocation] = useLocation();
  const { currentRunId } = useEngineStore();

  return (
    <div className="relative flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-background/80 mix-blend-multiply z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background z-20" />
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Atmospheric Background" 
          className="w-full h-full object-cover opacity-40 scale-105 animate-pulse-slow"
        />
      </div>

      <div className="relative z-30 max-w-2xl w-full px-6 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-12"
        >
          <img 
            src={`${import.meta.env.BASE_URL}images/nexus-logo.png`}
            alt="NEXUS" 
            className="w-24 h-24 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(61,142,255,0.4)]"
          />
          <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 drop-shadow-sm">
            A LIFE
          </h1>
          <p className="text-muted-foreground font-serif text-lg md:text-xl italic max-w-lg mx-auto">
            "Live any life, in any era, on Earth. No objectives. Just existence."
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col gap-4 w-full max-w-sm"
        >
          {currentRunId && (
            <Button 
              variant="cinematic" 
              size="lg" 
              className="w-full text-accent-blue border-accent-blue/30"
              onClick={() => setLocation(`/game/${currentRunId}`)}
            >
              <Play className="w-4 h-4 mr-2" />
              Continue Existence
            </Button>
          )}

          <Button 
            variant="cinematic" 
            size="lg" 
            className="w-full"
            onClick={() => setLocation('/new-run')}
          >
            <History className="w-4 h-4 mr-2" />
            Start New Life
          </Button>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button 
              variant="outline" 
              className="w-full font-mono text-xs border-border/50 hover:border-accent-teal/50"
              onClick={() => setLocation('/profile')}
            >
              <User className="w-4 h-4 mr-2" />
              Legacy
            </Button>
            <Button 
              variant="outline" 
              className="w-full font-mono text-xs border-border/50 hover:border-accent-amber/50"
              onClick={() => {}}
              disabled
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
