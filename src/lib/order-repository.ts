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
  preparation_seconds: number | string;
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

const toOrder = (row: OrderRow): Order => {
  const rawPreparationSeconds =
    typeof row.preparation_seconds === "number"
      ? row.preparation_seconds
      : Number.parseInt(row.preparation_seconds, 10);
  const normalizedPreparationSeconds = Number.isFinite(rawPreparationSeconds) ? rawPreparationSeconds : 120;
  const preparationSeconds = Math.max(120, Math.min(240, normalizedPreparationSeconds));

  return {
    id: row.id,
    nickname: row.nickname,
    drinkType: row.drink_type,
    category: row.category,
    drinkName: row.drink_name,
    selections: Array.isArray(row.selections) ? (row.selections as string[]) : [],
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    preparationSeconds,
  };
};

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

function withQueueRemainingTime(orders: Order[]) {
  const now = Date.now();
  const fixedPreparationSeconds = 240;
  const queuePositionById = new Map<string, number>();
  const activeOrders = orders
    .filter((order) => order.status === "Pending" || order.status === "Preparing")
    .slice()
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

  for (const [index, order] of activeOrders.entries()) {
    queuePositionById.set(order.id, index + 1);
  }

  return orders.map((order) => {
    const createdAtMs = Date.parse(order.createdAt);
    const elapsedSeconds = Number.isNaN(createdAtMs) ? 0 : Math.floor((now - createdAtMs) / 1000);
    return {
      ...order,
      preparationSeconds: order.status === "Completed" ? 0 : Math.max(0, fixedPreparationSeconds - elapsedSeconds),
      queuePosition: queuePositionById.get(order.id),
    };
  });
}

let ensureOrdersSchemaPromise: Promise<void> | null = null;

