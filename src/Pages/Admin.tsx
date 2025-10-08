// Components
import Main from "../components/Main";
import H1 from "../components/Typography/H1";
import H2 from "../components/Typography/H2";
import H3 from "../components/Typography/H3";
import CharacterList from "../components/CharacterList";
import Button from "../components/Button";
import InfoBox from "./../components/InfoBox";
import Box from "../components/Box";
import Username from "../components/Typography/Username";
import Tab from "../components/Tab";

import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useCharacter } from "../CharacterContext";

import {
  query,
  orderBy,
  onSnapshot,
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  addDoc,
  updateDoc,
  Timestamp,
  writeBatch, // <-- added
} from "firebase/firestore";

import { useEffect, useMemo, useState } from "react";

// Firebase setup
const db = getFirestore();

import {
  CategoryValue,
  CATEGORIES,
  getCategoryLabel,
} from "../constants/support";

type SupportTicket = {
  id: string;
  category?: string;
  content?: string;
  createdAt?: Timestamp | null;
  status?: string;
  topic?: string;
  reportedId?: string | null;
  reportedUsername?: string | null;
  user?: { uid?: string; email?: string; displayName?: string };
  client?: { ua?: string; tzOffsetMin?: number };
  ua?: string; // sometimes stored at root
  tzOffsetMin?: number; // sometimes stored at root
  character?: { id?: string | null; name?: string | null } | null;
  closedBy?: { id?: string | null; name?: string | null } | null;
  closedAt?: Timestamp | null;
};

