/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Order } from "@/lib/types";

const SLIDE_SIZE = 6;
const SLIDE_INTERVAL_MS = 10000;

function orderLabel(order: Order) {
  return `#${order.id.slice(0, 6).toUpperCase()} - ${order.nickname}`;
}

function formatWaitTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function chunkOrders(items: Order[], size: number) {
  if (items.length === 0) return [];
  const chunks: Order[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export default function DisplayPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [nextUpSlide, setNextUpSlide] = useState(0);
  const [readySlide, setReadySlide] = useState(0);

  const fetchOrders = useCallback(async () => {
    const response = await fetch("/api/orders");
    if (!response.ok) return;
    const data = (await response.json()) as { orders: Order[] };
    setOrders(data.orders);
    setLastUpdatedAt(new Date().toISOString());
  }, []);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      void fetchOrders();
    }, 0);
    const timer = setInterval(() => {
      void fetchOrders();
    }, 3000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, [fetchOrders]);

  const preparingOrders = useMemo(
    () => orders.filter((order) => order.status === "Preparing"),
    [orders],
  );
  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "Pending"),
    [orders],
  );
  const readyOrders = useMemo(
    () => orders.filter((order) => order.status === "Completed"),
    [orders],
  );

  const nowPreparing = preparingOrders[0] ?? null;
  const nextUpSlides = useMemo(() => chunkOrders(pendingOrders, SLIDE_SIZE), [pendingOrders]);
  const readySlides = useMemo(() => chunkOrders(readyOrders, SLIDE_SIZE), [readyOrders]);
  const visibleNextUpSlide = nextUpSlides.length === 0 ? 0 : nextUpSlide % nextUpSlides.length;
  const visibleReadySlide = readySlides.length === 0 ? 0 : readySlide % readySlides.length;
  const nextUp = nextUpSlides[visibleNextUpSlide] ?? [];
  const readyNow = readySlides[visibleReadySlide] ?? [];

  useEffect(() => {
    if (nextUpSlides.length <= 1) return;
    const timer = setInterval(() => {
      setNextUpSlide((previous) => (previous + 1) % nextUpSlides.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [nextUpSlides.length]);

  useEffect(() => {
    if (readySlides.length <= 1) return;
    const timer = setInterval(() => {
      setReadySlide((previous) => (previous + 1) % readySlides.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [readySlides.length]);

  return (
    <main 
      className="min-h-screen bg-[#210746] px-8 py-8 text-amber-50 lg:px-12"
      style={{
        backgroundImage: "url('/images/chc-admin-bckground.png')",
        backgroundSize: "cover",
      }}
    >
      
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="mt-2 text-5xl font-black leading-tight lg:text-6xl">Big Screen Display</h1>
          </div>
          <p className="text-sm text-amber-100/75">
            Auto-refresh every 3s
            {lastUpdatedAt ? ` - Updated ${new Date(lastUpdatedAt).toLocaleTimeString()}` : ""}
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-amber-100/20 bg-emerald-900/30 p-6 shadow-2xl">
            <p className="text-lg font-bold uppercase tracking-[0.25em] text-emerald-100/80">Now Preparing</p>
            {nowPreparing ? (
              <div className="mt-4">
                <p className="text-4xl font-black lg:text-5xl">{orderLabel(nowPreparing)}</p>
                <p className="mt-3 text-2xl text-emerald-50/95 lg:text-3xl">{nowPreparing.drinkName}</p>
                <p className="mt-3 text-lg font-semibold uppercase tracking-[0.2em] text-emerald-100/80">
                  Wait {formatWaitTime(nowPreparing.preparationSeconds)}
                </p>
              </div>
            ) : (
              <p className="mt-5 text-3xl font-bold text-emerald-100/90">No order preparing right now</p>
            )}
          </div>

          <div className="rounded-3xl border border-amber-100/20 bg-amber-700/20 p-6 shadow-2xl">
            <p className="text-lg font-bold uppercase tracking-[0.25em] text-amber-100/85">Queue Snapshot</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <MetricCard label="Pending" value={pendingOrders.length} />
              <MetricCard label="Preparing" value={preparingOrders.length} />
              <MetricCard label="Ready" value={readyOrders.length} />
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/20 bg-white/10 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xl font-bold uppercase tracking-[0.22em] text-amber-100/85">Next Up</p>
              {nextUpSlides.length > 1 ? (
                <p className="text-xs uppercase tracking-[0.15em] text-amber-100/70">
                  Slide {visibleNextUpSlide + 1}/{nextUpSlides.length}
                </p>
              ) : null}
            </div>
            {nextUp.length === 0 ? (
              <p className="mt-5 text-3xl font-semibold text-amber-100/80">No pending orders</p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {nextUp.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-white/20 bg-black/20 p-4">
                    <p className="text-2xl font-extrabold">{orderLabel(order)}</p>
                    <p className="mt-1 text-xl text-amber-100/90">{order.drinkName}</p>
                    <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-amber-100/75">
                      Wait {formatWaitTime(order.preparationSeconds)}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {nextUpSlides.length > 1 ? (
              <div className="mt-4 flex items-center gap-2">
                {nextUpSlides.map((_, index) => (
                  <span
                    key={`next-dot-${index}`}
                    className={`h-2.5 w-2.5 rounded-full ${index === visibleNextUpSlide ? "bg-amber-200" : "bg-amber-100/35"}`}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/10 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xl font-bold uppercase tracking-[0.22em] text-emerald-100/85">Ready To Collect</p>
              {readySlides.length > 1 ? (
                <p className="text-xs uppercase tracking-[0.15em] text-emerald-100/70">
                  Slide {visibleReadySlide + 1}/{readySlides.length}
                </p>
              ) : null}
            </div>
            {readyNow.length === 0 ? (
              <p className="mt-5 text-3xl font-semibold text-emerald-100/80">No ready orders yet</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {readyNow.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-emerald-100/25 bg-emerald-800/20 p-4">
                    <p className="text-xl font-extrabold">{orderLabel(order)}</p>
                    <p className="mt-1 text-lg text-emerald-50/90">{order.drinkName}</p>
                  </div>
                ))}
              </div>
            )}
            {readySlides.length > 1 ? (
              <div className="mt-4 flex items-center gap-2">
                {readySlides.map((_, index) => (
                  <span
                    key={`ready-dot-${index}`}
                    className={`h-2.5 w-2.5 rounded-full ${index === visibleReadySlide ? "bg-emerald-200" : "bg-emerald-100/35"}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-black/20 px-3 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-amber-100/75">{label}</p>
      <p className="mt-1 text-4xl font-black">{value}</p>
    </div>
  );
}
