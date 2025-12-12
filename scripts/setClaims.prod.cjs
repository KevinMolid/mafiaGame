const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccount.prod.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setAdmin(uid) {
  await admin.auth().setCustomUserClaims(uid, {
    admin: true,
  });
  console.log("🚀 PROD admin set:", uid);
}

setAdmin("PROD_UID_HERE");