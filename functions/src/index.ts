import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";

admin.initializeApp();
const db = admin.firestore();

// Returns today's YYYY-MM-DD in Europe/Oslo
function osloYmd(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date); // "YYYY-MM-DD"
}

/**
 * Scheduled daily interest at 00:00 Europe/Oslo (v2 scheduler).
 * Adds 5% interest to stats.bank for every character once per Oslo day.
 * Uses field stats.bankLastInterestDate to ensure idempotency per day.
 */
export const accrueDailyBankInterest = onSchedule(
  {
    schedule: "*/5 * * * *",   // 00:00 every day
    timeZone: "Europe/Oslo", // important
    // region: "europe-west1", // (optional) set a region if you want
  },
  async () => {
    const today = osloYmd();

    const pageSize = 400; // tune for your project
    let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;
    let processedCount = 0;

    for (;;) {
      let q = db
        .collection("Characters")
        .orderBy(admin.firestore.FieldPath.documentId())
        .limit(pageSize) as FirebaseFirestore.Query;

      if (lastDoc) q = q.startAfter(lastDoc);

      const snap = await q.get();
      if (snap.empty) break;

      const batch = db.batch();

      snap.docs.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const stats = data?.stats ?? {};
        const bank: number = Number(stats.bank) || 0;
        const already = stats.bankLastInterestDate === today;

        if (bank > 0 && !already) {
          const interest = Math.floor(bank * 0.05);
          const ref = docSnap.ref;

          batch.update(ref, {
            "stats.bank": admin.firestore.FieldValue.increment(interest),
            "stats.bankLastInterestDate": today,
          });

          // optional alert
          const alertRef = ref.collection("alerts").doc();
          batch.set(alertRef, {
            type: "bank_interest",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            amount: interest,
            read: false,
          });

          processedCount++;
        }
      });

      await batch.commit();

      lastDoc = snap.docs[snap.docs.length - 1];
      if (!lastDoc || snap.size < pageSize) break;
    }

    console.log(
      `Daily bank interest applied to ${processedCount} characters for ${today}.`
    );
  }
);
