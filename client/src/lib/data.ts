import auraVip1 from "@assets/WhatsApp_Image_2026-01-04_at_1.03.01_PM_1767632673643.jpeg";
import auraVip2 from "@assets/image_1767632695009.png";
import auraVip3 from "@assets/image_1767632704929.png";
import treeCamping from "@assets/image_1767377091964.png";
import nidoCamping from "@assets/image_1767376107559.png";

const auraExtras = [
  "/assets/aura/aura_extra_1.png",
  "/assets/aura/aura_extra_2.png",
  "/assets/aura/aura_extra_3.png",
  "/assets/aura/aura_extra_4.png",
  "/assets/aura/aura_extra_5.png",
  "/assets/aura/aura_extra_6.png",
];

const auraImages = [
  "/assets/aura_new/aura_1.png",
  "/assets/aura_new/aura_2.png",
  "/assets/aura_new/aura_3.png",
  "/assets/aura_new/aura_4.png",
  "/assets/aura_new/aura_5.png",
  "/assets/pool/pool_1.png",
  "/assets/pool/pool_2.png",
];

const arbolExtras = [
  "/assets/arbol/arbol_extra_1.png",
  "/assets/arbol/arbol_extra_2.png",
  "/assets/arbol/arbol_extra_3.png",
];

const treeImages = [
  treeCamping,
  ...arbolExtras,
  "/assets/pool/pool_1.png",
  "/assets/pool/pool_2.png",
];

const nidoExtras = [
  "/assets/nido/nido_extra_1.png",
  "/assets/nido/nido_extra_2.png",
];

const nidoImages = [
  nidoCamping,
  ...nidoExtras,
  "/assets/pool/pool_1.png",
  "/assets/pool/pool_2.png",
];

export const seasonalBlocks = [
  { start: new Date(2026, 0, 1), end: new Date(2026, 1, 28) }, // Enero - Febrero (2 meses)
  { start: new Date(2026, 2, 1), end: new Date(2026, 4, 30) }, // Marzo - Mayo (3 meses)
  { start: new Date(2026, 5, 1), end: new Date(2026, 7, 31) }, // Junio - Agosto (3 meses)
  { start: new Date(2026, 8, 1), end: new Date(2026, 10, 30) }, // Septiembre - Noviembre (3 meses)
  { start: new Date(2026, 11, 1), end: new Date(2026, 11, 31) }, // Diciembre (1 mes/ajuste)
];

export function getActiveSeason(date: Date = new Date()) {
  return seasonalBlocks.find(
    (block) => date >= block.start && date <= block.end,
  );
}

// Static data for fallback and non-dynamic parts
export const campings = [
  {
    id: 1,
    typeId: 1,
    name: "Aura 1",
    images: auraImages,
    image: "/assets/aura_new/aura_1.png",
    description: "Unidad Aura 1: Privacidad total con jacuzzi privado.",
    features: [
      "Jacuzzi privado",
      "Hamaca",
      "Malla catamaran",
      "Baño privado",
      "Piscina",
    ],
    rating: 5.0,
  },
  {
    id: 2,
    typeId: 1,
    name: "Aura 2",
    images: auraImages,
    image: "/assets/aura_new/aura_1.png",
    description:
      "Unidad Aura 2: Refugio romántico con todas las comodidades VIP.",
    features: [
      "Jacuzzi privado",
      "Hamaca",
      "Malla catamaran",
      "Baño privado",
      "Piscina",
    ],
    rating: 5.0,
  },
  {
    id: 3,
    typeId: 1,
    name: "Aura 3",
    images: auraImages,
    image: "/assets/aura_new/aura_1.png",
    description: "Unidad Aura 3: Experiencia de lujo rodeada de naturaleza.",
    features: [
      "Jacuzzi privado",
      "Hamaca",
      "Malla catamaran",
      "Baño privado",
      "Piscina",
    ],
    rating: 5.0,
  },
  {
    id: 4,
    typeId: 1,
    name: "Aura 4",
    images: auraImages,
    image: "/assets/aura_new/aura_1.png",
    description:
      "Unidad Aura 4: Nuestra unidad más apartada para máxima desconexión.",
    features: [
      "Jacuzzi privado",
      "Hamaca",
      "Malla catamaran",
      "Baño privado",
      "Piscina",
    ],
    rating: 5.0,
  },
  {
    id: 5,
    typeId: 2,
    name: "Árbol 1",
    images: treeImages,
    image: treeCamping,
    description:
      "Unidad Árbol 1: Elevada entre las copas, una perspectiva única.",
    features: ["Malla catamaran", "Piscina", "Baño zona social"],
    rating: 4.9,
  },
  {
    id: 6,
    typeId: 3,
    name: "Nido 1",
    images: nidoImages,
    image: nidoCamping,
    description:
      "Unidad Nido 1: El refugio perfecto para una conexión profunda.",
    features: ["Hamaca", "Piscina", "Baño zona social"],
    rating: 4.8,
  },
];

