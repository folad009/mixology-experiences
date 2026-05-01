export type DrinkType = "Classic" | "Signature" | "Custom";
export type DrinkCategory = "IceCream" | "Milkshake";
export type OrderStatus = "Pending" | "Preparing" | "Completed";

export type DrinkOption = {
  id: string;
  name: string;
  drinkType: DrinkType;
  category: DrinkCategory;
  defaultSelections: string[];
  description?: string;
};

export type Order = {
  id: string;
  nickname: string;
  drinkType: DrinkType;
  category: DrinkCategory;
  drinkName: string;
  selections: string[];
  status: OrderStatus;
  createdAt: string;
};

export type Feedback = {
  id: string;
  orderId?: string;
  nickname: string;
  rating: number;
  answers: {
    taste: number;
    presentation: number;
    experience: number;
  };
  comment?: string;
  createdAt: string;
};
