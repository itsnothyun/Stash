import { Button } from "@/components/ui/button";
import type { Context } from "../api";
import { Logo, Page, StepDots } from "../components/chrome";
import { formatBytes } from "../wizard";

function copy(context: Context) {
  const { mode, version } = context;
  switch (mode.kind) {
    case "fresh":
      return {
        title: "Welcome to Stash",
        body: "Fast offline notes, checklists and widgets that stay out of your way.",
        action: "Continue",
      };
    case "update":
      return {
        title: "Update Stash",
        body: `Version ${mode.from} → ${version}. Your notes stay exactly where they are.`,
        action: "Continue",
      };
    case "repair":
      return {
        title: `Stash ${version} is installed`,
        body: "Repair puts the app files back in place. Your notes aren't touched.",
        action: "Repair",
      };
    case "downgrade":
      return {
        title: "A newer Stash is installed",
        body: `You have ${mode.from}. This setup installs the older ${version}.`,
        action: `Install ${version} anyway`,
      };
  }
}

export function WelcomeScreen({
  context,
  onContinue,
  onRemove,
}: {
  context: Context;
  onContinue: () => void;
  onRemove: () => void;
}) {
  const text = copy(context);
  // Old installs are migrated, not removed from here.
  const canRemove = context.installed !== null && context.mode.kind !== "update";

  return (
    <Page
      footerStart={<StepDots index={0} />}
      actions={
        <>
          {canRemove && (
            <Button variant="ghost" size="lg" onClick={onRemove}>
              Remove Stash
            </Button>
          )}
          <Button size="lg" className="rounded-full px-5" onClick={onContinue} autoFocus>
            {text.action}
          </Button>
        </>
      }
    >
      <Logo className="mt-4" />
      <h1 className="mt-6 text-[26px] font-semibold leading-tight tracking-[-0.02em]">{text.title}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{text.body}</p>
      <p className="mt-5 font-mono text-2xs text-subtle">
        Version {context.version} · {formatBytes(context.requiredBytes)}
      </p>
      {context.payloadMissing && (
        <p className="mt-3 text-xs text-destructive">
          This is a development build of the setup with no Stash inside, so it can't install.
        </p>
      )}
    </Page>
  );
}
