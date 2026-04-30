/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RippleButton } from "@/components/ripple-button";
import type { Order, OrderStatus } from "@/lib/types";

const statuses: Array<OrderStatus | "all"> = ["all", "Pending", "Preparing", "Completed"];

function getStatusLabel(status: OrderStatus | "all") {
  if (status === "Completed") return "Ready";
  return status;
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [view, setView] = useState<"cards" | "table">("cards");

  const fetchOrders = useCallback(async (nextStatus: OrderStatus | "all") => {
    const query = nextStatus === "all" ? "" : `?status=${nextStatus}`;
    const response = await fetch(`/api/orders${query}`);
    const data = (await response.json()) as { orders: Order[] };
    setOrders(data.orders);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const query = status === "all" ? "" : `?status=${status}`;
      const response = await fetch(`/api/orders${query}`);
      const data = (await response.json()) as { orders: Order[] };
      if (active) {
        setOrders(data.orders);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [status]);

  useEffect(() => {
    const timer = setInterval(() => {
      void fetchOrders(status);
    }, 3000);
    return () => clearInterval(timer);
  }, [fetchOrders, status]);

  async function updateStatus(id: string, next: OrderStatus) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    void fetchOrders(status);
  }

  const groupedCount = useMemo(() => {
    return {
      pending: orders.filter((order) => order.status === "Pending").length,
      preparing: orders.filter((order) => order.status === "Preparing").length,
      completed: orders.filter((order) => order.status === "Completed").length,
    };
  }, [orders]);

  return (
    <main className="relative min-h-screen w-full overflow-hidden text-amber-50">
      <div
        className="pointer-events-none absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage: "url('/images/chc-background-new.png')",
          backgroundPosition: "right center",
          backgroundSize: "auto 100%",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(172,89,249,0.34)_0,transparent_58%)] md:bg-[radial-gradient(circle_at_top,rgba(172,89,249,0.24)_0,transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[#2d0b59]/45 md:bg-[#2d0b59]/30" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 sm:px-8">
        <img src="/images/chc-logo.png" alt="Cadbury Hot Chocolate Logo" className="h-16 w-32" />
        <h1 className="text-3xl font-bold">CHC Order Screen</h1>
        <p className="mt-2 text-amber-100/75">Realtime order queue for live experiential events.</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatCard label="Pending" value={groupedCount.pending} />
          <StatCard label="Preparing" value={groupedCount.preparing} />
          <StatCard label="Ready" value={groupedCount.completed} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {statuses.map((item) => (
            <RippleButton
              key={item}
              onClick={() => setStatus(item)}
              className={status === item ? "" : "bg-white/20 text-amber-50 shadow-none"}
            >
              {getStatusLabel(item)}
            </RippleButton>
          ))}
          <RippleButton
            className={view === "cards" ? "" : "bg-white/20 text-amber-50 shadow-none"}
            onClick={() => setView("cards")}
          >
            Card view
          </RippleButton>
          <RippleButton
            className={view === "table" ? "" : "bg-white/20 text-amber-50 shadow-none"}
            onClick={() => setView("table")}
          >
            Table view
          </RippleButton>
        </div>

        {view === "cards" ? (
          <section className="mt-6 grid gap-4 md:grid-cols-2">
            {orders.map((order) => (
              <motion.article
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-white/15 bg-white/8 p-5"
              >
                <p className="text-sm text-amber-100/70">{new Date(order.createdAt).toLocaleTimeString()}</p>
                <h3 className="mt-2 text-xl font-semibold">{order.nickname}</h3>
                <p className="mt-1 text-amber-100/85">{order.drinkName}</p>
                <p className="mt-1 text-sm text-amber-100/70">{order.selections.join(", ")}</p>
                <p className="mt-3 text-sm font-medium">Status: {getStatusLabel(order.status)}</p>
                <div className="mt-4 flex gap-2">
                  <MiniStatusButton onClick={() => updateStatus(order.id, "Pending")}>Pending</MiniStatusButton>
                  <MiniStatusButton onClick={() => updateStatus(order.id, "Preparing")}>Preparing</MiniStatusButton>
                  <MiniStatusButton onClick={() => updateStatus(order.id, "Completed")}>Ready</MiniStatusButton>
                </div>
              </motion.article>
            ))}
          </section>
        ) : (
          <section className="mt-6 overflow-x-auto rounded-2xl border border-white/20">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/10">
                <tr>
                  <th className="p-3">Nickname</th>
                  <th className="p-3">Drink</th>
                  <th className="p-3">Selections</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-white/10">
                    <td className="p-3">{order.nickname}</td>
                    <td className="p-3">{order.drinkName}</td>
                    <td className="p-3">{order.selections.join(", ")}</td>
                    <td className="p-3">{getStatusLabel(order.status)}</td>
                    <td className="p-3">
                      <select
                        value={order.status}
                        onChange={(event) => updateStatus(order.id, event.target.value as OrderStatus)}
                        className="rounded-md bg-black/30 px-2 py-1"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Completed">Ready</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-amber-100/70">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}

function MiniStatusButton({
  children,
  onClick,
}: {
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-xl border border-white/20 px-3 py-1 text-xs transition hover:bg-white/10"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
