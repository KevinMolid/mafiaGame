import { useState } from "react";

import H2 from "../components/Typography/H2";
import H4 from "../components/Typography/H4";
import Box from "../components/Box";
import Button from "../components/Button";
import InfoBox from "../components/InfoBox";

import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

import { useAuth } from "../AuthContext";
import { useCharacter } from "../CharacterContext";

const EditProfile = () => {
  const { userData } = useAuth();
  const { userCharacter } = useCharacter();
  const [imgUrl, setimgUrl] = useState(userCharacter ? userCharacter.img : "");
  const [profileTxt, setProfileTxt] = useState(
    userCharacter ? userCharacter.profileText : ""
  );
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "failure" | "info"
  >("info");
  const [helpActive, setHelpActive] = useState<boolean>(false);

  const handleImgChange = (e: any) => {
    setimgUrl(e.target.value);
  };

  const handleProfileTxtChange = (e: any) => {
    setProfileTxt(e.target.value);
  };

  const updateProfile = async () => {
    try {
      // Reference to the player's document in Firestore
      const characterRef = doc(db, "Characters", userData.activeCharacter);

      // Update Profile Img in Firestore
      await updateDoc(characterRef, {
        img: imgUrl,
        profileText: profileTxt,
      });

      setMessage("Profilen ble oppdatert!");
      setMessageType("success");
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Det oppstod en feil under lagring av profilen!");
      setMessageType("failure");
    }
  };

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <H2>Endre profil</H2>
        {helpActive ? (
          <Button
            size="small-square"
            style="helpActive"
            onClick={() => setHelpActive(!helpActive)}
          >
            <i className="fa-solid fa-question"></i>
          </Button>
        ) : (
          <Button
            size="small-square"
            style="help"
            onClick={() => setHelpActive(!helpActive)}
          >
            <i className="fa-solid fa-question"></i>
          </Button>
        )}
      </div>

      {message && (
        <InfoBox type={messageType} onClose={() => setMessage("")}>
          {message}
        </InfoBox>
      )}

      {helpActive && (
        <div className="mb-4">
          <Box type="help" className="text-sm">
            <article>
              <H4>Formatering av tekst med BB-koder</H4>
              <p className="mb-2">
                Du kan bruke BB-koder for å formatere tekst og legge til lenker
                i profilen din.
              </p>

              <table className="w-full border-collapse border border-neutral-700 text-left">
                <thead className="bg-neutral-800">
                  <tr>
                    <th className="p-2 border border-neutral-700 w-[40%]">
                      BB-kode
                    </th>
                    <th className="p-2 border border-neutral-700">Resultat</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-neutral-700">
                      [b]fet[/b]
                    </td>
                    <td className="p-2 border border-neutral-700">
                      <strong>fet</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-neutral-700">
                      [i]skrå[/i]
                    </td>
                    <td className="p-2 border border-neutral-700">
                      <em>skrå</em>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-neutral-700">
                      [u]understreket[/u]
                    </td>
                    <td className="p-2 border border-neutral-700">
                      <u>understreket</u>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-neutral-700">
                      [s]gjennomstreket[/s]
                    </td>
                    <td className="p-2 border border-neutral-700">
                      <s>gjennomstreket</s>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-neutral-700">
                      [color=#ff0000]farget[/color]
                    </td>
                    <td className="p-2 border border-neutral-700">
                      <span className="text-[#ff0000]">farget</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-neutral-700">
                      [size=8]liten[/size]
                    </td>
                    <td className="p-2 border border-neutral-700">
                      <span className="text-[8px]">liten</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-neutral-700">
                      [size=48]stor[/size]
                    </td>
                    <td className="p-2 border border-neutral-700">
                      <span className="text-[48px] leading-none">stor</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-neutral-700">
                      [url]https://example.com[/url]
                    </td>
                    <td className="p-2 border border-neutral-700">
                      <a
                        href="https://example.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:underline"
                      >
                        https://example.com
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-neutral-700">
                      [url=https://example.com]klikk her[/url]
                    </td>
                    <td className="p-2 border border-neutral-700">
                      <a
                        href="https://example.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:underline"
                      >
                        klikk her
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </article>
          </Box>
        </div>
      )}

      <form action="" className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col">
          <label htmlFor="profileImg">
            Profilbilde (Anbefalt størrelse: 320 x 320 px)
          </label>
          <input
            className="bg-transparent border-b border-neutral-600 py-1 text-white placeholder-neutral-500 focus:border-white focus:outline-none"
            id="profileImg"
            type="text"
            value={imgUrl}
            spellCheck={false}
            onChange={handleImgChange}
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="profileTxt">Profiltekst</label>
          <textarea
            rows={8}
            name=""
            id="profileTxt"
            className="bg-neutral-900 py-2 border border-neutral-600 px-4 text-white placeholder-neutral-400 w-full resize-none"
            value={profileTxt}
            spellCheck={false}
            onChange={handleProfileTxtChange}
          ></textarea>
        </div>
      </form>

      <Button onClick={updateProfile}>Lagre</Button>
    </section>
  );
};

export default EditProfile;
