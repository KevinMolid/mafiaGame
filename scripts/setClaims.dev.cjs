const admin = require("firebase-admin");

// 🔐 Load DEV service account
const serviceAccount = require("./serviceAccount.dev.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setClaims(uid, claims) {
  await admin.auth().setCustomUserClaims(uid, claims);
  console.log("Claims set for", uid, claims);
}

// 🔧 CHANGE THESE
const UID = "Lx77IY8pI8d1E7ARW79hiCMMRYG2";

setClaims(UID, {
  admin: true,
  banned: false,
})
  .then(() => process.exit())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