async function ensureOrdersSchema() {
  if (!ensureOrdersSchemaPromise) {
    ensureOrdersSchemaPromise = (async () => {
      await pgPool.query(`
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS preparation_seconds INT
      `);
      await pgPool.query(`
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ
      `);
      await pgPool.query(`
        DROP INDEX IF EXISTS orders_scan_session_id_idx
      `);
      await pgPool.query(`
        ALTER TABLE orders
        DROP COLUMN IF EXISTS scan_session_id
      `);
      await pgPool.query(`
        ALTER TABLE orders
        ALTER COLUMN preparation_seconds SET DEFAULT 120
      `);
      await pgPool.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'orders' AND column_name = 'preparation_minutes'
          ) THEN
            UPDATE orders
            SET preparation_seconds = GREATEST(120, LEAST(240, COALESCE(preparation_seconds, preparation_minutes * 60)))
            WHERE preparation_seconds IS NULL;
          END IF;
        END $$;
      `);
      await pgPool.query(`
        ALTER TABLE orders
        DROP COLUMN IF EXISTS preparation_minutes
      `);
      await pgPool.query(`
        UPDATE orders
        SET preparation_seconds = 120
        WHERE preparation_seconds IS NULL
      `);
      await pgPool.query(`
        ALTER TABLE orders
        ALTER COLUMN preparation_seconds SET NOT NULL
      `);
      await pgPool.query(`
        ALTER TABLE orders
        DROP CONSTRAINT IF EXISTS orders_preparation_seconds_check
      `);
      await pgPool.query(`
        ALTER TABLE orders
        ADD CONSTRAINT orders_preparation_seconds_check CHECK (preparation_seconds >= 120 AND preparation_seconds <= 240)
      `);
      await pgPool.query(`
        CREATE INDEX IF NOT EXISTS orders_archived_at_idx ON orders(archived_at)
      `);
    })();
  }
  return ensureOrdersSchemaPromise;
}

export async function fetchOrders(status?: OrderStatus | "all", scope: "active" | "archived" = "active") {
  await ensureOrdersSchema();
  const baseQuery = `
    SELECT
      id,
      nickname,
      drink_type,
      category,
      drink_name,
      selections,
      status,
      created_at,
      preparation_seconds
    FROM orders
    WHERE archived_at IS ${scope === "archived" ? "NOT NULL" : "NULL"}
  `;
  const orderedQuery = " ORDER BY created_at DESC";

  if (!status || status === "all") {
    const result = await pgPool.query<OrderRow>(baseQuery + orderedQuery);
    return withQueueRemainingTime(result.rows.map(toOrder));
  }

  const result = await pgPool.query<OrderRow>(baseQuery + " AND status = $1" + orderedQuery, [status]);
  return withQueueRemainingTime(result.rows.map(toOrder));
}

export async function createOrder(
  input: Omit<Order, "id" | "status" | "createdAt" | "preparationSeconds">,
) {
  await ensureOrdersSchema();
  const id = randomUUID();
  const result = await pgPool.query<OrderRow>(
    `
      WITH inserted AS (
        INSERT INTO orders (id, nickname, drink_type, category, drink_name, selections, status, preparation_seconds)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'Pending', 240)
        RETURNING id, nickname, drink_type, category, drink_name, selections, status, created_at, preparation_seconds
      )
      SELECT
        inserted.id,
        inserted.nickname,
        inserted.drink_type,
        inserted.category,
        inserted.drink_name,
        inserted.selections,
        inserted.status,
        inserted.created_at,
        inserted.preparation_seconds
      FROM inserted
    `,
    [id, input.nickname, input.drinkType, input.category, input.drinkName, JSON.stringify(input.selections)],
  );
  if (!result.rows[0]) {
    throw new Error("Failed to return created order row");
  }
  return toOrder(result.rows[0]);
}

export async function fetchOrderById(id: string) {
  await ensureOrdersSchema();
  const targetResult = await pgPool.query<OrderRow>(
    `
      SELECT
        id,
        nickname,
        drink_type,
        category,
        drink_name,
        selections,
        status,
        created_at,
        preparation_seconds
      FROM orders
      WHERE id = $1
        AND archived_at IS NULL
      LIMIT 1
    `,
    [id],
  );
  if (!targetResult.rows[0]) return null;

  const targetOrder = toOrder(targetResult.rows[0]);
  if (targetOrder.status === "Completed") {
    return { ...targetOrder, preparationSeconds: 0 };
  }

  const activeResult = await pgPool.query<OrderRow>(
    `
      SELECT
        id,
        nickname,
        drink_type,
        category,
        drink_name,
        selections,
        status,
        created_at,
        preparation_seconds
      FROM orders
      WHERE status IN ('Pending', 'Preparing')
        AND archived_at IS NULL
      ORDER BY created_at ASC
    `,
  );

  const queueAwareOrders = withQueueRemainingTime(activeResult.rows.map(toOrder));
  return queueAwareOrders.find((order) => order.id === id) ?? { ...targetOrder, preparationSeconds: 0 };
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await ensureOrdersSchema();
  const result = await pgPool.query<OrderRow>(
    `
      UPDATE orders
      SET status = $2
      WHERE id = $1
      RETURNING
        id,
        nickname,
        drink_type,
        category,
        drink_name,
        selections,
        status,
        created_at,
        preparation_seconds
    `,
    [id, status],
  );
  if (!result.rows[0]) return null;
  return toOrder(result.rows[0]);
}

export async function markOrdersReady(orderIds: string[]) {
  await ensureOrdersSchema();
  if (orderIds.length === 0) return [];
  const result = await pgPool.query<OrderRow>(
    `
      UPDATE orders
      SET status = 'Completed'
      WHERE id = ANY($1::uuid[])
        AND status = 'Pending'
      RETURNING
        id,
        nickname,
        drink_type,
        category,
        drink_name,
        selections,
        status,
        created_at,
        preparation_seconds
    `,
    [orderIds],
  );
  return result.rows.map(toOrder);
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

export async function archiveActiveOrders() {
  await ensureOrdersSchema();
  const result = await pgPool.query<{ id: string }>(
    `
      UPDATE orders
      SET archived_at = NOW()
      WHERE archived_at IS NULL
      RETURNING id
    `,
  );
  return result.rowCount ?? 0;
}

