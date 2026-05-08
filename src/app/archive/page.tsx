"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RippleButton } from "@/components/ripple-button";
import type { Order } from "@/lib/types";

const PAGE_SIZE = 10;

function getStatusLabel(status: Order["status"]) {
  return status === "Completed" ? "Ready" : status;
}

export default function ArchivePage() {
  const [archivedOrders, setArchivedOrders] = useState<Order[]>([]);
  const [archiving, setArchiving] = useState(false);
  const [page, setPage] = useState(1);

  const fetchArchivedOrders = useCallback(async () => {
    const response = await fetch("/api/orders?scope=archived");
    const data = (await response.json()) as { orders: Order[] };
    setArchivedOrders(data.orders);
  }, []);

  useEffect(() => {
    void fetchArchivedOrders();
  }, [fetchArchivedOrders]);

  async function archiveActiveOrders() {
    setArchiving(true);
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });
      setPage(1);
      void fetchArchivedOrders();
    } finally {
      setArchiving(false);
    }
  }

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(archivedOrders.length / PAGE_SIZE)),
    [archivedOrders.length],
  );
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pagedOrders = useMemo(
    () => archivedOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [archivedOrders, currentPage],
  );

  return (
    <main className="min-h-screen bg-[#2d0b59] px-4 py-8 text-amber-50 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Archive Screen</h1>
          <div className="flex flex-wrap gap-2">
            <a
              href="/admin"
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border-[3px] border-amber-100/90 bg-white/20 px-6 py-3 font-sans text-sm font-bold uppercase tracking-[0.08em] text-amber-50 transition hover:bg-white/30"
            >
              Back to admin
            </a>
            <RippleButton
              onClick={archiveActiveOrders}
              disabled={archiving}
              className="bg-rose-700/80 text-rose-50 hover:bg-rose-700"
            >
              {archiving ? "Archiving..." : "Archive current active orders"}
            </RippleButton>
          </div>
        </div>

        <p className="mb-4 text-amber-100/80">
          Only this screen can archive/reset the live queue. Admin screen stays active-only.
        </p>

        <section className="overflow-x-auto rounded-2xl border border-white/20">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-white/10">
              <tr>
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">Order</th>
                <th className="p-3 font-semibold">Status at archive</th>
                <th className="p-3 font-semibold">Created at</th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-amber-100/70">
                    No archived orders yet.
                  </td>
                </tr>
              ) : (
                pagedOrders.map((order) => (
                  <tr key={order.id} className="border-t border-white/10">
                    <td className="p-3">{order.nickname}</td>
                    <td className="p-3">{order.drinkName}</td>
                    <td className="p-3">{getStatusLabel(order.status)}</td>
                    <td className="p-3">{new Date(order.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <div className="mt-4 flex items-center justify-between text-sm text-amber-100/80">
          <span>
            Showing {pagedOrders.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, archivedOrders.length)} of {archivedOrders.length}
          </span>
          <div className="flex items-center gap-2">
            <RippleButton
              className="bg-white/20 text-amber-50 shadow-none"
              disabled={currentPage <= 1}
              onClick={() => setPage((previous) => previous - 1)}
            >
              Previous
            </RippleButton>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <RippleButton
              className="bg-white/20 text-amber-50 shadow-none"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((previous) => previous + 1)}
            >
              Next
            </RippleButton>
          </div>
        </div>
      </div>
    </main>
  );
}
