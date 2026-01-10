/**
 * Barra de player de áudio para jogadores
 * Exibe o que está tocando e controles básicos
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useCampaignAudio } from '@/hooks/campaign/useCampaignAudio';

interface AudioPlayerBarProps {
  campaignId: string;
}

export function AudioPlayerBar({ campaignId }: AudioPlayerBarProps) {
  const {
    audioLibrary,
    audioState,
    setMasterVolume,
    toggleMute
  } = useCampaignAudio(campaignId, false);

  // Obter nomes das tracks tocando
  const playingTrackNames = audioState?.playing_tracks
    .filter(t => t.is_playing)
    .map(t => {
      const audio = audioLibrary.find(a => a.id === t.audio_id);
      return audio?.name;
    })
    .filter(Boolean) || [];

  if (playingTrackNames.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="flex items-center gap-3 px-4 py-2 bg-card/95 backdrop-blur-sm border border-border/50 rounded-full shadow-lg">
          <Music className="w-4 h-4 text-primary animate-pulse" />
          
          <div className="max-w-[200px]">
            <p className="text-xs font-medium truncate">
              {playingTrackNames.join(', ')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={toggleMute}
            >
              {audioState?.is_muted ? (
                <VolumeX className="w-3 h-3" />
              ) : (
                <Volume2 className="w-3 h-3" />
              )}
            </Button>
            
            <div className="w-16">
              <Slider
                value={[audioState?.master_volume ?? 1]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={([v]) => setMasterVolume(v)}
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AudioPlayerBar;
