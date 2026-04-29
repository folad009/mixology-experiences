import type { DrinkOption } from "@/lib/types";

export const SIGNATURE_DRINKS: DrinkOption[] = [
  {
    id: "double-choco-crunch",
    name: "Double Choco Crunch",
    description: "Chocolate ice cream + hot chocolate swirl + chips/brownie",
    drinkType: "Signature",
    category: "IceCream",
    defaultSelections: ["Chocolate Ice Cream", "Hot Choco Swirl", "Choco Chips"],
  },
  {
    id: "choco-caramel-drip",
    name: "Choco Caramel Drip",
    description: "Hot chocolate base + caramel swirl",
    drinkType: "Signature",
    category: "IceCream",
    defaultSelections: ["Chocolate Ice Cream", "Hot Choco Base", "Caramel Swirl"],
  },
  {
    id: "choco-coffee-kick",
    name: "Choco Coffee Kick",
    description: "Hot chocolate + espresso",
    drinkType: "Signature",
    category: "Milkshake",
    defaultSelections: ["Hot Chocolate", "Espresso Shot"],
  },
  {
    id: "choco-berry-fusion",
    name: "Choco Berry Fusion",
    description: "Hot chocolate + berry layer",
    drinkType: "Signature",
    category: "Milkshake",
    defaultSelections: ["Hot Chocolate", "Berry Layer"],
  },
];

export const CUSTOM_OPTIONS = {
  IceCream: ["Choco Chips", "Brownie Bits", "Caramel Drip", "Hazelnut Dust", "Whipped Cream"],
  Milkshake: ["Coffee Shot", "Berry Layer", "Caramel Syrup", "Vanilla Foam", "Cocoa Dust"],
} as const;
