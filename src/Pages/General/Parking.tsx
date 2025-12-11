import Main from "../../components/Main";
import H1 from "../../components/Typography/H1";
import H2 from "../../components/Typography/H2";
import H3 from "../../components/Typography/H3";
import Button from "../../components/Button";
import Box from "../../components/Box";
import InfoBox from "../../components/InfoBox";
import JailBox from "../../components/JailBox";
import Item from "../../components/Typography/Item";
import ConfirmDialog from "../../components/ConfirmDialog";

// Functions
import { dmgPercent, carValue } from "../../Functions/RewardFunctions";

import { useState, useEffect, useMemo } from "react";

import { useCharacter } from "../../CharacterContext";
import { getCarByName, getCarByKey } from "../../Data/Cars";

import {
  collection,
  query,
  where,
  onSnapshot,
  doc as fsDoc,
  writeBatch,
  doc,
  updateDoc,
} from "firebase/firestore";

import ParkingTypes from "../../Data/ParkingTypes";

import { db } from "../../firebase";

import { useCooldown } from "../../CooldownContext";

type SortKey = "name" | "hp" | "value" | "damage";
type SortDir = "asc" | "desc";

/**
 * Shape of car docs in Firestore.
 * They now store only modelKey + dynamic fields (damage, city, etc.),
 * but we also support legacy fields (name, hp, value, tier, key).
 */
type CarDoc = {
  id: string;
  modelKey?: string | null;
  key?: string | null; // legacy field
  name?: string;
  hp?: number | null;
  tier?: number | null;
  value?: number | null;
  damage?: number | null;
  city?: string | null;
  inRace?: any;
  [key: string]: any;
};

const isLocked = (c: any) => Boolean(c?.inRace?.raceId);

// Resolve catalog entry for a car (supports new + legacy docs)
function getCatalogForCar(car: CarDoc) {
  if (car.modelKey) {
    const c = getCarByKey(car.modelKey);
    if (c) return c;
  }
  if (car.key) {
    const c = getCarByKey(car.key);
    if (c) return c;
  }
  if (car.name) {
    const c = getCarByName(car.name);
    if (c) return c;
  }
  return undefined;
}

// Compute actual value using catalog value + damage
function getCarTotalValue(car: CarDoc): number {
  const catalog = getCatalogForCar(car);
  const baseValue = catalog?.value ?? car.value ?? 0;
  return carValue({ value: baseValue, damage: car.damage });
}

