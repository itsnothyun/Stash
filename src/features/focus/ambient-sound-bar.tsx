import React, { useEffect, useState, useSyncExternalStore } from "react";
import {
  ambientAudioEngine,
  SOUNDSCAPES_LIST,
  SOUNDSCAPE_PRESETS,
  SoundscapeType,
} from "@/lib/sound/ambient-soundscapes";
import { formatRemaining } from "@/lib/sound/ambient-dsp";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Volume2, VolumeX, Volume1, Play, Pause, Headphones, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AmbientSoundBarProps {
  className?: string;
}

const TIMER_OPTIONS: { label: string; minutes: number | null }[] = [
  { label: "Off", minutes: null },
  { label: "15m", minutes: 15 },
  { label: "25m", minutes: 25 },
  { label: "45m", minutes: 45 },
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
];

const NAMES = Object.fromEntries(SOUNDSCAPES_LIST.map((s) => [s.id, s])) as Record<
  SoundscapeType,
  (typeof SOUNDSCAPES_LIST)[number]
>;

function useMixer() {
  return useSyncExternalStore(
    (cb) => ambientAudioEngine.subscribe(cb),
    ambientAudioEngine.getSnapshot,
    ambientAudioEngine.getSnapshot
  );
}

/** Re-renders every second while a sleep timer is counting down. */
function useCountdown(endsAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endsAt) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return endsAt ? Math.max(0, endsAt - now) : null;
}

/** Three bouncing bars that show audio is live. */
const EqualizerBars: React.FC<{ className?: string }> = ({ className }) => (
  <span aria-hidden className={cn("flex h-3 items-end gap-[2px]", className)}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="focus-eq-bar w-[3px] rounded-full bg-current"
        style={{ animationDelay: `${i * 0.18}s` }}
      />
    ))}
  </span>
);

const Slider: React.FC<{
  value: number;
  onChange: (value: number) => void;
  label: string;
  className?: string;
}> = ({ value, onChange, label, className }) => (
  <input
    type="range"
    min={0}
    max={1}
    step={0.01}
    value={value}
    aria-label={label}
    aria-valuetext={`${Math.round(value * 100)}%`}
    onChange={(e) => onChange(parseFloat(e.target.value))}
    onClick={(e) => e.stopPropagation()}
    className={cn("h-1.5 w-full cursor-pointer accent-brand", className)}
  />
);

