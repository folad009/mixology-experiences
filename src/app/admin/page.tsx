/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PreparationCountdown } from "@/components/preparation-countdown";
import { RippleButton } from "@/components/ripple-button";
import type { Order, OrderStatus } from "@/lib/types";

const statuses: Array<OrderStatus | "all"> = [
  "all",
  "Pending",
  "Preparing",
  "Completed",
];

const PAGE_SIZE = 5;

function getStatusLabel(status: OrderStatus | "all") {
  if (status === "all") return "All";
  if (status === "Completed") return "Ready";
  return status;
}

/** One line for kitchen: treat + variant when applicable. */
function orderDescription(order: Order): string {
  if (order.drinkType === "Custom" && order.selections.length >= 2) {
    const customSelection = order.selections[1];
    const alcoholAddon = order.selections[2];
    return alcoholAddon
      ? `${order.drinkName} — ${customSelection} (${alcoholAddon})`
      : `${order.drinkName} — ${customSelection}`;
  }
  if (order.selections.length > 0) {
    return `${order.drinkName} `;
  }
  return order.drinkName;
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [page, setPage] = useState(1);
  /** 1 = forward (next), -1 = back — drives slide direction on page change. */
  const [pageSlide, setPageSlide] = useState(1);
  const reduceMotion = useReducedMotion();

  const pageTransition = useMemo(
    () =>
      reduceMotion
        ? { duration: 0.2, ease: "easeOut" as const }
        : { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.85 },
    [reduceMotion],
  );

  const tbodyVariants = useMemo(
    () => ({
      enter: (dir: number) =>
        reduceMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              x: dir * 56,
              y: 10,
              scale: 0.97,
              filter: "blur(4px)",
            },
      center: reduceMotion
        ? { opacity: 1 }
        : { opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" },
      leave: (dir: number) =>
        reduceMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              x: dir * -40,
              y: -6,
              scale: 0.98,
              filter: "blur(3px)",
            },
    }),
    [reduceMotion],
  );

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

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(orders.length / PAGE_SIZE)),
    [orders.length],
  );
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const pagedOrders = useMemo(
    () => orders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [orders, currentPage],
  );

  const rangeStart =
    orders.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd =
    orders.length === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, orders.length);

  return (
    <main className="relative min-h-screen w-full overflow-hidden text-amber-50">
      <div
        className="pointer-events-none absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage: "url('/images/chc-background-neww.png')",
          backgroundPosition: "right center",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          backgroundOrigin: "border-box",
          backgroundClip: "border-box",
          backgroundColor: "transparent",
          backgroundBlendMode: "normal",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(172,89,249,0.34)_0,transparent_58%)] md:bg-[radial-gradient(circle_at_top,rgba(172,89,249,0.24)_0,transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[#2d0b59]/45 md:bg-[#2d0b59]/30" />
      <motion.img
        src="/images/chc-image2.png"
        alt="Cadbury sachet pack"
        aria-hidden
        className="pointer-events-none absolute top-10 right-2 z-0 w-28 opacity-45 sm:w-32 md:right-6 md:top-1/6 md:w-48 md:-translate-y-1/2 md:opacity-85"
        animate={
          reduceMotion
            ? { opacity: 0.85 }
            : { y: [0, -12, 0], rotate: [0, -2, 2, 0], scale: [1, 1.02, 1] }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 5, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-6 sm:px-8">
        <img
          src="/images/cadbury-amvca-logo.png"
          alt="Cadbury Hot Chocolate Logo"
          className="h-30 w-60 mb-10 mt-10"
        />
        <h1 className="text-3xl font-bold">
          Cadbury Chocolate Treat Order Screen
        </h1>
        <p className="mt-2 text-amber-100/75">
          Realtime order queue for live experiential events
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatCard label="Pending" value={groupedCount.pending} />
          <StatCard label="Preparing" value={groupedCount.preparing} />
          <StatCard label="Ready" value={groupedCount.completed} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {statuses.map((item) => (
            <RippleButton
              key={item}
              onClick={() => {
                setStatus(item);
                setPage(1);
                setPageSlide(1);
              }}
              className={
                status === item ? "" : "bg-white/20 text-amber-50 shadow-none"
              }
            >
              {getStatusLabel(item)}
            </RippleButton>
          ))}
        </div>

        <section className="mt-6 overflow-x-auto rounded-2xl border border-white/20">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-white/10">
              <tr>
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">Order</th>
                <th className="p-3 font-semibold">Time for preparation</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Action</th>
              </tr>
            </thead>
            <AnimatePresence mode="wait" initial={false}>
              <motion.tbody
                key={`${status}-${currentPage}`}
                custom={pageSlide}
                variants={tbodyVariants}
                initial="enter"
                animate="center"
                exit="leave"
                transition={pageTransition}
                style={{ transformOrigin: "center top" }}
              >
                {pagedOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-amber-100/70"
                    >
                      No orders in this view.
                    </td>
                  </tr>
                ) : (
                  pagedOrders.map((order) => (
                    <tr key={order.id} className="border-t border-white/10">
                      <td className="p-3 align-top font-medium">
                        {order.nickname}
                      </td>
                      <td className="p-3 align-top text-amber-100/90">
                        {orderDescription(order)}
                      </td>
                      <td className="p-3 align-top tabular-nums text-amber-100/85">
                        <PreparationCountdown order={order} />
                      </td>
                      <td className="p-3 align-top">
                        {getStatusLabel(order.status)}
                      </td>
                      <td className="p-3 align-top">
                        <select
                          value={order.status}
                          onChange={(event) =>
                            updateStatus(
                              order.id,
                              event.target.value as OrderStatus,
                            )
                          }
                          className="rounded-md bg-black/30 px-2 py-1"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Completed">Ready</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </motion.tbody>
            </AnimatePresence>
          </table>
        </section>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <motion.p
            key={`range-${status}-${currentPage}`}
            className="text-sm text-amber-100/75"
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={pageTransition}
          >
            {orders.length === 0
              ? "Showing 0 orders"
              : `Showing ${rangeStart}–${rangeEnd} of ${orders.length} orders`}
          </motion.p>
          <div className="flex flex-wrap items-center gap-2">
            <RippleButton
              className="bg-white/20 text-amber-50 shadow-none"
              disabled={currentPage <= 1}
              onClick={() => {
                setPageSlide(-1);
                setPage(currentPage - 1);
              }}
            >
              Previous
            </RippleButton>
            <motion.span
              key={`page-${currentPage}`}
              className="inline-block px-2 text-sm font-medium text-amber-100/90"
              initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
            >
              Page {currentPage} of {totalPages}
            </motion.span>
            <RippleButton
              className="bg-white/20 text-amber-50 shadow-none"
              disabled={currentPage >= totalPages}
              onClick={() => {
                setPageSlide(1);
                setPage(currentPage + 1);
              }}
            >
              Next
            </RippleButton>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-amber-100/70">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}