export const plans = [
  {
    id: "bruma",
    name: "Plan Bruma de Temporada",
    description: "Nuestra experiencia insignia con detalles de temporada.",
    features: [
      "Bebida de bienvenida",
      "Fogata con Masmelos",
      "Metas en pareja",
      "Velada romántica",
      "Desayuno tamal hechos por mamá",
      "Servicio a la habitación",
      "Camping que escojas con sus comodidades",
      "Parqueadero",
    ],
  },
  {
    id: "reconectar",
    name: "Plan Reconectar",
    description: "Cena romántica, vino, decoración y fogata.",
    features: [
      "Bebida de bienvenida",
      "Fogata con Masmelos",
      "Cena romántica",
      "Decoración completa",
      "Meditación guiada",
      "Desayuno",
      "Servicio a la habitación",
      "Camping que escojas con sus comodidades",
      "Parqueadero",
    ],
  },
  {
    id: "rutina",
    name: "Plan Salir de la Rutina",
    description: "Cine bajo las estrellas, combo cena y fogata.",
    features: [
      "Bebida de bienvenida",
      "Fogata con Masmelos",
      "Cena noche de películas",
      "Desayuno",
      "Servicio a la habitación",
      "Camping que escojas con sus comodidades",
      "Parqueadero",
    ],
  },
];

export const pricingMatrix: Record<number, Record<string, number>> = {
  1: {
    // Aura Type
    bruma: 599990,
    reconectar: 559990,
    rutina: 529990,
  },
  2: {
    // Arbol Type
    bruma: 399990,
    reconectar: 369990,
    rutina: 349990,
  },
  3: {
    // Nido Type
    bruma: 369990,
    reconectar: 349990,
    rutina: 329990,
  },
};

export const addons = [
  {
    id: "dec_basica",
    title: "Agrega un detalle especial a tu decoración",
    price: 50000,
    description:
      "Si tu plan ya incluye decoración, puedes complementarla con: Tarta vasca de cumpleaños y HBD Pedida de noviazgo",
    details: ["Tarta vasca de cumpleaños y HBD", "Pedida de noviazgo"],
  },
  {
    id: "dec_premium",
    title: "Decoración premium",
    price: 70000,
    description:
      "9 fotos + luces decorativas + pizarra personalizada + flores naturales + velitas + letrero 'Te amo'.",
    details: [
      "9 fotos impresas",
      "Luces LED decorativas",
      "Pizarra personalizada",
      "Flores naturales",
      "Velitas aromáticas",
      "Letrero 'Te amo'",
    ],
  },
  {
    id: "plan_3_dias_aura",
    title: "Plan adicional para 3 días",
    price: 450000,
    description:
      "Disponible desde el segundo día. Incluye: noche adicional + cena estándar + desayuno estándar. Check-in 3:00 pm, check-out 11:30 am.",
    details: [
      "Noche adicional de hospedaje",
      "Cena estándar (segunda noche)",
      "Desayuno estándar (tercer día)",
      "Check-in: 3:00 pm",
      "Check-out: 11:30 am",
    ],
  },
  {
    id: "plan_3_dias_arbol",
    title: "Plan adicional para 3 días",
    price: 390000,
    description:
      "Disponible desde el segundo día. Incluye: noche adicional + cena estándar + desayuno estándar. Check-in 3:00 pm, check-out 11:30 am.",
    details: [
      "Noche adicional de hospedaje",
      "Cena estándar (segunda noche)",
      "Desayuno estándar (tercer día)",
      "Check-in: 3:00 pm",
      "Check-out: 11:30 am",
    ],
  },
  {
    id: "plan_3_dias_nido",
    title: "Plan adicional para 3 días",
    price: 390000,
    description:
      "Disponible desde el segundo día. Incluye: noche adicional + cena estándar + desayuno estándar. Check-in 3:00 pm, check-out 11:30 am.",
    details: [
      "Noche adicional de hospedaje",
      "Cena estándar (segunda noche)",
      "Desayuno estándar (tercer día)",
      "Check-in: 3:00 pm",
      "Check-out: 11:30 am",
    ],
  },
  {
    id: "cena_romantica",
    title: "Cena romántica",
    price: 90000,
    description: "Cena especial para dos.",
    details: [
      "Menú especial de 3 pasos",
      "Decoración de mesa",
      "Bebida de acompañamiento",
    ],
  },
  {
    id: "almuerzos",
    title: "2 almuerzos caseros",
    price: 70000,
    description: "Deliciosos almuerzos caseros de mamá.",
    details: ["2 platos típicos", "Bebida natural", "Postre casero"],
  },
  {
    id: "cine_palomitas",
    title: "Cine y palomitas",
    price: 28000,
    description: "Proyector y palomitas.",
    details: ["Uso de proyector", "Palomitas de maíz calientes"],
  },
  {
    id: "cine_cena",
    title: "Combo noche de películas",
    price: 50000,
    description: "Cine + cena para una noche perfecta.",
    details: ["Proyector de cine", "Cena temática", "Palomitas"],
  },
  {
    id: "decoracion_cumpleanos",
    title: "Decoración de cumpleaños",
    price: 90000,
    description:
      "Letrero HBD + tarta vasca + dos copas de vino + porta retrato con foto personalizada + pizarra personalizada + velitas + tapete tipo picnic + rosas decorativas.",
    details: [
      "Letrero HBD",
      "Tarta vasca",
      "Dos copas de vino",
      "Porta retrato con foto personalizada",
      "Pizarra personalizada",
      "Velitas",
      "Tapete tipo picnic",
      "Rosas decorativas",
    ],
  },
  {
    id: "decoracion_pedida",
    title: "Decoración pedida de noviazgo o matrimonio",
    price: 120000,
    description:
      'Letrero "puedo ser tu novio" o "merry me" + pétalos + mini champaña + velitas + tapete tipo picnic + venda para sorpresa.',
    details: [
      'Letrero "puedo ser tu novio" o "merry me"',
      "Pétalos decorativos",
      "Mini champaña",
      "Velitas",
      "Tapete tipo picnic",
      "Venda para sorpresa",
    ],
  },
];
