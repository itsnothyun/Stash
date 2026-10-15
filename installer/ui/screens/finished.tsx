import { CircleCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Platform, SetupError } from "../api";
import { Page } from "../components/chrome";

function Warnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <ul className="mt-4 max-w-md space-y-1 rounded-md border border-warning/30 bg-warning/5 px-3 py-2">
      {warnings.map((w) => (
        <li key={w} className="flex gap-2 text-2xs text-foreground/80">
          <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
          {w}
        </li>
      ))}
    </ul>
  );
}

export function DoneScreen({
  platform,
  warnings,
  onOpen,
  onClose,
}: {
  platform: Platform;
  warnings: string[];
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <Page
      actions={
        <>
          <Button variant="ghost" size="lg" onClick={onClose}>
            Close
          </Button>
          <Button size="lg" className="rounded-full px-5" onClick={onOpen} autoFocus>
            Open Stash
          </Button>
        </>
      }
    >
      <CircleCheck className="mt-4 h-12 w-12 text-success" strokeWidth={1.5} />
      <h1 className="mt-6 text-[26px] font-semibold leading-tight tracking-[-0.02em]">Stash is ready</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {platform === "windows"
          ? "Find it in your Start menu any time."
          : "Find it in your Applications folder any time."}
      </p>
      <Warnings warnings={warnings} />
    </Page>
  );
}

export function RemovedScreen({
  keptData,
  warnings,
  onClose,
}: {
  keptData: boolean;
  warnings: string[];
  onClose: () => void;
}) {
  return (
    <Page
      actions={
        <Button size="lg" className="rounded-full px-5" onClick={onClose} autoFocus>
          Close
        </Button>
      }
    >
      <CircleCheck className="mt-4 h-12 w-12 text-muted-foreground" strokeWidth={1.5} />
      <h1 className="mt-6 text-[26px] font-semibold leading-tight tracking-[-0.02em]">Stash has been removed</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {keptData
          ? "Your notes are kept. Reinstall Stash any time to pick up where you left off."
          : "Stash and your notes have been deleted from this computer."}
      </p>
      <Warnings warnings={warnings} />
    </Page>
  );
}

export function ErrorScreen({
  error,
  rolledBack,
  onRetry,
  onForceQuit,
  onBack,
}: {
  error: SetupError;
  /** Install failures roll back; removal failures may leave things half-done. */
  rolledBack: boolean;
  onRetry: () => void;
  onForceQuit: () => void;
  onBack: () => void;
}) {
  const stashRunning = error.code === "stash_running";
  return (
    <Page
      actions={
        <>
          <Button variant="ghost" size="lg" onClick={onBack}>
            Back
          </Button>
          {stashRunning && (
            <Button variant="outline" size="lg" onClick={onForceQuit}>
              Quit Stash for me
            </Button>
          )}
          <Button size="lg" className="rounded-full px-5" onClick={onRetry} autoFocus>
            Try again
          </Button>
        </>
      }
    >
      <TriangleAlert className="mt-4 h-12 w-12 text-warning" strokeWidth={1.5} />
      <h1 className="mt-6 text-[26px] font-semibold leading-tight tracking-[-0.02em]">
        {stashRunning ? "Stash is still open" : "Something went wrong"}
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{error.message}</p>
      {!stashRunning && (
        <p className="mt-3 text-2xs text-subtle">
          {rolledBack && "Nothing was changed. "}Details are in stash-setup.log in your temp folder.
        </p>
      )}
    </Page>
  );
}
