import Box from "./Box";
import H2 from "./Typography/H2";
import Button from "./Button";

const JailBox = () => {
  return (
    <div className="my-4">
      <Box>
        <H2>Du er i fengsel!</H2>
        <p>Du kan ikke gjøre noen handlinger mens du sitter i fengsel.</p>
        <p className="mb-4">
          Tid som gjenstår:{" "}
          <strong className="text-neutral-200">120 sekunder</strong>
        </p>

        <Button>Stikk av</Button>
      </Box>
    </div>
  );
};

export default JailBox;
