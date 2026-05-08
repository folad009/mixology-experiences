import { NextRequest, NextResponse } from "next/server";
import {
  archiveActiveOrders,
  createOrder,
  fetchOrders,
} from "@/lib/order-repository";
import type { DrinkCategory, DrinkType, OrderStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status") as OrderStatus | null;
    const scopeParam = request.nextUrl.searchParams.get("scope");
    const scope = scopeParam === "archived" ? "archived" : "active";
    const orders = await fetchOrders(status ?? undefined, scope);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Failed to fetch orders", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as
      | {
          action: "archive";
        }
      | {
      nickname: string;
      drinkType: DrinkType;
      category: DrinkCategory;
      drinkName: string;
      selections: string[];
    };

    if ("action" in body && body.action === "archive") {
      const archivedCount = await archiveActiveOrders();
      return NextResponse.json({ archivedCount });
    }

    if ("action" in body) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (!body.nickname || !body.drinkName || !Array.isArray(body.selections)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const order = await createOrder({
      nickname: body.nickname,
      drinkType: body.drinkType,
      category: body.category,
      drinkName: body.drinkName,
      selections: body.selections,
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Failed to create order", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
