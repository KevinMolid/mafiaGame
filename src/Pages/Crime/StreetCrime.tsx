import H1 from "../../components/Typography/H1";
import Button from "../../components/Button";
import CrimeBox from "../../components/CrimeBox";

const StreetCrime = () => {
  return (
    <section>
      <H1>Street Crimes</H1>
      <p className="mb-4 text-stone-400">Select Crime</p>
      <div className="grid grid-cols-[min-content_auto] gap-2 mb-4">
        <CrimeBox img="src\assets\PickpocketBw.png">Pickpocket</CrimeBox>
        <CrimeBox img="src\assets\VandalismBw.png">Vandalism</CrimeBox>
        <CrimeBox img="src\assets\ProtectionRacketBw.png">
          Protection Racket
        </CrimeBox>
        <CrimeBox img="src\assets\StreetRacingBw.png">Street Racing</CrimeBox>
      </div>
      <Button onClick={() => console.log("hehe")}>Commit Crime</Button>
    </section>
  );
};

export default StreetCrime;
