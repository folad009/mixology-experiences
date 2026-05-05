import type { DrinkOption } from "@/lib/types";

export const TREAT_NAMES = {
  signatureGelato: "Signature Gelato Treat",
  signatureMilkshake: "Signature Milkshake Treat",
} as const;

export const SIGNATURE_DRINKS: DrinkOption[] = [
  {
    id: "cadbury-gelato-choco-chips",
    name: "Cadbury Chocolate gelato with choco chips",
    drinkType: "Signature",
    category: "IceCream",
    defaultSelections: ["Cadbury Chocolate Gelato", "Choco Chips"],
  },
  {
    id: "cadbury-gelato-brownies",
    name: "Cadbury Chocolate gelato with brownies",
    drinkType: "Signature",
    category: "IceCream",
    defaultSelections: ["Cadbury Chocolate Gelato", "Brownies"],
  }
];

export const CUSTOM_OPTIONS = {
  IceCream: ["Choco Chips", "Brownie Bits", "Caramel Drip", "Hazelnut Dust", "Whipped Cream"],
  Milkshake: [
    "Cadbury Chocolate Caramel Milkshake",
    "Cadbury Chocolate Expresso Milkshake",
    "Cadbury Chocolate Milkshake",
  ],
} as const;