export const AmbientSoundBar: React.FC<AmbientSoundBarProps> = ({ className }) => {
  const mixer = useMixer();
  const remainingMs = useCountdown(mixer.timerEndsAt);
  const { active, isPlaying, volume, levels } = mixer;

  const mixLabel =
    active.length === 0
      ? "Focus Audio"
      : active.length === 1
        ? NAMES[active[0]].name
        : `${NAMES[active[0]].name} +${active.length - 1}`;

  const activePreset = SOUNDSCAPE_PRESETS.find((preset) => {
    const ids = Object.keys(preset.layers);
    return ids.length === active.length && ids.every((id) => active.includes(id as SoundscapeType));
  });

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={isPlaying ? `Focus audio playing: ${mixLabel}` : "Focus audio"}
          title={isPlaying ? `Playing ${mixLabel}` : "Ambient focus soundscapes"}
          className={cn(
            "flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-xs font-medium transition-all cursor-pointer select-none",
            isPlaying
              ? "border-brand/50 bg-brand/10 text-brand shadow-xs ring-1 ring-brand/30"
              : "border-border/60 bg-surface/70 text-muted-foreground hover:bg-surface-hover hover:text-foreground",
            className
          )}
        >
          {isPlaying ? <EqualizerBars /> : <Headphones className="h-3.5 w-3.5" />}
          <span className="hidden max-w-[120px] truncate text-2xs font-semibold xl:inline">{mixLabel}</span>
          {remainingMs !== null && (
            <span className="font-mono text-[10px] tabular-nums opacity-80">{formatRemaining(remainingMs)}</span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={6}
        collisionPadding={12}
        className="w-[min(22rem,calc(100vw-1.5rem))] max-h-[min(40rem,var(--radix-popover-content-available-height))] overflow-y-auto p-0 shadow-lg border border-border"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border/60 bg-popover/95 px-3 py-2.5 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                isPlaying ? "bg-brand/15 text-brand" : "bg-muted text-muted-foreground"
              )}
            >
              {isPlaying ? <EqualizerBars /> : <Headphones className="h-3.5 w-3.5" />}
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground">Focus Audio</div>
              <div className="truncate text-[10px] text-muted-foreground">
                {isPlaying
                  ? activePreset?.name ?? active.map((id) => NAMES[id].name).join(" · ")
                  : "Mix soundscapes to block distractions"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => (isPlaying ? ambientAudioEngine.stopAll() : ambientAudioEngine.resume())}
            aria-label={isPlaying ? "Pause focus audio" : "Resume last mix"}
            title={isPlaying ? "Pause" : "Resume last mix"}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer",
              isPlaying
                ? "bg-brand text-brand-foreground hover:bg-brand/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}
          </button>
        </div>

        <div className="space-y-3 p-3">
          {/* Presets */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mixes</div>
            <div className="flex flex-wrap gap-1.5">
              {SOUNDSCAPE_PRESETS.map((preset) => {
                const selected = activePreset?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      selected ? ambientAudioEngine.stopAll() : ambientAudioEngine.playPreset(preset)
                    }
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                      selected
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border/70 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                    )}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Soundscapes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Soundscapes</span>
              <span className="font-normal normal-case tracking-normal">Tap to layer</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {SOUNDSCAPES_LIST.map((sound) => {
                const on = active.includes(sound.id);
                return (
                  <div
                    key={sound.id}
                    className={cn(
                      "rounded-lg border transition-colors",
                      on ? "border-brand/60 bg-brand/[0.07]" : "border-border/60 hover:bg-surface-hover"
                    )}
                  >
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => ambientAudioEngine.toggle(sound.id)}
                      title={sound.tagline}
                      className="flex w-full items-center gap-2 p-2 text-left cursor-pointer"
                    >
                      <span className="text-base leading-none" aria-hidden>
                        {sound.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-xs font-semibold", on ? "text-brand" : "text-foreground")}>
                          {sound.name}
                        </span>
                        <span className="block truncate text-[10px] text-muted-foreground">{sound.tagline}</span>
                      </span>
                      {on && <EqualizerBars className="text-brand" />}
                    </button>
                    {on && (
                      <div className="px-2 pb-2">
                        <Slider
                          value={levels[sound.id]}
                          onChange={(v) => ambientAudioEngine.setLevel(sound.id, v)}
                          label={`${sound.name} level`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Master volume */}
          <div className="space-y-1.5 border-t border-border/60 pt-3">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <button
                type="button"
                onClick={() => ambientAudioEngine.setVolume(volume === 0 ? 0.5 : 0)}
                aria-label={volume === 0 ? "Unmute" : "Mute"}
                className="flex items-center gap-1 hover:text-foreground cursor-pointer"
              >
                <VolumeIcon className="h-3.5 w-3.5" />
                Master volume
              </button>
              <span className="font-mono tabular-nums">{Math.round(volume * 100)}%</span>
            </div>
            <Slider value={volume} onChange={(v) => ambientAudioEngine.setVolume(v)} label="Master volume" />
          </div>

          {/* Sleep timer */}
          <div className="space-y-1.5 border-t border-border/60 pt-3">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Stop after
              </span>
              {remainingMs !== null && (
                <span className="font-mono text-[11px] font-semibold tabular-nums text-brand">
                  {formatRemaining(remainingMs)} left
                </span>
              )}
            </div>
            <div className="grid grid-cols-6 gap-1">
              {TIMER_OPTIONS.map((opt) => {
                const selected = mixer.timerMinutes === opt.minutes;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => ambientAudioEngine.setTimer(opt.minutes)}
                    className={cn(
                      "rounded border py-1 text-[10px] font-medium transition-colors cursor-pointer",
                      selected
                        ? "border-brand bg-brand/10 text-brand font-semibold"
                        : "border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground/80">Fades out gently over the last few seconds.</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
