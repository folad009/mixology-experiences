"use client";

import { create } from "zustand";
import type { DrinkCategory, DrinkType, Order } from "@/lib/types";

export type BuilderSelection = {
  drinkType: DrinkType;
  category: DrinkCategory;
  drinkName: string;
  selections: string[];
};

type OrderFlowState = {
  nickname: string;
  builder: BuilderSelection | null;
  placedOrder: Order | null;
  setNickname: (nickname: string) => void;
  setBuilder: (builder: BuilderSelection | null) => void;
  setPlacedOrder: (order: Order) => void;
  resetFlow: () => void;
};

export const useOrderFlowStore = create<OrderFlowState>((set) => ({
  nickname: "",
  builder: null,
  placedOrder: null,
  setNickname: (nickname) => set({ nickname }),
  setBuilder: (builder) => set({ builder }),
  setPlacedOrder: (placedOrder) => set({ placedOrder }),
  resetFlow: () => set({ nickname: "", builder: null, placedOrder: null }),
}));
