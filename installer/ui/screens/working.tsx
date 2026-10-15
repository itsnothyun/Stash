import type { Progress, Stage } from "../api";
import { Logo, Page, ProgressBar, StepDots } from "../components/chrome";
import { overallFraction } from "../wizard";

const stageLabel: Record<Stage, string> = {
  migrating: "Removing the previous version…",
  extracting: "Copying files…",
  finishing: "Creating shortcuts…",
  removing: "Removing files…",
};

/** Shared by installing and removing; only the title and dots differ. */
export function WorkingScreen({
  title,
  progress,
  showSteps,
}: {
  title: string;
  progress: Progress | null;
  showSteps: boolean;
}) {
  const fraction = overallFraction(progress);
  return (
    <Page footerStart={showSteps ? <StepDots index={2} /> : null}>
      <Logo className="mt-4" />
      <h1 className="mt-6 text-[26px] font-semibold leading-tight tracking-[-0.02em]">{title}</h1>
      <div className="mt-8 max-w-md">
        <ProgressBar fraction={fraction} />
        <div className="mt-2 flex justify-between text-2xs text-muted-foreground">
          <span>{progress ? stageLabel[progress.stage] : "Getting ready…"}</span>
          <span className="font-mono">{Math.round(fraction * 100)}%</span>
        </div>
      </div>
    </Page>
  );
}
