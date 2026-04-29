import { randomUUID } from "node:crypto";
import { pgPool } from "@/lib/db";
import type { Feedback, Order, OrderStatus } from "@/lib/types";

type OrderRow = {
  id: string;
  nickname: string;
  drink_type: Order["drinkType"];
  category: Order["category"];
  drink_name: string;
  selections: unknown;
  status: OrderStatus;
  created_at: string | Date;
};

type FeedbackRow = {
  id: string;
  order_id: string | null;
  nickname: string;
  rating: number;
  answers: unknown;
  comment: string | null;
  created_at: string | Date;
};

const toOrder = (row: OrderRow): Order => ({
  id: row.id,
  nickname: row.nickname,
  drinkType: row.drink_type,
  category: row.category,
  drinkName: row.drink_name,
  selections: Array.isArray(row.selections) ? (row.selections as string[]) : [],
  status: row.status,
  createdAt: new Date(row.created_at).toISOString(),
});

const toFeedback = (row: FeedbackRow): Feedback => ({
  id: row.id,
  orderId: row.order_id ?? undefined,
  nickname: row.nickname,
  rating: row.rating,
  answers:
    typeof row.answers === "object" && row.answers !== null
      ? (row.answers as Feedback["answers"])
      : { taste: 0, presentation: 0, experience: 0 },
  comment: row.comment ?? undefined,
  createdAt: new Date(row.created_at).toISOString(),
});

export async function fetchOrders(status?: OrderStatus | "all") {
  const baseQuery = `
    SELECT id, nickname, drink_type, category, drink_name, selections, status, created_at
    FROM orders
  `;
  const orderedQuery = " ORDER BY created_at DESC";

  if (!status || status === "all") {
    const result = await pgPool.query<OrderRow>(baseQuery + orderedQuery);
    return result.rows.map(toOrder);
  }

  const result = await pgPool.query<OrderRow>(baseQuery + " WHERE status = $1" + orderedQuery, [status]);
  return result.rows.map(toOrder);
}

export async function createOrder(input: Omit<Order, "id" | "status" | "createdAt">) {
  const id = randomUUID();
  const result = await pgPool.query<OrderRow>(
    `
      INSERT INTO orders (id, nickname, drink_type, category, drink_name, selections, status)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'Pending')
      RETURNING id, nickname, drink_type, category, drink_name, selections, status, created_at
    `,
    [id, input.nickname, input.drinkType, input.category, input.drinkName, JSON.stringify(input.selections)],
  );
  return toOrder(result.rows[0]);
}

export async function fetchOrderById(id: string) {
  const result = await pgPool.query<OrderRow>(
    `
      SELECT id, nickname, drink_type, category, drink_name, selections, status, created_at
      FROM orders
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );
  if (!result.rows[0]) return null;
  return toOrder(result.rows[0]);
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const result = await pgPool.query<OrderRow>(
    `
      UPDATE orders
      SET status = $2
      WHERE id = $1
      RETURNING id, nickname, drink_type, category, drink_name, selections, status, created_at
    `,
    [id, status],
  );
  if (!result.rows[0]) return null;
  return toOrder(result.rows[0]);
}

export async function createFeedback(input: Omit<Feedback, "id" | "createdAt">) {
  const id = randomUUID();
  const result = await pgPool.query<FeedbackRow>(
    `
      INSERT INTO feedback (id, order_id, nickname, rating, answers, comment)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6)
      RETURNING id, order_id, nickname, rating, answers, comment, created_at
    `,
    [id, input.orderId ?? null, input.nickname, input.rating, JSON.stringify(input.answers), input.comment ?? null],
  );
  return toFeedback(result.rows[0]);
}

