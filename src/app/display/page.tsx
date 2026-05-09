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
      className="box-border flex min-h-dvh flex-col overflow-x-hidden bg-[#210746] text-amber-50"
      style={{
        backgroundImage: "url('/images/chc-admin-bckground.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="mx-auto flex w-full max-w-none flex-1 flex-col gap-[clamp(1rem,2.2vh,2rem)] px-[clamp(1rem,3vw,3.5rem)] py-[clamp(0.75rem,1.5vh,1.5rem)] min-[1600px]:gap-8 min-[1600px]:px-14 min-[1600px]:py-8">
        <header className="flex shrink-0 flex-wrap items-end justify-between gap-3 min-[1600px]:gap-6">
          <div>
            <h1 className="text-[clamp(1.75rem,4.2vw,4rem)] font-black leading-tight tracking-tight min-[1920px]:text-[clamp(3rem,3.2vw,4.5rem)]">
              Big Screen Display
            </h1>
          </div>
          <p className="max-w-full text-[clamp(0.8rem,1.35vw,1.125rem)] text-amber-100/80 min-[1920px]:text-lg">
            Auto-refresh every 3s
            {lastUpdatedAt ? ` · ${new Date(lastUpdatedAt).toLocaleTimeString()}` : ""}
          </p>
        </header>

        <section className="grid min-h-0 flex-1 grid-cols-1 gap-[clamp(0.85rem,1.8vh,1.5rem)] lg:grid-cols-[1.15fr_1fr] lg:grid-rows-1 min-[1600px]:gap-6">
          <div className="flex h-full min-h-[clamp(10rem,22vh,16rem)] flex-col rounded-3xl border border-amber-100/20 bg-emerald-900/30 p-[clamp(1rem,2.2vh,1.75rem)] shadow-2xl min-[1600px]:p-8">
            <p className="text-[clamp(0.85rem,1.5vw,1.15rem)] font-bold uppercase tracking-[0.22em] text-emerald-100/85 min-[1920px]:text-xl">
              Now Preparing
            </p>
            {nowPreparing ? (
              <div className="mt-3 flex flex-1 flex-col justify-center min-[1600px]:mt-4">
                <p className="text-[clamp(1.5rem,3.8vw,3.25rem)] font-black leading-tight min-[1920px]:text-6xl">
                  {orderLabel(nowPreparing)}
                </p>
                <p className="mt-2 text-[clamp(1.1rem,2.4vw,2rem)] text-emerald-50/95 min-[1600px]:mt-3 min-[1920px]:text-4xl">
                  {nowPreparing.drinkName}
                </p>
                <p className="mt-2 text-[clamp(0.95rem,1.6vw,1.35rem)] font-semibold uppercase tracking-[0.18em] text-emerald-100/80 min-[1600px]:mt-3 min-[1920px]:text-xl">
                  Wait {formatWaitTime(nowPreparing.preparationSeconds)}
                </p>
              </div>
            ) : (
              <p className="mt-4 flex flex-1 items-center text-[clamp(1.25rem,3vw,2.75rem)] font-bold leading-snug text-emerald-100/90 min-[1600px]:mt-5 min-[1920px]:text-5xl">
                No order preparing right now
              </p>
            )}
          </div>

          <div className="flex h-full min-h-[clamp(10rem,22vh,16rem)] flex-col rounded-3xl border border-amber-100/20 bg-amber-700/20 p-[clamp(1rem,2.2vh,1.75rem)] shadow-2xl min-[1600px]:p-8">
            <p className="text-[clamp(0.85rem,1.5vw,1.15rem)] font-bold uppercase tracking-[0.22em] text-amber-100/85 min-[1920px]:text-xl">
              Queue Snapshot
            </p>
            <div className="mt-3 grid min-h-0 flex-1 grid-cols-3 gap-[clamp(0.5rem,1.2vw,1rem)] min-[1600px]:mt-4">
              <MetricCard label="Pending" value={pendingOrders.length} />
              <MetricCard label="Preparing" value={preparingOrders.length} />
              <MetricCard label="Ready" value={readyOrders.length} />
            </div>
          </div>
        </section>

        <section className="grid min-h-0 flex-1 grid-cols-1 gap-[clamp(0.85rem,1.8vh,1.5rem)] lg:grid-cols-2 lg:grid-rows-1 min-[1600px]:gap-6">
          <div className="flex h-full min-h-[clamp(11rem,26vh,18rem)] flex-col rounded-3xl border border-white/20 bg-white/10 p-[clamp(1rem,2.2vh,1.75rem)] min-[1600px]:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[clamp(1rem,1.85vw,1.35rem)] font-bold uppercase tracking-[0.2em] text-amber-100/85 min-[1920px]:text-2xl">
                Next Up
              </p>
              {nextUpSlides.length > 1 ? (
                <p className="text-[clamp(0.65rem,1.1vw,0.85rem)] uppercase tracking-[0.15em] text-amber-100/70">
                  Slide {visibleNextUpSlide + 1}/{nextUpSlides.length}
                </p>
              ) : null}
            </div>
            {nextUp.length === 0 ? (
              <p className="mt-4 flex flex-1 items-center text-[clamp(1.15rem,2.8vw,2.5rem)] font-semibold text-amber-100/80 min-[1600px]:mt-5 min-[1920px]:text-5xl">
                No pending orders
              </p>
            ) : (
              <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2 min-[1600px]:mt-4">
                {nextUp.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-white/20 bg-black/20 p-[clamp(0.75rem,1.5vw,1.25rem)]"
                  >
                    <p className="text-[clamp(1.1rem,2.2vw,1.75rem)] font-extrabold min-[1920px]:text-3xl">
                      {orderLabel(order)}
                    </p>
                    <p className="mt-1 text-[clamp(1rem,1.9vw,1.35rem)] text-amber-100/90 min-[1920px]:text-2xl">
                      {order.drinkName}
                    </p>
                    <p className="mt-2 text-[clamp(0.75rem,1.2vw,1rem)] font-semibold uppercase tracking-[0.16em] text-amber-100/75 min-[1920px]:text-base">
                      Wait {formatWaitTime(order.preparationSeconds)}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {nextUpSlides.length > 1 ? (
              <div className="mt-3 flex items-center gap-2 min-[1600px]:mt-4">
                {nextUpSlides.map((_, index) => (
                  <span
                    key={`next-dot-${index}`}
                    className={`h-2.5 w-2.5 rounded-full min-[1920px]:h-3 min-[1920px]:w-3 ${index === visibleNextUpSlide ? "bg-amber-200" : "bg-amber-100/35"}`}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex h-full min-h-[clamp(11rem,26vh,18rem)] flex-col rounded-3xl border border-white/20 bg-white/10 p-[clamp(1rem,2.2vh,1.75rem)] min-[1600px]:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[clamp(1rem,1.85vw,1.35rem)] font-bold uppercase tracking-[0.2em] text-emerald-100/85 min-[1920px]:text-2xl">
                Ready To Collect
              </p>
              {readySlides.length > 1 ? (
                <p className="text-[clamp(0.65rem,1.1vw,0.85rem)] uppercase tracking-[0.15em] text-emerald-100/70">
                  Slide {visibleReadySlide + 1}/{readySlides.length}
                </p>
              ) : null}
            </div>
            {readyNow.length === 0 ? (
              <p className="mt-4 flex flex-1 items-center text-[clamp(1.15rem,2.8vw,2.5rem)] font-semibold text-emerald-100/80 min-[1600px]:mt-5 min-[1920px]:text-5xl">
                No ready orders yet
              </p>
            ) : (
              <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2 min-[1600px]:mt-4">
                {readyNow.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-emerald-100/25 bg-emerald-800/20 p-[clamp(0.75rem,1.5vw,1.25rem)]"
                  >
                    <p className="text-[clamp(1rem,2vw,1.5rem)] font-extrabold min-[1920px]:text-3xl">
                      {orderLabel(order)}
                    </p>
                    <p className="mt-1 text-[clamp(0.95rem,1.75vw,1.2rem)] text-emerald-50/90 min-[1920px]:text-2xl">
                      {order.drinkName}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {readySlides.length > 1 ? (
              <div className="mt-3 flex items-center gap-2 min-[1600px]:mt-4">
                {readySlides.map((_, index) => (
                  <span
                    key={`ready-dot-${index}`}
                    className={`h-2.5 w-2.5 rounded-full min-[1920px]:h-3 min-[1920px]:w-3 ${index === visibleReadySlide ? "bg-emerald-200" : "bg-emerald-100/35"}`}
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
    <div className="flex min-h-0 flex-col justify-center rounded-2xl border border-white/20 bg-black/20 px-[clamp(0.35rem,1vw,0.75rem)] py-[clamp(0.65rem,1.5vh,1.25rem)] min-[1600px]:py-5">
      <p className="text-[clamp(0.6rem,1.1vw,0.8rem)] uppercase tracking-[0.18em] text-amber-100/75 min-[1920px]:text-sm">
        {label}
      </p>
      <p className="mt-1 text-[clamp(1.75rem,5vw,3.5rem)] font-black tabular-nums leading-none min-[1920px]:text-6xl">
        {value}
      </p>
    </div>
  );
}
