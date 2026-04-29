import { NextRequest, NextResponse } from "next/server";
import { createFeedback } from "@/lib/order-repository";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      orderId?: string;
      nickname: string;
      rating: number;
      answers: { taste: number; presentation: number; experience: number };
      comment?: string;
    };

    if (!body.nickname || !body.rating || !body.answers) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const feedback = await createFeedback({
      orderId: body.orderId,
      nickname: body.nickname,
      rating: body.rating,
      answers: body.answers,
      comment: body.comment,
    });

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    console.error("Failed to create feedback", error);
    return NextResponse.json({ error: "Failed to create feedback" }, { status: 500 });
  }
}