const Parking = () => {
  const { userCharacter } = useCharacter();
  const { jailRemainingSeconds } = useCooldown();
  const [parking, setParking] = useState<number | null>(null);
  const [cars, setCars] = useState<CarDoc[]>([]);
  const [message, setMessage] = useState<React.ReactNode>("");
  const [upgrading, setUpgrading] = useState<boolean>(false);
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "warning" | "info"
  >("info");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showConfirmSellAll, setShowConfirmSellAll] = useState(false);
  const [sellAllBusy, setSellAllBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!userCharacter) {
    return null;
  }

  // Load parking facility level for current city
  useEffect(() => {
    if (userCharacter?.parkingFacilities?.[userCharacter.location]) {
      const parkingSlots =
        userCharacter.parkingFacilities[userCharacter.location];
      setParking(parkingSlots);
    } else {
      setParking(0);
    }
  }, [userCharacter]);

  // Live subscribe to cars in current city from subcollection
  useEffect(() => {
    if (!userCharacter?.id || !userCharacter.location) return;

    const carsCol = collection(db, "Characters", userCharacter.id, "cars");
    const q = query(carsCol, where("city", "==", userCharacter.location));

    const unsub = onSnapshot(q, (snap) => {
      const arr: CarDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setCars(arr);
    });

    return () => unsub();
  }, [userCharacter?.id, userCharacter?.location]);

  function requestSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const updateParking = async (
    characterId: string,
    city: string,
    newParkingIndex: number
  ) => {
    const characterRef = doc(db, "Characters", characterId);
    const upgradeName = ParkingTypes[newParkingIndex].name;
    const upgradePrice = ParkingTypes[newParkingIndex].price;

    // Check if the character has enough money
    if (userCharacter.stats.money < upgradePrice) {
      setMessageType("warning");
      setMessage(`Du har ikke nok penger til å oppgradere parkering.`);
      return;
    }

    // Subtract the upgrade cost from the user's money
    const newMoney = userCharacter.stats.money - upgradePrice;

    try {
      await updateDoc(characterRef, {
        [`parkingFacilities.${city}`]: newParkingIndex,
        [`stats.money`]: newMoney,
      });

      setUpgrading(false);
      setParking(newParkingIndex);
      setMessageType("success");
      setMessage(
        <p>
          Du oppgraderte til <strong>{upgradeName}</strong> for{" "}
          <i className="fa-solid fa-dollar-sign"></i>{" "}
          <strong>{upgradePrice.toLocaleString("nb-NO")}</strong>.
        </p>
      );
    } catch (error) {
      console.error("Feil ved oppdatering av parkering: ", error);
    }
  };

  const canUpgrade = parking !== null && parking < ParkingTypes.length - 1;

  // Helpers
  const anySelected = selectedIds.size > 0;

  const selectedCars = useMemo(
    () => cars.filter((c) => selectedIds.has(c.id)),
    [cars, selectedIds]
  );

  const parkingTableCols = [
    "w-8", // checkbox
    "", // Bil (auto takes remaining)
    "w-24", // Effekt
    "w-20 hidden sm:table-cell", // Skade
    "w-32", // Verdi
  ];

  // Sellable (not in a race)
  const sellableCars = useMemo(() => cars.filter((c) => !isLocked(c)), [cars]);
  const selectedSellableCars = useMemo(
    () => selectedCars.filter((c) => !isLocked(c)),
    [selectedCars]
  );

  const selectedTotalValue = useMemo(
    () => selectedCars.reduce((sum, c) => sum + getCarTotalValue(c), 0),
    [selectedCars]
  );
  const selectedSellableTotalValue = useMemo(
    () => selectedSellableCars.reduce((sum, c) => sum + getCarTotalValue(c), 0),
    [selectedSellableCars]
  );

  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Total value of cars in the current city (from subcollection)
  const totalValue = useMemo(
    () => cars.reduce((sum, c) => sum + getCarTotalValue(c), 0),
    [cars]
  );
  const totalSellableValue = useMemo(
    () => sellableCars.reduce((sum, c) => sum + getCarTotalValue(c), 0),
    [sellableCars]
  );

  // Sorted view of cars (from subcollection)
  const sortedCars = useMemo(() => {
    const arr = [...cars];
    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;

      const catalogA = getCatalogForCar(a);
      const catalogB = getCatalogForCar(b);

      if (sortKey === "name") {
        const nameA = (catalogA?.name ?? a.name ?? "Bil").toString();
        const nameB = (catalogB?.name ?? b.name ?? "Bil").toString();
        return nameA.localeCompare(nameB, "nb") * dir;
      }

      if (sortKey === "hp") {
        const hpA = catalogA?.hp ?? a.hp ?? 0;
        const hpB = catalogB?.hp ?? b.hp ?? 0;
        return (hpA - hpB) * dir;
      }

      if (sortKey === "damage") {
        return (dmgPercent(a.damage ?? 0) - dmgPercent(b.damage ?? 0)) * dir;
      }

      // value
      const valueA = getCarTotalValue(a);
      const valueB = getCarTotalValue(b);
      return (valueA - valueB) * dir;
    });
    return arr;
  }, [cars, sortKey, sortDir]);

  // Sell Selected cars (blocked for cars in race)
  const sellSelectedCars = async () => {
    if (selectedCars.length === 0) {
      setMessageType("info");
      setMessage("Ingen biler valgt.");
      return;
    }

    if (selectedSellableCars.length === 0) {
      setMessageType("warning");
      setMessage("Valgte biler kan ikke selges fordi de er i et løp.");
      return;
    }

    setSellAllBusy(true);
    const characterRef = fsDoc(db, "Characters", userCharacter.id);
    const batch = writeBatch(db);

    let totalSoldValue = 0;
    for (const car of selectedSellableCars) {
      totalSoldValue += getCarTotalValue(car);
      const carRef = fsDoc(db, "Characters", userCharacter.id, "cars", car.id);
      batch.delete(carRef);
    }

    try {
      await batch.commit();
      await updateDoc(characterRef, {
        "stats.money": (userCharacter.stats.money || 0) + totalSoldValue,
      });

      setMessageType("success");
      setMessage(
        <p>
          Du solgte{" "}
          <strong>
            {selectedSellableCars.length}{" "}
            {selectedSellableCars.length === 1 ? "bil" : "biler"}
          </strong>{" "}
          for <i className="fa-solid fa-dollar-sign"></i>{" "}
          <strong>{totalSoldValue.toLocaleString("nb-NO")}</strong>.
        </p>
      );
    } catch (err) {
      console.error("Feil ved salg av valgte biler: ", err);
      setMessageType("failure");
      setMessage("En ukjent feil dukket opp ved salg av valgte biler.");
    } finally {
      setSellAllBusy(false);
      setShowConfirmSellAll(false);
      setSelectedIds(new Set()); // clear selection after selling
    }
  };

  // Sell all cars in current city: only those not in race
  const sellAllCars = async () => {
    if (cars.length === 0) {
      setMessageType("info");
      setMessage("Du har ingen biler å selge.");
      return;
    }

    if (sellableCars.length === 0) {
      setMessageType("warning");
      setMessage("Ingen biler kan selges nå – alle er i løp.");
      return;
    }

    setSellAllBusy(true);
    const characterRef = fsDoc(db, "Characters", userCharacter.id);
    const batch = writeBatch(db);

    let totalSoldValue = 0;
    for (const car of sellableCars) {
      totalSoldValue += getCarTotalValue(car);
      const carRef = fsDoc(db, "Characters", userCharacter.id, "cars", car.id);
      batch.delete(carRef);
    }

    try {
      await batch.commit();
      await updateDoc(characterRef, {
        "stats.money": (userCharacter.stats.money || 0) + totalSoldValue,
      });

      setMessageType("success");
      setMessage(
        <p>
          Du solgte{" "}
          <strong>
            {sellableCars.length} {sellableCars.length === 1 ? "bil" : "biler"}
          </strong>{" "}
          for <i className="fa-solid fa-dollar-sign"></i>{" "}
          <strong>{totalSoldValue.toLocaleString("nb-NO")}</strong>.
        </p>
      );
    } catch (err) {
      console.error("Feil ved salg av biler: ", err);
      setMessageType("failure");
      setMessage("En ukjent feil dukket opp ved salg av biler.");
    } finally {
      setSellAllBusy(false);
      setShowConfirmSellAll(false);
    }
  };

  const toggleUpgrading = () => {
    if (!canUpgrade) return;
    setUpgrading(!upgrading);
  };

  if (userCharacter?.inJail && jailRemainingSeconds > 0) {
    return <JailBox message={message} messageType={messageType} />;
  }

  const allSellableSelected =
    sellableCars.length > 0 && sellableCars.every((c) => selectedIds.has(c.id));

  return (
    <Main>
      <div className="flex flex-col gap-4">
        <div>
          <H1>Parkering</H1>
          <p>
            Dette er en oversikt over parkering og biler du har i{" "}
            <strong className="text-neutral-200">
              {userCharacter?.location}
            </strong>
            .
          </p>
        </div>

        {/* Infobox */}
        {message && <InfoBox type={messageType}>{message}</InfoBox>}

        <ConfirmDialog
          open={showConfirmSellAll}
          title={anySelected ? "Selg valgte biler?" : "Selg alle biler?"}
          description={
            <div className="text-sm sm:text-base space-y-1">
              <p>
                Dette vil selge{" "}
                <strong>
                  {anySelected
                    ? selectedSellableCars.length
                    : sellableCars.length}{" "}
                  {(anySelected
                    ? selectedSellableCars.length
                    : sellableCars.length) === 1
                    ? "bil"
                    : "biler"}
                </strong>{" "}
                i <strong>{userCharacter.location}</strong>.
              </p>
              <p>
                Forventet inntekt:{" "}
                <strong>
                  <i className="fa-solid fa-dollar-sign" />{" "}
                  {(anySelected
                    ? selectedSellableTotalValue
                    : totalSellableValue
                  ).toLocaleString("nb-NO")}
                </strong>
              </p>
              <p className="text-stone-400">
                <small>Handlingen kan ikke angres!</small>
              </p>
            </div>
          }
          confirmLabel={anySelected ? "Ja, selg valgte" : "Ja, selg alle"}
          cancelLabel="Avbryt"
          loading={sellAllBusy}
          onConfirm={() => (anySelected ? sellSelectedCars() : sellAllCars())}
          onCancel={() => setShowConfirmSellAll(false)}
        />

        {/* Parking facility */}
        {!upgrading && (
          <Box>
            <div className="flex justify-between flex-wrap-reverse items-baseline gap-x-4">
              <H2>
                {parking !== null ? ParkingTypes[parking].name : "Loading..."}
              </H2>

              <div className="flex justify-end flex-grow">
                {canUpgrade && (
                  <div className="flex justify-end flex-grow">
                    <Button
                      style="black"
                      size="small"
                      onClick={toggleUpgrading}
                    >
                      <p>
                        Oppgrader <i className="fa-solid fa-arrow-up"></i>
                      </p>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <p>
                Plasser:{" "}
                <strong className="text-neutral-200">
                  {parking !== null
                    ? ParkingTypes[parking].slots
                    : "Loading..."}
                </strong>
              </p>
              <p>
                Sikkerhet:{" "}
                <strong className="text-neutral-200">
                  {parking !== null
                    ? ParkingTypes[parking].security
                    : "Loading..."}
                  %
                </strong>
              </p>
            </div>
          </Box>
        )}

        {canUpgrade && upgrading && (
          <Box>
            <div className="flex justify-between items-baseline gap-4">
              <H2>Oppgrader?</H2>
              <Button
                style="exit"
                size="small-square"
                onClick={toggleUpgrading}
              >
                <p>
                  <i className="fa-solid fa-x"></i>
                </p>
              </Button>
            </div>

            <p className="mb-2">
              <strong className="text-neutral-200">
                {ParkingTypes[parking].name}{" "}
              </strong>
              <i className="text-yellow-400 fa-solid fa-arrow-right-long"></i>
              <strong className="text-neutral-200">
                {" "}
                {ParkingTypes[parking + 1].name}
              </strong>
            </p>

            <div className="flex gap-x-8 gap-y-2 flex-wrap">
              <div>
                <H3>Plasser</H3>
                <p>
                  <strong className="text-neutral-200">
                    {ParkingTypes[parking].slots}{" "}
                  </strong>
                  <i className="text-yellow-400 fa-solid fa-arrow-right-long"></i>
                  <strong className="text-neutral-200">
                    {" "}
                    {ParkingTypes[parking + 1].slots}
                  </strong>
                </p>
              </div>

              <div>
                <H3>Sikkerhet</H3>
                <p>
                  <strong className="text-neutral-200">
                    {ParkingTypes[parking].security}%{" "}
                  </strong>
                  <i className="text-yellow-400 fa-solid fa-arrow-right-long"></i>
                  <strong className="text-neutral-200">
                    {" "}
                    {ParkingTypes[parking + 1].security}%
                  </strong>
                </p>
              </div>

              <div className="flex flex-grow justify-end items-end">
                <Button
                  onClick={() =>
                    parking !== null &&
                    updateParking(
                      userCharacter.id,
                      userCharacter.location,
                      parking + 1
                    )
                  }
                >
                  Oppgrader <i className="fa-solid fa-arrow-up"></i>{" "}
                  <strong className="text-yellow-400">
                    <i className="fa-solid fa-dollar-sign"></i>{" "}
                    {ParkingTypes[parking + 1].price.toLocaleString("nb-NO")}
                  </strong>
                </Button>
              </div>
            </div>
          </Box>
        )}

        {/* Parking table */}
        {!upgrading && (
          <div>
            <table className="w-full table-auto border border-collapse text-left">
              <colgroup>
                {parkingTableCols.map((cls, i) => (
                  <col key={i} className={cls || undefined} />
                ))}
              </colgroup>

              <thead>
                <tr className="border border-neutral-700 bg-neutral-950 text-neutral-200">
                  <th className="px-2 py-1 w-8">
                    <input
                      type="checkbox"
                      aria-label="Velg alle"
                      checked={allSellableSelected}
                      onChange={(e) => {
                        if (e.target.checked)
                          setSelectedIds(
                            new Set(sellableCars.map((c) => c.id))
                          );
                        else setSelectedIds(new Set());
                      }}
                    />
                  </th>
                  <th className="px-2 py-1">
                    <button
                      type="button"
                      onClick={() => requestSort("name")}
                      className="flex items-center gap-1 hover:underline"
                    >
                      Bil
                      <span
                        className={
                          "inline-block w-4 text-center " +
                          (sortKey === "name" ? "opacity-100" : "invisible")
                        }
                        aria-hidden
                      >
                        {sortDir === "asc" ? (
                          <i className="fa-solid fa-caret-up"></i>
                        ) : (
                          <i className="fa-solid fa-caret-down"></i>
                        )}
                      </span>
                    </button>
                  </th>

                  <th className="px-2 py-1 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => requestSort("hp")}
                      className="flex items-center gap-1 hover:underline"
                    >
                      Effekt
                      <span
                        className={
                          "inline-block w-4 text-center " +
                          (sortKey === "hp" ? "opacity-100" : "invisible")
                        }
                        aria-hidden
                      >
                        {sortDir === "asc" ? (
                          <i className="fa-solid fa-caret-up"></i>
                        ) : (
                          <i className="fa-solid fa-caret-down"></i>
                        )}
                      </span>
                    </button>
                  </th>

                  <th className="px-2 py-1 whitespace-nowrap hidden sm:table-cell">
                    <button
                      type="button"
                      onClick={() => requestSort("damage")}
                      className="flex items-center gap-1 hover:underline"
                    >
                      Skade
                      <span
                        className={
                          "inline-block w-4 text-center " +
                          (sortKey === "damage" ? "opacity-100" : "invisible")
                        }
                        aria-hidden
                      >
                        {sortDir === "asc" ? (
                          <i className="fa-solid fa-caret-up"></i>
                        ) : (
                          <i className="fa-solid fa-caret-down"></i>
                        )}
                      </span>
                    </button>
                  </th>

                  <th className="px-2 py-1 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => requestSort("value")}
                      className="flex items-center gap-1 hover:underline"
                    >
                      Verdi
                      <span
                        className={
                          "inline-block w-4 text-center " +
                          (sortKey === "value" ? "opacity-100" : "invisible")
                        }
                        aria-hidden
                      >
                        {sortDir === "asc" ? (
                          <i className="fa-solid fa-caret-up"></i>
                        ) : (
                          <i className="fa-solid fa-caret-down"></i>
                        )}
                      </span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedCars.length ? (
                  sortedCars.map((car) => {
                    const catalog = getCatalogForCar(car);
                    const locked = isLocked(car);
                    const checked = selectedIds.has(car.id);

                    const displayName = catalog?.name ?? car.name ?? "Bil";
                    const tier = catalog?.tier ?? car.tier ?? undefined;
                    const hp = catalog?.hp ?? car.hp ?? 0;
                    const damagePct = dmgPercent(car.damage ?? 0);
                    const totalCarValue = getCarTotalValue(car);

                    return (
                      <tr
                        className={`border bg-neutral-800 border-neutral-700 ${
                          locked ? "opacity-60" : ""
                        }`}
                        key={car.id}
                        title={
                          locked ? "Kan ikke selges: Bilen er i et løp." : ""
                        }
                      >
                        <td className="px-2 py-1 w-8">
                          <input
                            type="checkbox"
                            disabled={locked}
                            checked={locked ? false : checked}
                            onChange={() => toggleSelected(car.id)}
                            aria-label={`Velg ${displayName}`}
                            title={locked ? "Bilen er i et løp" : ""}
                          />
                        </td>
                        <td className="px-2 py-1 text-sm sm:text-base">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="truncate">
                              <Item
                                name={displayName}
                                tier={tier}
                                itemType="car"
                                tooltipImg={catalog?.img && catalog.img}
                                tooltipContent={
                                  <div>
                                    <p>
                                      Effekt:{" "}
                                      <strong className="text-neutral-200">
                                        {hp} hk
                                      </strong>
                                    </p>
                                    <p>
                                      Skade:{" "}
                                      <strong className="text-neutral-200">
                                        {damagePct}%
                                      </strong>
                                    </p>
                                    <p>
                                      Verdi:{" "}
                                      <strong className="text-neutral-200">
                                        <i className="fa-solid fa-dollar-sign"></i>{" "}
                                        {totalCarValue.toLocaleString("nb-NO")}
                                      </strong>
                                    </p>
                                    {locked && (
                                      <p className="text-yellow-400">
                                        Kan ikke selges (i løp).
                                      </p>
                                    )}
                                  </div>
                                }
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-1 text-sm sm:text-base whitespace-nowrap">
                          <strong className="text-neutral-200">{hp} hk</strong>
                        </td>

                        <td className="px-2 py-1 text-sm sm:text-base whitespace-nowrap hidden sm:table-cell">
                          <span
                            className={damagePct >= 100 ? "text-red-400" : ""}
                          >
                            {damagePct}%
                          </span>
                        </td>

                        <td className="px-2 py-1 text-sm sm:text-base whitespace-nowrap">
                          <strong className="text-neutral-200">
                            <i className="fa-solid fa-dollar-sign"></i>{" "}
                            {totalCarValue.toLocaleString("nb-NO")}
                          </strong>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="border bg-neutral-800 border-neutral-700">
                    <td colSpan={5} className="px-2 py-1">
                      Du har ingen biler.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border border-neutral-700 bg-neutral-950">
                  <td className="px-2 py-1"></td>
                  <td className="px-2 py-1"></td>
                  <td className="px-2 py-1 hidden sm:table-cell"></td>
                  <td className="px-2 py-1">
                    <p className="text-sm sm:text-base">
                      {anySelected ? "Verdi valgte" : "Total verdi"}
                    </p>
                    {!anySelected && (
                      <div className="text-xs text-stone-400">
                        Selgbar verdi
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1 text-sm sm:text-base">
                    <strong className="text-neutral-200">
                      <i className="fa-solid fa-dollar-sign"></i>{" "}
                      {(anySelected
                        ? selectedTotalValue
                        : totalValue
                      ).toLocaleString("nb-NO")}
                    </strong>
                    <div className="text-xs text-stone-400">
                      {anySelected ? (
                        <></>
                      ) : (
                        <>
                          <i className="fa-solid fa-dollar-sign"></i>{" "}
                          {totalSellableValue.toLocaleString("nb-NO")}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="flex justify-between mt-4">
              <p>
                <strong className="text-neutral-200">{cars.length}</strong> av{" "}
                <strong className="text-neutral-200">
                  {parking !== null
                    ? ParkingTypes[parking].slots
                    : "Loading..."}
                </strong>{" "}
                plasser brukt.
              </p>
              {anySelected ? (
                <Button
                  onClick={() => {
                    if (selectedCars.length === 0) {
                      setMessageType("info");
                      setMessage("Ingen biler valgt.");
                      return;
                    }
                    setShowConfirmSellAll(true); // reuse the dialog
                  }}
                >
                  Selg valgte
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (cars.length === 0) {
                      setMessageType("info");
                      setMessage("Du har ingen biler å selge.");
                      return;
                    }
                    setShowConfirmSellAll(true);
                  }}
                >
                  Selg alle
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Main>
  );
};

export default Parking;
