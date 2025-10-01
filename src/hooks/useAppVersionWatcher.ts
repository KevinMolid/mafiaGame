import { useEffect, useRef } from "react";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { CURRENT_APP_VERSION } from "../config/version";

// Optional: avoid reload loop if Firestore briefly lags during a deploy
const RELOAD_FLAG = "version-reloaded-for";

export default function useAppVersionWatcher(
  opts: { docPath?: [string, string]; autoReload?: boolean } = {}
) {
  const { docPath = ["Meta", "App"], autoReload = true } = opts;
  const db = getFirestore();
  const reloadedRef = useRef(false);

  useEffect(() => {
    const ref = doc(db, ...docPath); // e.g. Meta/App -> { version: "1.2.3" }
    const unsub = onSnapshot(ref, (snap) => {
      const remote = (snap.data()?.version as string) || "dev";
      const local = CURRENT_APP_VERSION;
      if (!autoReload) return;
      if (reloadedRef.current) return;

      // If versions mismatch, reload when tab is visible
      if (remote && local && remote !== local) {
        // Prevent loops (in case it still mismatches on first boot after reload)
        const alreadyFor = sessionStorage.getItem(RELOAD_FLAG);
        if (alreadyFor === remote) return;
        sessionStorage.setItem(RELOAD_FLAG, remote);

        const doReload = () => {
          // Simple, cache-safe enough for Vite assets with hashed file names
          window.location.reload();
        };

        if (document.visibilityState === "visible") {
          reloadedRef.current = true;
          doReload();
        } else {
          const onVis = () => {
            if (reloadedRef.current) return;
            reloadedRef.current = true;
            document.removeEventListener("visibilitychange", onVis);
            doReload();
          };
          document.addEventListener("visibilitychange", onVis);
        }
      }
    }, console.error);

    return () => unsub();
  }, [db, docPath, autoReload]);
}
