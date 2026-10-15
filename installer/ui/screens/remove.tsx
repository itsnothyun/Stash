import { Button } from "@/components/ui/button";
import type { Context } from "../api";
import { Checkbox, Logo, Page } from "../components/chrome";

export function RemoveScreen({
  context,
  deleteData,
  onDeleteDataChange,
  onCancel,
  onRemove,
}: {
  context: Context;
  deleteData: boolean;
  onDeleteDataChange: (value: boolean) => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
  const version = context.installed?.version ?? context.version;
  return (
    <Page
      actions={
        <>
          <Button variant="ghost" size="lg" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" size="lg" className="rounded-full px-5" onClick={onRemove}>
            Remove
          </Button>
        </>
      }
    >
      <Logo className="mt-4 grayscale-[35%]" />
      <h1 className="mt-6 text-[26px] font-semibold leading-tight tracking-[-0.02em]">Remove Stash</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This removes Stash {version} from this {context.platform === "windows" ? "PC" : "Mac"}, along with its
        shortcuts.
      </p>
      <div className="mt-5 max-w-sm">
        <Checkbox
          label="Also delete my notes"
          hint={
            deleteData
              ? "Your notes and settings will be permanently deleted."
              : "Leave this off to keep your notes for a future install."
          }
          checked={deleteData}
          onChange={onDeleteDataChange}
        />
      </div>
    </Page>
  );
}
