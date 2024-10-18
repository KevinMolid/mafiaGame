interface EquipmentInterface {
  letter: string;
  span?: 2;
}

const EquipmentBox = ({ letter, span }: EquipmentInterface) => {
  return (
    <div
      className={
        "border border-neutral-400 bg-neutral-900/90 text-sm flex justify-center items-center rounded-md " +
        (span && "col-span-2 row-span-2")
      }
    >
      {letter}
    </div>
  );
};

const Equipment = () => {
  return (
    <section
      className="grid grid-cols-5 grid-rows-6 h-[427px] w-[287px] bg-neutral-800 gap-1 p-2"
      style={{
        backgroundImage: "url('CharacterV4.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundPositionY: "top",
      }}
    >
      {/* Top row*/}
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      {/* Top row*/}
      <EquipmentBox letter="H"></EquipmentBox>
      <div></div>
      <div></div>
      <div></div>
      <EquipmentBox letter="R1"></EquipmentBox>
      {/* 2. row */}
      <EquipmentBox letter="T"></EquipmentBox>
      <div></div>
      <div></div>
      <div></div>
      <EquipmentBox letter="R2"></EquipmentBox>
      {/* 3. row */}
      <EquipmentBox letter="C"></EquipmentBox>
      <div></div>
      <div></div>
      <div></div>
      <EquipmentBox letter="G"></EquipmentBox>
      {/* 4. row */}
      <EquipmentBox letter="W" span={2}></EquipmentBox>
      <div></div>
      <div></div>
      <EquipmentBox letter="L"></EquipmentBox>
      {/* 5. row */}
      <div></div>
      <div></div>
      <EquipmentBox letter="F"></EquipmentBox>
    </section>
  );
};

export default Equipment;
