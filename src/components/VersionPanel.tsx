import { useEffect, useState } from "react";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { CURRENT_APP_VERSION } from "../config/version";

type Props = {
  /** Firestore doc that holds { appVersion?: string; version?: string } */
  docPath?: [string, string];
  /** Start collapsed (small badge) */
  collapsed?: boolean;
};

// Normalize versions: coerce to string, trim, strip leading v, strip wrapping quotes
const normalize = (v: unknown) =>
  String(v ?? "")
    .trim()
    .replace(/^v/i, "")
    .replace(/^"(.*)"$/, "$1") // remove surrounding quotes if present
    .replace(/^'(.*)'$/, "$1");

const VersionPanel = ({
  docPath = ["Config", "app"],
  collapsed = false,
}: Props) => {
  const [remoteRaw, setRemoteRaw] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  useEffect(() => {
    const db = getFirestore();
    const ref = doc(db, ...docPath);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setError(null);
        const data = snap.data() || {};
        // Support both field names
        const v = (data as any).appVersion ?? (data as any).version ?? null;
        setRemoteRaw(typeof v === "string" ? v : v == null ? null : String(v));
      },
      (err) => {
        console.error("VersionPanel onSnapshot error:", err);
        setError("Kunne ikke hente versjon fra databasen");
        setRemoteRaw(null);
      }
    );
    return () => unsub();
  }, [docPath]);

  const localVersionRaw = CURRENT_APP_VERSION;

  const local = normalize(localVersionRaw);
  const remote = normalize(remoteRaw);

  const hasRemote = remote.length > 0;
  const matches = hasRemote && local === remote;

  const badgeColor = !hasRemote
    ? "bg-neutral-700"
    : matches
    ? "bg-green-700"
    : "bg-yellow-700";

  if (isCollapsed) {
    return (
      <button
        type="button"
        title={
          hasRemote
            ? `Lokal: ${local} • Fjern: ${remote}` +
              (matches ? " (match)" : " (mismatch)")
            : "Henter versjon…"
        }
        onClick={() => setIsCollapsed(false)}
        className={`fixed z-50 bottom-3 right-3 ${badgeColor} text-white text-xs px-2 py-1 rounded shadow`}
        aria-label="Åpne versjonspanel"
      >
        v
      </button>
    );
  }

  return (
    <div className="fixed z-50 bottom-3 right-3 max-w-[90vw]">
      <div className="rounded-md border border-neutral-700 bg-neutral-900 text-neutral-100 shadow-lg p-3">
        <div className="flex items-center justify-between gap-3">
          <strong className="text-sm">Versjon (debug)</strong>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                hasRemote
                  ? matches
                    ? "bg-green-500"
                    : "bg-yellow-400"
                  : "bg-neutral-500"
              }`}
              aria-hidden
            />
            <button
              className="text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
              onClick={() => window.location.reload()}
              title="Last inn siden på nytt"
            >
              Last inn på nytt
            </button>
            <button
              className="text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
              onClick={() => setIsCollapsed(true)}
              title="Minimer"
            >
              Minimer
            </button>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-sm">
          <span className="text-neutral-400">Lokal (.dev):</span>
          <span className="font-mono">{local || "ukjent"}</span>

          <span className="text-neutral-400">Database:</span>
          <span className="font-mono">{hasRemote ? remote : "henter…"}</span>

          <span className="text-neutral-400">Status:</span>
          <span className={matches ? "text-green-400" : "text-yellow-400"}>
            {hasRemote
              ? matches
                ? "Match"
                : "Ulik versjon – auto-reload burde trigges"
              : "Ingen data ennå"}
          </span>
        </div>

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
};

export default VersionPanel;
