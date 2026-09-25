import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, PushPin as Pin } from "@phosphor-icons/react";
import { StashLogo } from "@/components/shared/stash-logo";
import { WindowControls } from "@/components/desktop/window-controls";
import { formatShortcut, SHORTCUTS } from "@/lib/keyboard/shortcuts";
import { cn } from "@/lib/utils/cn";

interface OnboardingScreenProps {
  onCreateFirst: () => void;
  onGoToDashboard: () => void;
}

const STEPS = [
  {
    kicker: "Capture",
    title: "Capture without friction",
    body: "From anywhere. It’s already saved as you type.",
  },
  {
    kicker: "Float",
    title: "Keep it above your work",
    body: "Pin a stash and it stays on top of whatever you’re doing.",
  },
  {
    kicker: "Tasks",
    title: "A checklist lives in the note",
    body: "One stash. Drop a task list in the same place you write.",
  },
] as const;

/**
 * First-run welcome. Three steps, then a way into a new stash or the library.
 * It does not return on its own; Settings can open it again.
 */
export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onCreateFirst,
  onGoToDashboard,
}) => {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const last = step === STEPS.length - 1;

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(Math.min(Math.max(next, 0), STEPS.length - 1));
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "ArrowRight" && !last) {
        event.preventDefault();
        go(step + 1);
      } else if (event.key === "ArrowLeft" && step > 0) {
        event.preventDefault();
        go(step - 1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (last) onCreateFirst();
        else go(step + 1);
      } else if (event.key === "Escape") {
        event.preventDefault();
        onGoToDashboard();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step, last, onCreateFirst, onGoToDashboard]);

  const slide = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: direction * 28 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: direction * -24 },
      };

  return (
    <div className="flex h-screen w-screen select-none flex-col overflow-hidden bg-background text-foreground">
      <div
        data-tauri-drag-region
        className="drag-region flex h-11 shrink-0 items-center justify-between pl-4"
      >
        <StashLogo size={17} showText />
        <div className="no-drag-region flex items-center">
          <button
            type="button"
            onClick={onGoToDashboard}
            className="mr-1 rounded-sm px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            Skip
          </button>
          <WindowControls />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-8 pb-10">
        <div className="w-full max-w-[440px]">
          <div className="relative h-[292px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                initial={slide.initial}
                animate={slide.animate}
                exit={slide.exit}
                transition={
                  reduce
                    ? { duration: 0.01 }
                    : { type: "spring", stiffness: 420, damping: 34, mass: 0.8 }
                }
                className="absolute inset-0 flex flex-col items-center text-center"
              >
                <Demo step={step} />
                <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {STEPS[step].kicker}
                </p>
                <h1 className="mt-1.5 text-[1.375rem] font-semibold tracking-tight">
                  {STEPS[step].title}
                </h1>
                <p className="mt-1.5 max-w-[320px] text-xs leading-relaxed text-muted-foreground">
                  {STEPS[step].body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-2 flex items-center justify-center gap-1.5" role="tablist" aria-label="Welcome steps">
            {STEPS.map((item, index) => (
              <button
                key={item.kicker}
                type="button"
                role="tab"
                aria-selected={index === step}
                aria-label={item.title}
                onClick={() => go(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  index === step ? "w-4 bg-foreground" : "w-1.5 bg-foreground/25 hover:bg-foreground/45"
                )}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center gap-2">
            {last ? (
              <>
                <button
                  type="button"
                  onClick={onCreateFirst}
                  className="inline-flex h-9 items-center gap-1.5 rounded bg-primary px-4 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                >
                  Create your first stash
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onGoToDashboard}
                  className="h-8 rounded px-3 text-xs text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                >
                  Go to My Dashboard
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => go(step + 1)}
                className="inline-flex h-9 items-center gap-1.5 rounded bg-primary px-4 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Demo: React.FC<{ step: number }> = ({ step }) => {
  if (step === 0) return <CaptureDemo />;
  if (step === 1) return <FloatDemo />;
  return <TasksDemo />;
};

const CaptureDemo: React.FC = () => {
  const reduce = useReducedMotion();
  const line = "Ship the notes before lunch";
  return (
    <div className="flex h-[148px] w-full items-center justify-center">
      <div className="w-[260px] rounded-lg border border-border bg-surface-elevated px-3.5 py-3 text-left shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-medium text-muted-foreground">New stash</span>
          <kbd className="rounded-xs border border-border px-1 py-px font-mono text-[10px] text-muted-foreground">
            {formatShortcut(SHORTCUTS.quickCapture)}
          </kbd>
        </div>
        <p className="min-h-[1.25rem] text-xs font-medium tracking-tight">
          {reduce ? (
            line
          ) : (
            <motion.span
              initial={{ width: 0 }}
              animate={{ width: "auto" }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block overflow-hidden whitespace-nowrap align-bottom"
            >
              {line}
            </motion.span>
          )}
          {!reduce && (
            <motion.span
              aria-hidden
              className="ml-px inline-block h-3 w-px translate-y-px bg-foreground"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            />
          )}
        </p>
        <p className="mt-2 text-[10px] text-muted-foreground">Saved</p>
      </div>
    </div>
  );
};

const FloatDemo: React.FC = () => {
  const reduce = useReducedMotion();
  return (
    <div className="flex h-[148px] w-full items-center justify-center">
      <motion.div
        className="w-[220px] rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-left shadow-md"
        initial={reduce ? undefined : { y: 10, scale: 0.98 }}
        animate={reduce ? undefined : { y: -6, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Above the editor</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-foreground/10">
            <Pin className="h-3 w-3" weight="fill" />
          </span>
        </div>
        <div className="mt-2 space-y-1">
          <div className="h-1.5 w-4/5 rounded-full bg-foreground/15" />
          <div className="h-1.5 w-3/5 rounded-full bg-foreground/10" />
        </div>
      </motion.div>
    </div>
  );
};

const TASKS = [
  { text: "Write the outline", done: true },
  { text: "Drop in a checklist", done: true },
  { text: "Leave the rest as prose", done: false },
];

const TasksDemo: React.FC = () => {
  const reduce = useReducedMotion();
  return (
    <div className="flex h-[148px] w-full items-center justify-center">
      <div className="w-[240px] rounded-lg border border-border bg-surface-elevated px-3.5 py-3 text-left shadow-sm">
        <p className="text-[10px] text-muted-foreground">Morning notes</p>
        <ul className="mt-2 space-y-1.5">
          {TASKS.map((task, index) => (
            <motion.li
              key={task.text}
              className="flex items-center gap-2"
              initial={reduce ? undefined : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.12 * index, duration: 0.25 }}
            >
              <span
                className={cn(
                  "flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border",
                  task.done
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground/30"
                )}
              >
                {task.done && <Check className="h-2.5 w-2.5" weight="bold" />}
              </span>
              <span
                className={cn(
                  "text-xs",
                  task.done ? "text-muted-foreground line-through" : "text-foreground"
                )}
              >
                {task.text}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
};
