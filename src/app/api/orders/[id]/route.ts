import { NextRequest, NextResponse } from "next/server";
import { fetchOrderById, updateOrderStatus } from "@/lib/order-repository";
import type { OrderStatus } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const order = await fetchOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    console.error("Failed to fetch order", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json()) as { status: OrderStatus };
  const allowed: OrderStatus[] = ["Pending", "Preparing", "Completed"];

  if (!allowed.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const order = await updateOrderStatus(id, body.status);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    console.error("Failed to update order status", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
