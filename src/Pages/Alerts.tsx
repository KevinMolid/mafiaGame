import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import Alert from "../components/Alert";
import Username from "../components/Typography/Username";
import Familyname from "../components/Typography/Familyname";
import Item from "../components/Typography/Item";
import { serverNow } from "../Functions/serverTime";

import { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useCharacter } from "../CharacterContext";

import firebaseConfig from "../firebaseConfig";
import { initializeApp } from "firebase/app";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

type AlertCar = {
  name: string;
  tier: number;
  img?: string | null;
  // nice-to-haves if you want tooltips/stats later:
  modelKey?: string | null;
  hp?: number;
  value?: number;
  isElectric?: boolean;
  city?: string;
};

// Define the structure of an alert item (note: timestamp is a Date now)
interface AlertItem {
  id: string;
  type: string;
  newRank: string;
  amountLost: number;
  car: AlertCar;
  amountSent: number;
  robberId: string;
  senderId: string;
  familyId: string;
  robberName: string;
  senderName: string;
  familyName: string;
  bountyAmount: number;
  killedPlayerId: string;
  killedPlayerName: string;
  newRole: string;
  removedRole: string;
  userId: string;
  userName: string;
  timestamp: Date;
  read: boolean;
}

const useServerNow = (intervalMs = 30000) => {
  const [nowMs, setNowMs] = useState<number>(() => serverNow());
  useEffect(() => {
    const id = setInterval(() => setNowMs(serverNow()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return nowMs;
};

// --- helpers ---
type RawTs = any; // Firestore Timestamp | string | number | Date | {seconds, nanoseconds}

const toDate = (ts: RawTs): Date => {
  if (!ts) return new Date(0);
  if (typeof ts.toDate === "function") return ts.toDate(); // Firestore Timestamp
  if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000); // Timestamp-like
  if (ts instanceof Date) return ts;
  if (typeof ts === "string") return new Date(ts); // ISO
  if (typeof ts === "number") return new Date(ts); // millis
  return new Date(0);
};

// Helper function to format the time difference
const formatTimeAgo = (date: Date, nowMs: number): string => {
  const diffSec = Math.max(0, Math.floor((nowMs - date.getTime()) / 1000));
  if (diffSec < 60) return `${diffSec} sek`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return hrs === 1 ? `${hrs} time` : `${hrs} timer`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? `${days} dag` : `${days} dager`;
};

const PAGE_SIZE = 15;

const Alerts = () => {
  const { userCharacter } = useCharacter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const nowMs = useServerNow();

  // pagination
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(alerts.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageAlerts = alerts.slice(start, end);

  useEffect(() => {
    // keep current page valid if alerts length changes
    if (page > totalPages) setPage(totalPages);
  }, [alerts.length, page, totalPages]);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!userCharacter || !userCharacter.id) return;

      try {
        // Query the alerts sub-collection for the user's character
        const alertsRef = collection(
          db,
          "Characters",
          userCharacter.id,
          "alerts"
        );
        const alertsQuery = query(alertsRef);
        const alertsSnapshot = await getDocs(alertsQuery);

        const fetchedAlerts: AlertItem[] = alertsSnapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            type: data.type || "",
            // normalize to Date for easy sorting/formatting
            timestamp: toDate(data.timestamp),
            newRank: data.newRank || "",
            amountLost: data.amountLost || 0,
            car: data.car || [],
            amountSent: data.amountSent || 0,
            robberId: data.robberId || "",
            robberName: data.robberName || "",
            senderId: data.senderId || "",
            senderName: data.senderName || "",
            familyId: data.familyId || "",
            familyName: data.familyName || "",
            bountyAmount: data.bountyAmount || 0,
            killedPlayerId: data.killedPlayerId || "",
            killedPlayerName: data.killedPlayerName || "",
            newRole: data.newRole || "",
            removedRole: data.removedRole || "",
            userId: data.userId || "",
            userName: data.userName || "",
            read: data.read || false,
          };
        });

        // Sort alerts by timestamp in descending order (newest first)
        fetchedAlerts.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        );

        // Mark unread alerts as read
        const unreadAlerts = fetchedAlerts.filter((alert) => !alert.read);
        if (unreadAlerts.length > 0) {
          const markAlertsAsRead = async () => {
            for (const unreadAlert of unreadAlerts) {
              const alertDocRef = doc(
                db,
                "Characters",
                userCharacter.id,
                "alerts",
                unreadAlert.id
              );
              await updateDoc(alertDocRef, { read: true });
            }
          };
          await markAlertsAsRead();
        }

        setAlerts(fetchedAlerts);
        setLoading(false);
        setPage(1); // reset to first page when (re)loading
      } catch (error) {
        console.error("Error fetching alerts:", error);
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [userCharacter]);

  const Pager = () => (
    <div className="flex items-center justify-between py-2">
      <div className="text-sm text-neutral-400">
        Side <span className="text-neutral-200 font-semibold">{page}</span> av{" "}
        <span className="text-neutral-200 font-semibold">{totalPages}</span>
        {alerts.length > 0 && (
          <>
            {" "}
            · Viser{" "}
            <span className="text-neutral-200 font-semibold">{start + 1}</span>–
            <span className="text-neutral-200 font-semibold">
              {Math.min(end, alerts.length)}
            </span>{" "}
            av{" "}
            <span className="text-neutral-200 font-semibold">
              {alerts.length}
            </span>
          </>
        )}
      </div>
      <div className="flex gap-1">
        <button
          className="px-2 py-1 text-sm rounded bg-neutral-800 border border-neutral-700 disabled:opacity-40"
          onClick={() => setPage(1)}
          disabled={page === 1}
          title="Første side"
        >
          « Første
        </button>
        <button
          className="px-2 py-1 text-sm rounded bg-neutral-800 border border-neutral-700 disabled:opacity-40"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          title="Forrige side"
        >
          ‹ Forrige
        </button>
        <button
          className="px-2 py-1 text-sm rounded bg-neutral-800 border border-neutral-700 disabled:opacity-40"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          title="Neste side"
        >
          Neste ›
        </button>
        <button
          className="px-2 py-1 text-sm rounded bg-neutral-800 border border-neutral-700 disabled:opacity-40"
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages}
          title="Siste side"
        >
          Siste »
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Main>
        <H1>Alerts</H1>
        <p>Laster varsler...</p>
      </Main>
    );
  }

  return (
    <Main>
      <H1>Varsler</H1>

      {alerts.length === 0 ? (
        <p>Du har ingen varsler.</p>
      ) : (
        <>
          {alerts.length > 15 && <Pager />}

          <div className="flex gap-1 md:gap-1 flex-col">
            {pageAlerts.map((alert) => (
              <Alert key={alert.id} read={alert.read}>
                {/* Rank alert */}
                {alert.type === "xp" && (
                  <small>Du nådde ranken {alert.newRank}.</small>
                )}

                {/* Bounty Reward alert */}
                {alert.type === "bountyReward" && (
                  <small>
                    Du mottok ${alert.bountyAmount?.toLocaleString()} for å
                    drepe{" "}
                    <Username
                      character={{
                        id: alert.killedPlayerId,
                        username: alert.killedPlayerName,
                      }}
                    />
                    .
                  </small>
                )}

                {/* Robbery alert */}
                {alert.type === "robbery" && alert.amountLost && (
                  <small>
                    Du ble ranet av{" "}
                    <Username
                      character={{
                        id: alert.robberId,
                        username: alert.robberName,
                      }}
                    />{" "}
                    og mistet{" "}
                    <span className="text-neutral-200">
                      <i className="fa-solid fa-dollar-sign"></i>{" "}
                      <strong>
                        {alert.amountLost.toLocaleString("nb-NO")}
                      </strong>
                    </span>
                    .
                  </small>
                )}

                {/* GTA alert */}
                {alert.type === "gta" && alert.car && (
                  <small>
                    Din parkering ble ranet av{" "}
                    <Username
                      character={{
                        id: alert.robberId,
                        username: alert.robberName,
                      }}
                    />
                    . Du mistet{" "}
                    <Item
                      name={alert.car.name}
                      tier={alert.car.tier}
                      tooltipImg={alert.car.img ?? undefined}
                      tooltipContent={
                        <div>
                          <p>
                            Effekt:{" "}
                            <strong className="text-neutral-200">
                              {alert.car.hp} hk
                            </strong>
                          </p>
                          <p>
                            Verdi:{" "}
                            <strong className="text-neutral-200">
                              <i className="fa-solid fa-dollar-sign"></i>{" "}
                              {alert.car.value?.toLocaleString("nb-NO")}
                            </strong>
                          </p>
                        </div>
                      }
                    />
                    .
                  </small>
                )}

                {/* Bank transfer alert */}
                {alert.type === "banktransfer" && alert.amountSent && (
                  <small>
                    <Username
                      character={{
                        id: alert.senderId,
                        username: alert.senderName,
                      }}
                    />{" "}
                    overførte{" "}
                    <span className="text-neutral-200">
                      <i className="fa-solid fa-dollar-sign"></i>{" "}
                      <strong>
                        {alert.amountSent.toLocaleString("NO-nb")}
                      </strong>
                    </span>{" "}
                    til din bankkonto.
                  </small>
                )}

                {/* Family Application alert */}
                {alert.type === "applicationAccepted" && (
                  <small>
                    Søknaden din ble godkjent. Du er nå medlem av{" "}
                    <Familyname
                      family={{
                        id: alert.familyId,
                        name: alert.familyName,
                      }}
                    />
                    !
                  </small>
                )}

                {alert.type === "applicationDeclined" && (
                  <small>
                    Din søknad til{" "}
                    <Familyname
                      family={{
                        id: alert.familyId,
                        name: alert.familyName,
                      }}
                    />{" "}
                    ble avslått!
                  </small>
                )}

                {/* Kicked from Family alert */}
                {alert.type === "KickedFromFamily" && (
                  <small>
                    Du ble kastet ut av familien{" "}
                    <Familyname
                      family={{
                        id: alert.familyId,
                        name: alert.familyName,
                      }}
                    />
                    .
                  </small>
                )}

                {/* New Role alert */}
                {alert.type === "newRole" && (
                  <small>
                    Din rolle ble endret til{" "}
                    <strong
                      className={
                        (alert.newRole === "admin"
                          ? "text-sky-400"
                          : alert.newRole === "moderator"
                          ? "text-green-400"
                          : "") + " capitalize"
                      }
                    >
                      {alert.newRole}
                    </strong>{" "}
                    av{" "}
                    <Username
                      character={{
                        id: alert.userId,
                        username: alert.userName,
                      }}
                    />
                    .
                  </small>
                )}

                {/* Removed Role alert */}
                {alert.type === "removeRole" && (
                  <small>
                    Din rolle som{" "}
                    <strong
                      className={
                        (alert.removedRole === "admin"
                          ? "text-sky-400"
                          : alert.removedRole === "moderator"
                          ? "text-green-400"
                          : "") + " capitalize"
                      }
                    >
                      {alert.removedRole}
                    </strong>{" "}
                    ble fjernet av{" "}
                    <Username
                      character={{
                        id: alert.userId,
                        username: alert.userName,
                      }}
                    />
                    .
                  </small>
                )}

                <small>{formatTimeAgo(alert.timestamp, nowMs)}</small>
              </Alert>
            ))}
          </div>

          {alerts.length > 15 && <Pager />}
        </>
      )}
    </Main>
  );
};

export default Alerts;
