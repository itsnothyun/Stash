import React, { useState, useEffect } from "react";
import {
  ambientAudioEngine,
  SOUNDSCAPES_LIST,
  SoundscapeType,
} from "@/lib/sound/ambient-soundscapes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Volume2, VolumeX, Play, Square, Headphones, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AmbientSoundBarProps {
  className?: string;
  compact?: boolean;
}

export const AmbientSoundBar: React.FC<AmbientSoundBarProps> = ({
  className,
  compact = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(() => ambientAudioEngine.getIsPlaying());
  const [currentType, setCurrentType] = useState<SoundscapeType | null>(() =>
    ambientAudioEngine.getCurrentType()
  );
  const [volume, setVolume] = useState(() => ambientAudioEngine.getVolume());
  const [timerMinutes, setTimerMinutes] = useState<number | null>(() =>
    ambientAudioEngine.getTimerMinutes()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaying(ambientAudioEngine.getIsPlaying());
      setCurrentType(ambientAudioEngine.getCurrentType());
      setTimerMinutes(ambientAudioEngine.getTimerMinutes());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleTogglePlay = (type: SoundscapeType) => {
    if (isPlaying && currentType === type) {
      ambientAudioEngine.stop();
      setIsPlaying(false);
      setCurrentType(null);
    } else {
      ambientAudioEngine.play(type, timerMinutes || undefined);
      setIsPlaying(true);
      setCurrentType(type);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    ambientAudioEngine.setVolume(newVol);
  };

  const handleSetTimer = (mins: number | null) => {
    setTimerMinutes(mins);
    if (isPlaying && currentType) {
      ambientAudioEngine.play(currentType, mins || undefined);
    }
  };

  const activeDef = SOUNDSCAPES_LIST.find((s) => s.id === currentType);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Ambient focus soundscapes"
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer select-none",
            isPlaying
              ? "border-brand/50 bg-brand/10 text-brand shadow-xs ring-1 ring-brand/30"
              : "border-border/60 bg-surface/70 text-muted-foreground hover:bg-surface-hover hover:text-foreground",
            className
          )}
        >
          {isPlaying ? (
            <>
              <span className="text-xs">{activeDef?.icon || "🎧"}</span>
              <span className="truncate max-w-[100px] text-2xs font-semibold">
                {activeDef?.name || "Ambient"}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            </>
          ) : (
            <>
              <Headphones className="h-3.5 w-3.5" />
              {!compact && <span className="text-2xs">Focus Audio</span>}
            </>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-3 shadow-lg border border-border">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-1.5">
              <Headphones className="h-4 w-4 text-brand" />
              <span className="text-xs font-semibold text-foreground">
                Ambient Focus Audio
              </span>
            </div>
            {isPlaying && (
              <button
                type="button"
                onClick={() => ambientAudioEngine.stop()}
                className="flex items-center gap-1 text-[11px] font-medium text-destructive hover:underline cursor-pointer"
              >
                <Square className="h-2.5 w-2.5 fill-current" />
                Stop
              </button>
            )}
          </div>

          {/* Soundscapes Grid */}
          <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto pr-0.5">
            {SOUNDSCAPES_LIST.map((sound) => {
              const active = isPlaying && currentType === sound.id;
              return (
                <button
                  key={sound.id}
                  type="button"
                  onClick={() => handleTogglePlay(sound.id)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-2 text-left transition-all cursor-pointer",
                    active
                      ? "border-brand bg-brand/10 text-brand ring-1 ring-brand/30 font-medium"
                      : "border-border/60 hover:bg-surface-hover hover:border-border text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{sound.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate leading-tight">
                        {sound.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {sound.tagline}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 pl-1.5">
                    {active ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-brand-foreground">
                        <Square className="h-2.5 w-2.5 fill-current" />
                      </span>
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface border border-border text-muted-foreground">
                        <Play className="h-2.5 w-2.5 fill-current ml-0.5" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Volume Slider */}
          <div className="pt-2 border-t border-border/60 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                {volume === 0 ? (
                  <VolumeX className="h-3 w-3" />
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
                Volume
              </span>
              <span className="font-mono">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-brand cursor-pointer h-1.5 bg-surface-hover rounded-lg"
            />
          </div>

          {/* Auto-Stop Timer / Pomodoro Sync */}
          <div className="pt-2 border-t border-border/60">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Sleep / Focus Timer
              </span>
              {timerMinutes && (
                <span className="text-[10px] font-mono text-brand font-semibold">
                  {timerMinutes}m set
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {[
                { label: "Off", val: null },
                { label: "15m", val: 15 },
                { label: "25m (Pomo)", val: 25 },
                { label: "45m", val: 45 },
                { label: "60m", val: 60 },
              ].map((opt) => {
                const isSelected = timerMinutes === opt.val;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleSetTimer(opt.val)}
                    className={cn(
                      "flex-1 py-1 rounded text-[10px] font-medium border text-center transition-all cursor-pointer",
                      isSelected
                        ? "bg-brand/10 border-brand text-brand font-semibold"
                        : "bg-surface border-border text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