const Admin = () => {
  const { userData } = useAuth();
  const { userCharacter } = useCharacter();
  const [loading, setLoading] = useState(false);
  const [newUpdateText, setNewUpdateText] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState<React.ReactNode>("");
  const [messageType, setMessageType] = useState<
    "success" | "warning" | "info" | "failure"
  >("info");

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [ticketBusy, setTicketBusy] = useState<
    Record<string, "close" | "delete" | null>
  >({});
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  function truncate(text: string, n = 100) {
    if (!text) return "";
    return text.length > n ? text.slice(0, n) + "…" : text;
  }

  function onTicketClick(id: string) {
    setActiveTicketId((curr) => (curr === id ? null : id));
  }

  // Tabs: "all" + each CategoryValue
  type TicketTab = CategoryValue | "all";
  const [activeTab, setActiveTab] = useState<TicketTab>("all");

  useEffect(() => {
    setTicketsLoading(true);
    setTicketsError(null);

    const q = query(
      collection(db, "SupportTickets"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => {
          const raw = d.data() as any;
          return {
            id: d.id,
            ...raw,
            createdAt: raw?.createdAt ?? null,
            closedAt: raw?.closedAt ?? null,
          } as SupportTicket;
        });
        setTickets(data);
        setTicketsLoading(false);
      },
      (err) => {
        console.error("Failed to load SupportTickets:", err);
        setTicketsError("Kunne ikke hente rapporter.");
        setTicketsLoading(false);
      }
    );

    return () => unsub();
  }, []);

  function formatWhen(ts?: Timestamp | null) {
    if (!ts) return "Ukjent tidspunkt";
    try {
      const d = ts.toDate();
      return d.toLocaleString("no-NO", { timeZone: "Europe/Oslo" });
    } catch {
      return "Ukjent tidspunkt";
    }
  }

  function statusLabel(s?: string) {
    const v = (s || "open").toLowerCase();
    if (v === "open") return "Åpen";
    if (v === "closed" || v === "resolved") return "Lukket";
    if (v === "in_progress" || v === "in-progress") return "Under behandling";
    return v; // fallback
  }

  function statusBadgeClass(s?: string) {
    const v = (s || "open").toLowerCase();
    if (v === "open")
      return "bg-amber-500/20 text-amber-300 border border-amber-500/40";
    if (v === "in_progress" || v === "in-progress")
      return "bg-blue-500/20 text-blue-300 border border-blue-500/40";
    if (v === "closed" || v === "resolved")
      return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
    return "bg-neutral-700 text-neutral-300 border border-neutral-600";
  }

  async function handleCloseTicket(ticketId: string) {
    try {
      setTicketBusy((prev) => ({ ...prev, [ticketId]: "close" }));
      const adminId = userCharacter?.id || userData?.uid || "unknown";
      const adminName =
        userCharacter?.username || userData?.displayName || "Admin";

      await updateDoc(doc(db, "SupportTickets", ticketId), {
        status: "closed",
        closedAt: serverTimestamp(),
        closedBy: { id: adminId, name: adminName },
      });
      // onSnapshot will refresh UI
    } catch (e) {
      console.error("Failed to close ticket:", e);
      setMessageType("failure");
      setMessage("Kunne ikke lukke saken.");
    } finally {
      setTicketBusy((prev) => ({ ...prev, [ticketId]: null }));
    }
  }

  async function handleDeleteTicket(ticketId: string) {
    try {
      const ok = window.confirm("Slette denne saken permanent?");
      if (!ok) return;
      setTicketBusy((prev) => ({ ...prev, [ticketId]: "delete" }));
      await deleteDoc(doc(db, "SupportTickets", ticketId));
      // onSnapshot removes it from the list
    } catch (e) {
      console.error("Failed to delete ticket:", e);
      setMessageType("failure");
      setMessage("Kunne ikke slette saken.");
    } finally {
      setTicketBusy((prev) => ({ ...prev, [ticketId]: null }));
    }
  }

  const handleUpdateTextInputChange = (e: any) => {
    setNewUpdateText(e.target.value);
  };

  async function handlePublishUpdate() {
    const text = newUpdateText.trim();
    if (!text) {
      setMessageType("warning");
      setMessage("Skriv en oppdatering først.");
      return;
    }

    setIsPublishing(true);
    try {
      await addDoc(collection(db, "Updates"), {
        text,
        authorId: userCharacter?.id || userData?.uid || "",
        authorName:
          userCharacter?.username || userData?.displayName || "Ukjent",
        createdAt: serverTimestamp(),
      });
      setNewUpdateText(""); // clear input on success
      setMessageType("success");
      setMessage("Oppdatering publisert!");
    } catch (err) {
      console.error("Kunne ikke publisere oppdatering:", err);
      alert("En feil oppsto ved publisering.");
      setMessageType("failure");
      setMessage("Oppdatering publisert!");
    } finally {
      setIsPublishing(false);
    }
  }

  // ---- helpers for batched deletes ----
  async function deleteAllDocsInCollection(path: string[] | readonly string[]) {
    // Join into a single "a/b/c" path so we avoid the spread-overload issue
    const collRef = collection(db, path.join("/"));
    const snap = await getDocs(collRef);

    if (snap.empty) return;

    let batch = writeBatch(db);
    let count = 0;

    for (const d of snap.docs) {
      batch.delete(d.ref);
      count++;
      if (count >= 450) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) await batch.commit();
  }

  async function handleResetGame() {
    const ok = window.confirm(
      "Er du sikker? Dette sletter auksjoner, invitasjoner, familier (inkl. underkolleksjoner), biler, alerts m.m., og resetter spillerdata."
    );
    if (!ok) return;

    setLoading(true);

    try {
      // ----- Characters: reset fields, clear alerts and cars subcollection -----
      const characterCollectionRef = collection(db, "Characters");
      const characterDocs = await getDocs(characterCollectionRef);

      for (const charDoc of characterDocs.docs) {
        const charDocRef = doc(db, "Characters", charDoc.id);

        await setDoc(
          charDocRef,
          {
            currentRank: 1,
            lastCrimeTimestamp: null,
            lastGtaTimestamp: null,
            lastRobberyTimestamp: null,
            stats: {
              xp: 0,
              hp: 100,
              money: 1000,
              heat: 0,
              bank: 0,
              protection: 0,
            },
            parkingFacilities: null,
            familyId: null,
            familyName: null,
            inJail: null,
            jailReleaseTime: null,
            activeFamilyApplication: null,
          },
          { merge: true }
        );

        // Delete alerts subcollection
        await deleteAllDocsInCollection(["Characters", charDoc.id, "alerts"]);

        // Delete cars subcollection  <-- NEW
        await deleteAllDocsInCollection(["Characters", charDoc.id, "cars"]);
      }

      // ----- Root collections to clear -----
      // Bounty
      await deleteAllDocsInCollection(["Bounty"]);

      // Auctions (and legacy "Auction" if it exists)  <-- NEW
      await deleteAllDocsInCollection(["Auctions"]);
      await deleteAllDocsInCollection(["Auction"]);

      // FamilyInvites  <-- NEW
      await deleteAllDocsInCollection(["FamilyInvites"]);

      // ----- Families: delete subcollections (Applications, Events), then doc -----
      const familiesCollectionRef = collection(db, "Families");
      const familiesDocs = await getDocs(familiesCollectionRef);

      for (const familyDoc of familiesDocs.docs) {
        const familyId = familyDoc.id;
        const familyDocRef = doc(db, "Families", familyId);

        // Clear known subcollections so the doc doesn't linger as "has subcollections"
        await deleteAllDocsInCollection(["Families", familyId, "Applications"]);
        await deleteAllDocsInCollection(["Families", familyId, "Events"]);

        // Finally delete the family doc
        await deleteDoc(familyDocRef);
      }

      // ----- GameEvents: clear and add reset event -----
      await deleteAllDocsInCollection(["GameEvents"]);

      const newGameEvent = {
        eventType: "GameReset",
        resetById: userCharacter?.id || "",
        resetByName: userCharacter?.username || "",
        timestamp: serverTimestamp(),
      };
      await setDoc(doc(db, "GameEvents", "reset-" + Date.now()), newGameEvent);

      alert("Spillet er nå tilbakestilt!");
    } catch (error) {
      console.error("Feil ved tilbakestilling av spillet:", error);
      alert("En feil oppsto under tilbakestilling av spillet.");
    } finally {
      setLoading(false);
    }
  }

  // ---------- Tabs & filtering ----------
  const counts = useMemo(() => {
    // initialize all keys so counts are always defined
    const base: Record<TicketTab, number> = {
      all: 0,
      bug: 0,
      account: 0,
      purchase: 0,
      report: 0,
      balance: 0,
      other: 0,
    };
    for (const t of tickets) {
      base.all += 1;
      const raw = (t.category as CategoryValue) ?? "other";
      const isKnown = CATEGORIES.some((c) => c.value === raw);
      const key: CategoryValue = isKnown ? raw : "other";
      base[key] += 1;
    }
    return base;
  }, [tickets]);

  const visibleTickets = useMemo(() => {
    if (activeTab === "all") return tickets;
    return tickets.filter(
      (t) =>
        ((CATEGORIES.some((c) => c.value === t.category)
          ? t.category
          : "other") as TicketTab) === activeTab
    );
  }, [tickets, activeTab]);

  if (userData && userData.type !== "admin") {
    return <Navigate to="/" />;
  }

  return (
    <Main>
      <H1>
        <i className="text-yellow-400 fa-solid fa-gears"></i> Kontrollpanel
      </H1>

      {message && <InfoBox type={messageType}>{message}</InfoBox>}

      <div className="flex flex-col gap-4">
        <Box>
          <H2>Handlinger</H2>
          <H3>Egen konto</H3>
          <div className="flex flex-wrap gap-x-2 gap-y-1 mb-4 mt-2">
            <Link to="/velgspiller">
              <div className="flex gap-2 items-center bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg w-[max-content]">
                <i className="fa-solid fa-user-group"></i>
                <p>Velg spillkarakter</p>
              </div>
            </Link>
            <Link to="/nyspiller">
              <div className="flex gap-2 items-center bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg w-[max-content]">
                <i className="fa-solid fa-user-plus"></i>
                <p>Ny spillkarakter</p>
              </div>
            </Link>
          </div>

          <H3>Globalt</H3>
          <input
            className="bg-transparent w-full mb-4 border-b border-neutral-600 py-1 text-sm font-medium text-white placeholder-neutral-500 focus:border-white focus:outline-none"
            type="text"
            placeholder="Oppdatering"
            spellCheck={false}
            value={newUpdateText}
            onChange={handleUpdateTextInputChange}
          />
          <div className="flex gap-1">
            <Button
              onClick={handlePublishUpdate}
              disabled={isPublishing || loading}
            >
              {isPublishing ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <i className="fa-solid fa-paper-plane"></i>
              )}{" "}
              Publiser
            </Button>
            <Button style="danger" onClick={handleResetGame} disabled={loading}>
              {loading ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <i className="fa-solid fa-arrow-rotate-left"></i>
              )}{" "}
              Resett spillet
            </Button>
          </div>
        </Box>

        <Box>
          <H2>Rapporter</H2>

          {/* Category Tabs */}
          <ul className="mt-2 flex flex-wrap items-stretch gap-1 border-b border-neutral-700">
            <Tab
              active={activeTab === "all"}
              onClick={() => setActiveTab("all")}
            >
              Alle ({counts.all})
            </Tab>
            {CATEGORIES.map((c) => (
              <Tab
                key={c.value}
                active={activeTab === c.value}
                onClick={() => setActiveTab(c.value)}
              >
                {c.label} ({counts[c.value] ?? 0})
              </Tab>
            ))}
          </ul>

          {ticketsLoading && (
            <div className="text-sm text-neutral-400 flex items-center gap-2 mt-3">
              <i className="fa-solid fa-spinner fa-spin" /> Laster inn
              rapporter...
            </div>
          )}

          {ticketsError && <InfoBox type="failure">{ticketsError}</InfoBox>}

          {!ticketsLoading && !ticketsError && visibleTickets.length === 0 && (
            <p className="text-sm text-neutral-400 mt-3">
              Ingen rapporter i denne kategorien.
            </p>
          )}

          {!ticketsLoading && !ticketsError && visibleTickets.length > 0 && (
            <ul className="mt-3 flex flex-col gap-3">
              {visibleTickets.map((t) => {
                const ua = t.ua ?? t.client?.ua ?? "Ukjent UA";
                const tz = t.tzOffsetMin ?? t.client?.tzOffsetMin;
                const isActive = activeTicketId === t.id;
                const isReport = (t.category as CategoryValue) === "report";

                return (
                  <li
                    key={t.id}
                    className={
                      "rounded-xl border border-neutral-700 bg-neutral-900/60 p-3 transition-colors " +
                      (isActive
                        ? "ring-1 ring-neutral-500"
                        : "hover:bg-neutral-900")
                    }
                    onClick={() => onTicketClick(t.id)}
                    role="button"
                    tabIndex={0}
                  >
                    {/* Header (always visible) */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-semibold ${statusBadgeClass(
                            t.status
                          )}`}
                        >
                          {statusLabel(t.status)}
                        </span>
                        <span className="text-sm text-neutral-300">
                          <strong>
                            {isReport ? (
                              t.reportedId || t.reportedUsername ? (
                                <Username
                                  character={{
                                    id: String(t.reportedId ?? ""),
                                    username: String(
                                      t.reportedUsername ?? t.topic ?? "Ukjent"
                                    ),
                                  }}
                                />
                              ) : (
                                t.topic || "(uten emne)"
                              )
                            ) : (
                              t.topic || "(uten emne)"
                            )}
                          </strong>
                          {t.category ? (
                            <span className="text-neutral-500">
                              {" "}
                              · {getCategoryLabel(t.category)}
                            </span>
                          ) : null}
                        </span>

                        {t.closedBy?.id && t.closedBy?.name && t.closedAt ? (
                          <div className="text-xs text-neutral-500 flex items-center gap-1">
                            <span>Lukket av</span>
                            <Username
                              character={{
                                id: String(t.closedBy.id),
                                username: String(t.closedBy.name),
                              }}
                            />
                            <span>· {formatWhen(t.closedAt)}</span>
                          </div>
                        ) : null}
                      </div>
                      <span className="text-xs text-neutral-400">
                        {formatWhen(t.createdAt)}
                      </span>
                    </div>

                    {/* Summary (when collapsed) */}
                    {!isActive && t.content ? (
                      <p className="mt-2 text-sm text-neutral-300">
                        {truncate(t.content, 100)}
                      </p>
                    ) : null}

                    {/* Full details (when active) */}
                    {isActive && (
                      <>
                        {/* Content */}
                        {t.content && (
                          <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-200">
                            {t.content}
                          </p>
                        )}

                        {/* Meta */}
                        <div className="mt-3 grid gap-1 text-xs text-neutral-400">
                          {t.character?.id || t.character?.name ? (
                            <div>
                              <i className="fa-solid fa-user-tie mr-1" />
                              {t.character?.id && t.character.name ? (
                                <Username
                                  character={{
                                    id: t.character.id,
                                    username: t.character.name,
                                  }}
                                />
                              ) : (
                                <span className="text-neutral-200">
                                  {t.character?.name ?? "Ukjent karakter"}
                                </span>
                              )}
                              {t.character?.id && (
                                <span className="text-neutral-500">
                                  {" "}
                                  · id: {t.character.id}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-neutral-500">
                              <i className="fa-solid fa-user-tie mr-1" />
                              Ingen karakteropplysninger
                            </div>
                          )}

                          <div>
                            <i className="fa-regular fa-user mr-1" />
                            {t.user?.displayName || "Ukjent bruker"}
                            {t.user?.email ? (
                              <span className="text-neutral-500">
                                {" "}
                                · {t.user.email}
                              </span>
                            ) : null}
                            {t.user?.uid ? (
                              <span className="text-neutral-500">
                                {" "}
                                · uid: {t.user.uid}
                              </span>
                            ) : null}
                          </div>

                          <div className="truncate">
                            <i className="fa-solid fa-desktop mr-1" />
                            {ua}
                          </div>

                          {typeof tz === "number" && (
                            <div>
                              <i className="fa-regular fa-clock mr-1" />
                              Tidsavvik (minutter fra UTC): {tz}
                            </div>
                          )}
                          <div className="text-neutral-600">
                            Ticket-ID: {t.id}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloseTicket(t.id);
                            }}
                            disabled={
                              ticketBusy[t.id] === "close" ||
                              t.status === "closed"
                            }
                            title={
                              t.status === "closed"
                                ? "Allerede lukket"
                                : "Sett til lukket"
                            }
                          >
                            {ticketBusy[t.id] === "close" ? (
                              <i className="fa-solid fa-spinner fa-spin" />
                            ) : (
                              <i className="fa-solid fa-check" />
                            )}{" "}
                            Lukk
                          </Button>

                          <Button
                            style="danger"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTicket(t.id);
                            }}
                            disabled={ticketBusy[t.id] === "delete"}
                            title="Slett saken permanent"
                          >
                            {ticketBusy[t.id] === "delete" ? (
                              <i className="fa-solid fa-spinner fa-spin" />
                            ) : (
                              <i className="fa-solid fa-trash" />
                            )}{" "}
                            Slett
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Box>

        <Box>
          <H2>Spillere</H2>
          <CharacterList type="admin"></CharacterList>
        </Box>
      </div>
    </Main>
  );
};

export default Admin;
