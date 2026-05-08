import { NextRequest, NextResponse } from "next/server";
import { markOrdersReady } from "@/lib/order-repository";

type BulkReadyPayload = {
  orderIds: string[];
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as BulkReadyPayload;
  const orderIds = Array.isArray(body.orderIds) ? body.orderIds : [];
  const uniqueIds = Array.from(new Set(orderIds.filter((id) => typeof id === "string" && id.trim().length > 0)));

  if (uniqueIds.length < 5) {
    return NextResponse.json(
      { error: "Select at least 5 pending orders to mark as ready." },
      { status: 400 },
    );
  }

  try {
    const updatedOrders = await markOrdersReady(uniqueIds);
    return NextResponse.json({
      updatedOrders,
      updatedCount: updatedOrders.length,
    });
  } catch (error) {
    console.error("Failed to bulk update orders", error);
    return NextResponse.json({ error: "Failed to bulk update orders" }, { status: 500 });
  }
}
