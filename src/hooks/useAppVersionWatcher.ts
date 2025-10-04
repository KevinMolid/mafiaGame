// useAppVersionWatcher.ts
import { useEffect, useRef } from "react";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { CURRENT_APP_VERSION } from "../config/version";

const RELOAD_FLAG = "version-reloaded-for";

// Normalize: coerce -> trim -> strip leading "v"
const normalize = (v: unknown) =>
  String(v ?? "").trim().replace(/^v/i, "");

export default function useAppVersionWatcher(
  opts: { docPath?: [string, string]; autoReload?: boolean } = {}
) {
  const { docPath = ["Config", "app"], autoReload = true } = opts;
  const db = getFirestore();
  const reloadedRef = useRef(false);

  useEffect(() => {
    const ref = doc(db, ...docPath);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() || {};
        // support either "version" or "appVersion"
        const remoteRaw = (data as any).version ?? (data as any).appVersion;
        const remote = normalize(remoteRaw);
        const local = normalize(CURRENT_APP_VERSION);

        if (!autoReload || reloadedRef.current) return;
        if (!remote || !local) return; // nothing to compare

        if (remote !== local) {
          const alreadyFor = sessionStorage.getItem(RELOAD_FLAG);
          if (alreadyFor === remote) return;
          sessionStorage.setItem(RELOAD_FLAG, remote);

          const doReload = () => {
            reloadedRef.current = true;
            window.location.reload();
          };

          if (document.visibilityState === "visible") {
            doReload();
          } else {
            const onVis = () => {
              if (!reloadedRef.current) doReload();
              document.removeEventListener("visibilitychange", onVis);
            };
            document.addEventListener("visibilitychange", onVis);
          }
        }
      },
      console.error
    );

    return () => unsub();
  }, [db, docPath, autoReload]);
}
