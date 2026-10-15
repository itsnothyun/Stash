import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Context, DirCheck, Options } from "../api";
import { Checkbox, Page, StepDots } from "../components/chrome";
import { formatBytes } from "../wizard";

export function OptionsScreen({
  context,
  options,
  dirCheck,
  canInstall,
  onChange,
  onPickFolder,
  onBack,
  onInstall,
}: {
  context: Context;
  options: Options;
  dirCheck: DirCheck | null;
  canInstall: boolean;
  onChange: (patch: Partial<Options>) => void;
  onPickFolder: () => void;
  onBack: () => void;
  onInstall: () => void;
}) {
  const isWindows = context.platform === "windows";
  // Updates and repairs happen where Stash already lives.
  const folderLocked = context.installed !== null;

  return (
    <Page
      footerStart={<StepDots index={1} />}
      actions={
        <>
          <Button variant="ghost" size="lg" onClick={onBack}>
            Back
          </Button>
          <Button size="lg" className="rounded-full px-5" disabled={!canInstall} onClick={onInstall}>
            {context.mode.kind === "fresh" ? "Install" : context.mode.kind === "repair" ? "Repair" : "Update"}
          </Button>
        </>
      }
    >
      <h1 className="text-lg font-semibold tracking-[-0.01em]">Options</h1>

      <p className="mt-4 text-2xs font-medium uppercase tracking-wider text-subtle">
        {isWindows ? "Install folder" : "Install into"}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <div
          title={options.dir}
          className="flex h-9 min-w-0 flex-1 items-center rounded border border-input bg-surface-elevated px-3 font-mono text-xs text-foreground/80"
        >
          <span className="truncate">{options.dir}</span>
        </div>
        {!folderLocked && (
          <Button variant="outline" size="lg" onClick={onPickFolder}>
            <FolderOpen className="h-3.5 w-3.5" />
            Change
          </Button>
        )}
      </div>
      <p className="mt-1.5 h-4 text-2xs">
        {dirCheck?.problem ? (
          <span className="text-destructive">{dirCheck.problem}</span>
        ) : dirCheck ? (
          <span className="text-muted-foreground">
            Needs {formatBytes(dirCheck.requiredBytes)}
            {dirCheck.freeBytes !== null && ` · ${formatBytes(dirCheck.freeBytes)} free`}
            {folderLocked && " · updating in place"}
          </span>
        ) : (
          <span className="text-subtle">Checking folder…</span>
        )}
      </p>

      <div className="mt-4 space-y-0.5">
        {isWindows && (
          <>
            <Checkbox
              label="Desktop shortcut"
              checked={options.desktopShortcut}
              onChange={(v) => onChange({ desktopShortcut: v })}
            />
            <Checkbox
              label="Start menu"
              checked={options.startMenu}
              onChange={(v) => onChange({ startMenu: v })}
            />
          </>
        )}
        <Checkbox
          label="Launch at login"
          hint="Stash starts quietly in the background when you sign in."
          checked={options.launchAtLogin}
          onChange={(v) => onChange({ launchAtLogin: v })}
        />
      </div>

      {context.installed?.needsElevation && (
        <p className="mt-3 text-2xs text-muted-foreground">
          Windows will ask for permission to remove the previous version first.
        </p>
      )}
    </Page>
  );
}
