// serverTime.ts
import { getDatabase, ref, onValue } from "firebase/database";
import type { FirebaseApp } from "firebase/app";

let _serverOffsetMs = 0;

// Promise you can await the first time you need a correct server time
let _resolveReady: (() => void) | null = null;
export const serverTimeReady = new Promise<void>((res) => (_resolveReady = res));

/** Call once at app boot (after initializeApp). */
export function initServerTime(app: FirebaseApp) {
  const rtdb = getDatabase(app);

  // Special path provided by Firebase; returns (serverTime - clientTime) in ms.
  onValue(ref(rtdb, ".info/serverTimeOffset"), (snap) => {
    const val = snap.val();
    _serverOffsetMs = typeof val === "number" ? val : 0;
    if (_resolveReady) {
      _resolveReady();
      _resolveReady = null;
    }
  });
}

/** Server-synced "now" in ms since epoch. */
export function serverNow(): number {
  return Date.now() + _serverOffsetMs;
}

/** For debugging/telemetry if you want it */
export function getServerOffsetMs(): number {
  return _serverOffsetMs;
}
