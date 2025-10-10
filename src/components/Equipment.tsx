interface EquipmentInterface {
  icon: string;
  span?: 2;
}

const EquipmentBox = ({ icon, span }: EquipmentInterface) => {
  return (
    <div
      className={
        "border border-neutral-500 bg-neutral-900 text-neutral-700 flex justify-center items-center rounded-md " +
        (span ? "col-span-2 row-span-2 text-6xl" : "text-3xl")
      }
    >
      <i className={`fa-solid fa-${icon}`}></i>
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
      <EquipmentBox icon="hat-cowboy"></EquipmentBox>
      <div></div>
      <div></div>
      <div></div>
      <EquipmentBox icon="glasses"></EquipmentBox>
      {/* 2. row */}
      <EquipmentBox icon="shirt"></EquipmentBox>
      <div></div>
      <div></div>
      <div></div>
      <EquipmentBox icon="ribbon"></EquipmentBox>
      {/* 3. row */}
      <EquipmentBox icon="socks"></EquipmentBox>
      <div></div>
      <div></div>
      <div></div>
      <EquipmentBox icon="mitten"></EquipmentBox>
      {/* 4. row */}
      <EquipmentBox icon="gun" span={2}></EquipmentBox>
      <div></div>
      <div></div>
      <EquipmentBox icon="ring"></EquipmentBox>
      {/* 5. row */}
      <div></div>
      <div></div>
      <EquipmentBox icon="ring"></EquipmentBox>
    </section>
  );
};

export default Equipment;
