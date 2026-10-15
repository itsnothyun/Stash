import { useCallback, useEffect, useReducer } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { api, asSetupError } from "./api";
import { TitleBar } from "./components/chrome";
import { DoneScreen, ErrorScreen, RemovedScreen } from "./screens/finished";
import { OptionsScreen } from "./screens/options";
import { RemoveScreen } from "./screens/remove";
import { WelcomeScreen } from "./screens/welcome";
import { WorkingScreen } from "./screens/working";
import { canInstall, initialState, reducer } from "./wizard";

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { context, options, screen } = state;

  useEffect(() => {
    api
      .getContext()
      .then((context) => dispatch({ type: "loaded", context }))
      .catch((e) => dispatch({ type: "failed", error: asSetupError(e) }));
    const unlisten = api.onProgress((progress) => dispatch({ type: "progress", progress }));
    return () => {
      unlisten.then((off) => off());
    };
  }, []);

  // Validate the folder whenever it changes while the options are on screen.
  const dir = options?.dir;
  useEffect(() => {
    if (screen !== "options" || !dir) return;
    api.checkDir(dir).then((check) => dispatch({ type: "dirChecked", dir, check }));
  }, [screen, dir]);

  const install = useCallback(
    async (force = false) => {
      if (!options) return;
      dispatch({ type: "start", screen: "installing" });
      try {
        await api.closeStash(options.dir, force);
        const outcome = await api.install(options);
        dispatch({ type: "finished", outcome });
      } catch (e) {
        dispatch({ type: "failed", error: asSetupError(e) });
      }
    },
    [options],
  );

  const uninstall = useCallback(
    async (force = false) => {
      dispatch({ type: "start", screen: "removing" });
      try {
        await api.closeStash(null, force);
        const outcome = await api.uninstall(state.deleteData);
        dispatch({ type: "finished", outcome });
      } catch (e) {
        dispatch({ type: "failed", error: asSetupError(e) });
      }
    },
    [state.deleteData],
  );

  const closeWindow = () => getCurrentWindow().close();
  const retry = (force: boolean) => (state.failedDuring === "removing" ? uninstall(force) : install(force));
  const busy = screen === "installing" || screen === "removing";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface">
      <TitleBar canClose={!busy} />
      {screen === "welcome" && context && (
        <WelcomeScreen
          context={context}
          onContinue={() => dispatch({ type: "goTo", screen: "options" })}
          onRemove={() => dispatch({ type: "goTo", screen: "remove" })}
        />
      )}
      {screen === "options" && context && options && (
        <OptionsScreen
          context={context}
          options={options}
          dirCheck={state.dirCheck}
          canInstall={canInstall(state)}
          onChange={(patch) => dispatch({ type: "setOptions", patch })}
          onPickFolder={async () => {
            const picked = await api.pickFolder(options.dir);
            if (picked) dispatch({ type: "setOptions", patch: { dir: picked } });
          }}
          onBack={() => dispatch({ type: "goTo", screen: "welcome" })}
          onInstall={() => install()}
        />
      )}
      {screen === "installing" && (
        <WorkingScreen
          title={context?.mode.kind === "fresh" ? "Installing Stash…" : "Updating Stash…"}
          progress={state.progress}
          showSteps
        />
      )}
      {screen === "done" && context && options && (
        <DoneScreen
          platform={context.platform}
          warnings={state.warnings}
          onClose={closeWindow}
          onOpen={async () => {
            await api.launchStash(options.dir).catch(() => {});
            closeWindow();
          }}
        />
      )}
      {screen === "remove" && context && (
        <RemoveScreen
          context={context}
          deleteData={state.deleteData}
          onDeleteDataChange={(value) => dispatch({ type: "setDeleteData", value })}
          onCancel={() =>
            context.action === "uninstall" ? closeWindow() : dispatch({ type: "goTo", screen: "welcome" })
          }
          onRemove={() => uninstall()}
        />
      )}
      {screen === "removing" && <WorkingScreen title="Removing Stash…" progress={state.progress} showSteps={false} />}
      {screen === "removed" && (
        <RemovedScreen keptData={!state.deleteData} warnings={state.warnings} onClose={closeWindow} />
      )}
      {screen === "error" && state.error && (
        <ErrorScreen
          error={state.error}
          rolledBack={state.failedDuring === "installing"}
          onRetry={() => retry(false)}
          onForceQuit={() => retry(true)}
          onBack={() =>
            context
              ? dispatch({ type: "goTo", screen: state.failedDuring === "removing" ? "remove" : "options" })
              : closeWindow()
          }
        />
      )}
    </div>
  );
}
