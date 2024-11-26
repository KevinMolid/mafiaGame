import ToyotaCamry from "/images/cars/ToyotaCamry.jpg";
import HondaAccord from "/images/cars/HondaAccord.jpg";
import NissanAltima from "/images/cars/Nissan Altima.jpg";
import FordEscape from "/images/cars/Ford Escape.jpg";
import SubaruOutback from "/images/cars/Subaru Outback.jpg";
import ChevroletEquinox from "/images/cars/Chevrolet Equinox.jpg";
import ToyotaRAV4 from "/images/cars/Toyota RAV4.jpg";
import HondaCRV from "/images/cars/Honda CR-V.jpg";
import TeslaModel3 from "/images/cars/Tesla Model 3.jpg";
import BMW5Series from "/images/cars/BMW 5 Series.jpg";
import MercedesBenzS580 from "/images/cars/Mercedes-Benz S 580.jpg";
import Porsche911Carrera from "/images/cars/Porsche 911 Carrera.jpg";
import TeslaModelS from "/images/cars/Tesla Model S.jpg";
import PorscheMacan from "/images/cars/Porsche Macan.jpg";
import AudiQ7 from "/images/cars/Audi Q7.jpg";
import MercedesBenzEClass from "/images/cars/Mercedes-Benz E-Class.jpg";
import TeslaModelXPlaid from "/images/cars/Tesla Model X Plaid.jpg";
import BMWM8Competition from "/images/cars/BMW M8 Competition.jpg";
import AudiR8V10Performance from "/images/cars/Audi R8 V10 Performance.jpg";
import LamborghiniHuracánEVO from "/images/cars/Lamborghini Huracán EVO.jpg";
import FerrariF8Tributo from "/images/cars/Ferrari F8 Tributo.jpg";
import McLaren720s from "/images/cars/McLaren 720S.jpg";
import RollsRoyceGhost from "/images/cars/Rolls-Royce Ghost.jpg";
import AstonMartinDBSSuperleggera from "/images/cars/Aston Martin DBS Superleggera.jpg";
// Tier 5
import FerrariSF90Stradale from "/images/cars/Ferrari SF90 Stradale.jpg";
import PaganiZondaRevolucion from "/images/cars/Pagani Zonda Revolucion.jpg";
import LamborghiniVenenoRoadster from "/images/cars/Lamborghini Veneno Roadster.jpg";

const Cars = [
  // Tier 1
  {
    name: "Toyota Camry",
    value: 27000,
    hp: 203,
    img: ToyotaCamry,
    tier: 1,
    isElectric: false,
  },
  {
    name: "Honda Accord",
    value: 28000,
    hp: 192,
    img: HondaAccord,
    tier: 1,
    isElectric: false,
  },
  {
    name: "Nissan Altima",
    value: 26500,
    hp: 188,
    img: NissanAltima,
    tier: 1,
    isElectric: false,
  },
  {
    name: "Subaru Outback",
    value: 30000,
    hp: 182,
    img: SubaruOutback,
    tier: 1,
    isElectric: false,
  },
  { name: "Ford Escape", value: 29500, hp: 181, img: FordEscape, tier: 1 },
  {
    name: "Chevrolet Equinox",
    value: 28000,
    hp: 170,
    img: ChevroletEquinox,
    tier: 1,
    isElectric: false,
  },
  {
    name: "Toyota RAV4",
    value: 29000,
    hp: 203,
    img: ToyotaRAV4,
    tier: 1,
    isElectric: false,
  },
  {
    name: "Honda CR-V",
    value: 31000,
    hp: 190,
    img: HondaCRV,
    tier: 1,
    isElectric: false,
  },
  {
    name: "Tesla Model 3",
    value: 42000,
    hp: 283,
    img: TeslaModel3,
    tier: 1,
    isElectric: true,
  },

  // Tier 2
  {
    name: "BMW 5 Series",
    value: 55000,
    hp: 248,
    img: BMW5Series,
    tier: 2,
    isElectric: false,
  },
  {
    name: "Mercedes-Benz E-Class",
    value: 60000,
    hp: 255,
    img: MercedesBenzEClass,
    tier: 2,
    isElectric: false,
  },
  {
    name: "Audi Q7",
    value: 65000,
    hp: 261,
    img: AudiQ7,
    tier: 2,
    isElectric: false,
  },
  {
    name: "Porsche Macan",
    value: 63000,
    hp: 261,
    img: PorscheMacan,
    tier: 2,
    isElectric: false,
  },
  {
    name: "Tesla Model S",
    value: 95000,
    hp: 670,
    img: TeslaModelS,
    tier: 2,
    isElectric: true,
  },
  // Tier 3
  {
    name: "Porsche 911 Carrera",
    value: 115000,
    hp: 379,
    img: Porsche911Carrera,
    tier: 3,
    isElectric: false,
  },
  {
    name: "Mercedes-Benz S 580",
    value: 120000,
    hp: 496,
    img: MercedesBenzS580,
    tier: 3,
    isElectric: false,
  },
  {
    name: "Tesla Model X Plaid",
    value: 130000,
    hp: 1020,
    img: TeslaModelXPlaid,
    tier: 3,
    isElectric: true,
  },
  {
    name: "BMW M8 Competition",
    value: 135000,
    hp: 617,
    img: BMWM8Competition,
    tier: 3,
    isElectric: false,
  },
  {
    name: "Audi R8 V10 Performance",
    value: 200000,
    hp: 602,
    img: AudiR8V10Performance,
    tier: 3,
    isElectric: false,
  },
  // Tier 4
  {
    name: "Lamborghini Huracán EVO",
    value: 260000,
    hp: 630,
    img: LamborghiniHuracánEVO,
    tier: 4,
    isElectric: false,
  },
  {
    name: "Ferrari F8 Tributo",
    value: 280000,
    hp: 710,
    img: FerrariF8Tributo,
    tier: 4,
    isElectric: false,
  },
  { name: "McLaren 720S", value: 300000, hp: 710, img: McLaren720s, tier: 4 },
  {
    name: "Rolls-Royce Ghost",
    value: 340000,
    hp: 563,
    img: RollsRoyceGhost,
    tier: 4,
    isElectric: false,
  },
  {
    name: "Aston Martin DBS Superleggera",
    value: 315000,
    hp: 715,
    img: AstonMartinDBSSuperleggera,
    tier: 4,
    isElectric: false,
  },
  // Tier 5
  {
    name: "Ferrari SF90 Stradale",
    value: 995000,
    hp: 769,
    img: FerrariSF90Stradale,
    tier: 5,
    isElectric: false,
  },
  {
    name: "Pagani Zonda Revolucion",
    value: 2800000,
    hp: 800,
    img: PaganiZondaRevolucion,
    tier: 5,
    isElectric: false,
  },
  {
    name: "Lamborghini Veneno Roadster",
    value: 9500000,
    hp: 750,
    img: LamborghiniVenenoRoadster,
    tier: 5,
    isElectric: false,
  },
];

export default Cars;
