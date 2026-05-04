/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
"use client";

import clsx from "clsx";
import { Bangers } from "next/font/google";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChcShell } from "@/components/chc-shell";
import { DrinkPhoto } from "@/components/drink-photo";
import { PreparationCountdown } from "@/components/preparation-countdown";
import { RippleButton } from "@/components/ripple-button";
import { DRINK_IMAGES } from "@/lib/drink-images";
import { CUSTOM_OPTIONS, SIGNATURE_DRINKS, TREAT_NAMES } from "@/lib/menu-data";
import { useOrderFlowStore } from "@/lib/order-flow-store";
import type { DrinkCategory, Order } from "@/lib/types";

type Step = "welcome" | "form" | "success" | "feedback";
type TreatChoice = "signature" | "custom-milkshake";
type CustomOption = (typeof CUSTOM_OPTIONS.Milkshake)[number];

const bangers = Bangers({
  weight: "400",
  subsets: ["latin"],
});

function ComicPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "rounded-[1.35rem] border-[3px] border-dashed border-amber-100/55 bg-white/[0.07] p-5 shadow-[6px_6px_0_rgba(12,0,32,0.55)] backdrop-blur-xl sm:rounded-[1.65rem] sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ComicBadge({ children }: { children: ReactNode }) {
  return (
    <span className="mb-2 mx-auto inline-block -rotate-1 rounded-md border-2 border-amber-950/35 bg-[#ffe566] px-2.5 py-0.5 text-[0.62rem] font-black uppercase tracking-[0.14em] text-[#3a0858] shadow-[2px_2px_0_rgba(0,0,0,0.22)]">
      {children}
    </span>
  );
}

function ComicHeroGreeting({
  nickname,
  variant = "order",
}: {
  nickname: string;
  variant?: "order" | "feedback";
}) {
  const isFeedback = variant === "feedback";
  return (
    <div className="relative mx-auto mt-2 max-w-xl px-1">
      <div className="relative z-10">
        <div
          className={clsx(
            bangers.className,
            "relative rounded-[1.75rem] border-[3px] border-[#1a0528] bg-[#fff9e6] px-5 py-4 text-center text-2xl leading-tight tracking-wide text-[#4a0b6e] shadow-[8px_8px_0_rgba(0,0,0,0.38)] sm:px-7 sm:py-5 sm:text-4xl",
          )}
          style={{ textShadow: "2px 2px 0 rgba(250,204,21,0.35)" }}
        >
          <span className="text-[#db2777]" aria-hidden>
            ★{" "}
          </span>
          {isFeedback ? `You crushed it, ${nickname}!` : `Hi ${nickname}!`}
          <span className="text-[#db2777]" aria-hidden>
            {" "}
            ★
          </span>
          <span className="mt-2 block font-sans text-sm font-semibold normal-case tracking-normal text-[#5b2175] sm:text-base">
            {isFeedback
              ? "One more scene: rate the CHC experience so we can brag in the next issue"
              : "Choose your Cadbury chocolate treat"}
          </span>
        </div>
        <svg
          className="absolute -bottom-[10px] left-[14%] z-20 h-[14px] w-12 text-[#fff9e6] drop-shadow-[2px_3px_0_#1a0528]"
          viewBox="0 0 48 16"
          aria-hidden
        >
          <path
            fill="currentColor"
            stroke="#1a0528"
            strokeWidth="3"
            strokeLinejoin="round"
            d="M4 0h40L24 14z"
          />
        </svg>
      </div>
    </div>
  );
}

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.3 },
};

function getTreatChoiceImage(choice: TreatChoice) {
  switch (choice) {
    case "signature":
      return DRINK_IMAGES.signatureTreat;
    default:
      return DRINK_IMAGES.customMilkshake;
  }
}

function getSignatureImage(drinkId: string) {
  switch (drinkId) {
    case "cadbury-gelato-choco-chips":
      return DRINK_IMAGES.signatureDoubleChocoCrunch;
    case "cadbury-gelato-brownies":
      return DRINK_IMAGES.signatureChocoCaramelDrip;
    case "alcohol-infusion":
      return DRINK_IMAGES.signatureChocoCoffeeKick;
    default:
      return DRINK_IMAGES.signatureChocoBerryFusion;
  }
}

function getCustomOptionImage(option: string) {
  switch (option) {
    case "Cadbury Chocolate + Caramel Milkshake":
      return DRINK_IMAGES.ingredient;
    case "Cadbury Chocolate + Expresso Milkshake":
      return DRINK_IMAGES.expresso;
    case "Cadbury Chocolate Milkshake":
      return DRINK_IMAGES.milkshake;
    case "Alcohol Infusion":
      return DRINK_IMAGES.alcoholInfusion;
    default:
      return DRINK_IMAGES.ingredient;
  }
}

function getStatusLabel(status: Order["status"]) {
  return status === "Completed" ? "Ready" : status;
}

export function OrderFlow() {
  const { nickname, setNickname, builder, setBuilder, setPlacedOrder, placedOrder, resetFlow } = useOrderFlowStore();

  const [step, setStep] = useState<Step>("welcome");
  const [draftName, setDraftName] = useState(nickname);
  const [treatChoice, setTreatChoice] = useState<TreatChoice | null>(null);
  const [selectedSignatureId, setSelectedSignatureId] = useState(SIGNATURE_DRINKS[0]?.id ?? "");
  const [selectedCustomOption, setSelectedCustomOption] = useState<CustomOption>(CUSTOM_OPTIONS.Milkshake[0]);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [rating, setRating] = useState(5);
  const [taste, setTaste] = useState(5);
  const [presentation, setPresentation] = useState(5);
  const [experience, setExperience] = useState(5);
  const [comment, setComment] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [showReadyToast, setShowReadyToast] = useState(false);
  const [hasCollectedDrink, setHasCollectedDrink] = useState(false);
  const readyToastShownRef = useRef(false);
  const reduceMotion = useReducedMotion();

  const customCategory: DrinkCategory = "Milkshake";

  const currentCustomOptions = useMemo<readonly CustomOption[]>(
    () => CUSTOM_OPTIONS.Milkshake,
    [],
  );

  const drinkTypeLabel = useMemo(() => {
    if (!builder) return "";
    if (builder.drinkType === "Signature") return TREAT_NAMES.signatureGelato;
    if (builder.drinkType === "Custom") return TREAT_NAMES.signatureMilkshake;
    return builder.drinkType;
  }, [builder]);

  const selectionLabel = useMemo(() => {
    if (!builder) return "";
    if (builder.drinkType === "Custom") return builder.selections[1] ?? builder.drinkName;
    return builder.drinkName;
  }, [builder]);

  useEffect(() => {
    setSelectedCustomOption((prev) => 
      currentCustomOptions.includes(prev) ? prev : currentCustomOptions[0]
    );
  }, [currentCustomOptions]);

  useEffect(() => {
    if (!treatChoice) {
      setBuilder(null);
      return;
    }

    if (treatChoice === "signature") {
      const drink = SIGNATURE_DRINKS.find((item) => item.id === selectedSignatureId);
      if (!drink) return;
      setBuilder({
        drinkType: "Signature",
        category: drink.category,
        drinkName: drink.name,
        selections: drink.defaultSelections,
      });
      return;
    }

    const base = "Hot Chocolate";
    setBuilder({
      drinkType: "Custom",
      category: customCategory,
      drinkName: TREAT_NAMES.signatureMilkshake,
      selections: [base, selectedCustomOption],
    });
  }, [customCategory, selectedCustomOption, selectedSignatureId, setBuilder, treatChoice]);

  async function placeOrder() {
    if (!builder || !nickname) return;
    setLoadingOrder(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, ...builder }),
      });

      const raw = await response.text();
      if (!response.ok) {
        throw new Error(raw || "Order request failed");
      }
      if (!raw) {
        throw new Error("Empty response from order API");
      }

      const data = JSON.parse(raw) as { order: Order };
      setPlacedOrder(data.order);
      setStep("success");
    } catch (error) {
      console.error("Failed to place order", error);
    } finally {
      setLoadingOrder(false);
    }
  }

  async function submitFeedback() {
    if (!placedOrder) return;
    setSendingFeedback(true);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: placedOrder.id,
        nickname,
        rating,
        answers: { taste, presentation, experience },
        comment,
      }),
    });
    setSendingFeedback(false);
    resetFlow();
    setStep("welcome");
    setDraftName("");
    setComment("");
    setTreatChoice(null);
    setSelectedSignatureId(SIGNATURE_DRINKS[0]?.id ?? "");
    setSelectedCustomOption(CUSTOM_OPTIONS.Milkshake[0]);
    setHasCollectedDrink(false);
  }

  function getSummaryImage() {
    if (!builder) return DRINK_IMAGES.signatureDoubleChocoCrunch;
    if (builder.drinkType === "Custom") {
      const selectedOption = builder.selections[1] ?? "";
      return getCustomOptionImage(selectedOption);
    }
    const selectedSignature = SIGNATURE_DRINKS.find((drink) => drink.name === builder.drinkName);
    return getSignatureImage(selectedSignature?.id ?? "cadbury-gelato-choco-chips");
  }

  useEffect(() => {
    if (!placedOrder?.id) return;

    readyToastShownRef.current = false;

    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/orders/${placedOrder.id}`);
        if (!response.ok) return;
        const data = (await response.json()) as { order: Order };
        setPlacedOrder(data.order);
        if (data.order.status === "Completed") {
          if (!readyToastShownRef.current) {
            setShowReadyToast(true);
            readyToastShownRef.current = true;
          }
          clearInterval(timer);
        }
      } catch (error) {
        console.error("Failed to check order status", error);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [placedOrder?.id, setPlacedOrder]);

  return (
    <ChcShell>
      <motion.img
        src="/images/chc-image2.png"
        alt="Cadbury sachet pack"
        aria-hidden
        className="pointer-events-none absolute bottom-6 left-1/2 z-0 w-32 -translate-x-1/2 sm:bottom-1 sm:w-36 sm:opacity-50 md:fixed md:bottom-auto md:left-auto md:right-0 md:top-1/2 md:w-80 md:translate-x-0 md:-translate-y-1/2 md:opacity-85 xl:right-4"
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
      <AnimatePresence>
        {showReadyToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed bottom-6 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-[1.25rem] border-[3px] border-emerald-950/40 bg-[#ecfdf5]/95 px-4 py-3 text-[#064e3b] shadow-[6px_6px_0_rgba(6,60,40,0.45)] backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <ComicBadge>Plot resolved</ComicBadge>
                <p className={clsx(bangers.className, "mt-1 text-2xl tracking-wide text-emerald-900")}>
                  Your drink is ready!
                </p>
                <p className="mt-1 font-sans text-sm text-emerald-800/90">
                  Zoom to the CHC counter and claim your victory sip.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReadyToast(false)}
                className="shrink-0 rounded-lg border-2 border-emerald-900/30 bg-emerald-100/50 px-2 py-1 font-sans text-xs font-bold text-emerald-900 hover:bg-emerald-100"
              >
                Got it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.section key="welcome" {...fade} className="flex flex-1 flex-col items-center justify-center">
            <img src="/images/cadbury-amvca-logo.png" alt="Cadbury Logo" className="mx-auto h-16 w-[200px]" />
            <h1
              className={clsx(
                bangers.className,
                "mt-3 text-center text-4xl tracking-wide text-amber-50 sm:text-6xl",
              )}
            >
              Choose your treat!
            </h1>

            <ComicPanel className="mt-8 w-full max-w-xl text-left">
              <label className="mt-1 block">
                <span className={clsx(bangers.className, "text-xl tracking-wide text-amber-50")}>Name</span>
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border-[3px] border-amber-950/30 bg-black/25 px-4 py-3 text-base text-amber-50 outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="Chocolate Legend"
                />
              </label>
              <p className="mt-4 max-w-xl font-sans text-sm text-amber-100/80">
                Click to see image cards
              </p>
              <RippleButton
                className="mt-5 border-[3px] border-amber-100/90 font-sans"
                disabled={!draftName.trim()}
                onClick={() => {
                  setNickname(draftName.trim());
                  setStep("form");
                }}
              >
                Continue
              </RippleButton>
            </ComicPanel>
          </motion.section>
        )}

        {step === "form" && (
          <motion.section key="form" {...fade} className="relative flex flex-1 flex-col pt-10 sm:pt-14">
            <div className="pointer-events-none absolute -right-4 top-24 hidden text-5xl opacity-[0.12] sm:block" aria-hidden>
              ✦
            </div>
            <div className="pointer-events-none absolute left-0 top-40 text-3xl opacity-15" aria-hidden>
              ✧
            </div>

            <img
              src="/images/cadbury-amvca-logo.png"
              alt="Cadbury Hot Chocolate Logo"
              className="mx-auto block h-16 w-[200px]"
            />
            <ComicHeroGreeting nickname={nickname} />

            <ComicPanel className="mt-10 grid gap-6">
              <div>
                <ComicBadge>Episode 1</ComicBadge>
                <p className={clsx(bangers.className, "text-xl tracking-wide text-amber-50 sm:text-2xl")}>
                  Pick your treat style
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["signature", TREAT_NAMES.signatureGelato],
                      ["custom-milkshake", TREAT_NAMES.signatureMilkshake],
                    ] as const
                  ).map(([choice, label]) => {
                    const selected = treatChoice === choice;
                    const image = getTreatChoiceImage(choice);
                    return (
                      <motion.button
                        key={choice}
                        type="button"
                        onClick={() => setTreatChoice(choice)}
                        whileHover={reduceMotion ? undefined : { scale: 1.02, rotate: selected ? -0.5 : 0.5 }}
                        whileTap={{ scale: 0.98 }}
                        className={clsx(
                          "rounded-2xl border-[3px] p-3 text-left transition",
                          selected
                            ? "border-amber-950/80 bg-amber-100/15 shadow-[5px_5px_0_rgba(0,0,0,0.4)] ring-0 sm:-rotate-1"
                            : "border-dashed border-amber-100/35 bg-black/20 hover:border-amber-200/60 hover:bg-black/30",
                        )}
                      >
                        <DrinkPhoto src={image.src} alt={image.alt} />
                        <p className={clsx(bangers.className, "mt-2 text-lg tracking-wide text-amber-50")}>{label}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {treatChoice === "signature" && (
                <div>
                  <ComicBadge>Plot twist</ComicBadge>
                  <p className={clsx(bangers.className, "text-xl tracking-wide text-amber-50 sm:text-2xl")}>
                    Pick a signature gelato treat
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {SIGNATURE_DRINKS.map((item) => {
                      const selected = selectedSignatureId === item.id;
                      const image = getSignatureImage(item.id);
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedSignatureId(item.id)}
                          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={clsx(
                            "rounded-xl border-[3px] p-2.5 text-center transition",
                            selected
                              ? "border-amber-950/80 bg-amber-100/15 shadow-[5px_5px_0_rgba(0,0,0,0.4)] sm:rotate-1"
                              : "border-dashed border-amber-100/35 bg-black/20 hover:border-amber-200/60",
                          )}
                        >
                          <DrinkPhoto src={image.src} alt={image.alt} />
                          <p className="mt-2 font-sans text-sm font-semibold text-amber-50">{item.name}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {treatChoice === "custom-milkshake" && (
                <div>
                  <ComicBadge>Milkshake mode</ComicBadge>
                  <p className={clsx(bangers.className, "text-xl tracking-wide text-amber-50 sm:text-2xl")}>
                    Pick a signature milkshake treat
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {currentCustomOptions.map((option) => {
                      const selected = selectedCustomOption === option;
                      const image = getCustomOptionImage(option);
                      return (
                        <motion.button
                          key={option}
                          type="button"
                          onClick={() => setSelectedCustomOption(option)}
                          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={clsx(
                            "rounded-2xl border-[3px] p-3 text-left transition",
                            selected
                              ? "border-amber-950/80 bg-amber-100/15 shadow-[5px_5px_0_rgba(0,0,0,0.4)] sm:-rotate-1"
                              : "border-dashed border-amber-100/35 bg-black/20 hover:border-amber-200/60",
                          )}
                        >
                          <DrinkPhoto src={image.src} alt={image.alt} />
                          <p className="mt-2 font-sans text-xs font-semibold capitalize text-amber-50">{option}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </ComicPanel>

            {builder && (
              <ComicPanel className="mt-6 grid gap-4 border-[3px] border-solid border-amber-200/40 sm:grid-cols-[1.4fr_1fr] sm:items-center">
                <div>
                  <ComicBadge>Your order</ComicBadge>
                  <p className="mt-1 font-sans text-amber-100">
                    <span className="font-black text-amber-200">Name:</span> {draftName.trim() || "Not set yet"}
                  </p>
                  <p className="mt-2 font-sans text-amber-100">
                    <span className="font-black text-amber-200">Order:</span> {drinkTypeLabel}
                  </p>
                  <p className="mt-2 font-sans text-amber-100">
                    <span className="font-black text-amber-200">Add-on:</span> {selectionLabel}
                  </p>
                </div>
                <div className="relative sm:justify-self-end sm:w-full sm:max-w-52">
                  <div
                    className="pointer-events-none absolute -right-1 -top-2 rotate-12 font-sans text-[0.65rem] font-black uppercase tracking-widest text-[#ffe566]"
                    aria-hidden
                  >
                    Slurp!
                  </div>
                  <DrinkPhoto src={getSummaryImage().src} alt={getSummaryImage().alt} />
                </div>
              </ComicPanel>
            )}

            <div className="mt-8 flex flex-col items-center gap-2">
              <p className={clsx(bangers.className, "text-center text-xl tracking-wide text-amber-200 sm:text-2xl")}>
                {loadingOrder ? "Pouring magic…" : "Ready? Bam — send it!"}
              </p>
              <RippleButton
                className="min-w-[200px] border-[3px] border-amber-100/90 font-sans text-lg"
                disabled={loadingOrder || !builder}
                onClick={placeOrder}
              >
                {loadingOrder ? "Pouring your treat..." : "Submit order"}
              </RippleButton>
            </div>
          </motion.section>
        )}

        {step === "success" && placedOrder && (
          <motion.section
            key="success"
            {...fade}
            className="relative flex flex-1 flex-col justify-center pb-6 text-center sm:pb-10"
          >
            <div className="pointer-events-none absolute right-2 top-8 text-4xl opacity-15" aria-hidden>
              ★
            </div>
            <img
              src="/images/cadbury-amvca-logo.png"
              alt="Cadbury Hot Chocolate Logo"
              className="mx-auto mb-8 block h-16 w-[200px]"
            />

            <motion.div
              initial={{ scale: 0.7, rotate: -4 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 12 }}
              className="mx-auto w-full max-w-md px-1 text-center"
            >
              <ComicPanel className="flex flex-col items-center border-solid border-emerald-300/45 bg-emerald-500/10 text-center shadow-[6px_6px_0_rgba(6,40,30,0.5)]">
                <ComicBadge>Transmission received</ComicBadge>
                <p className={clsx(bangers.className, "mt-1 text-3xl tracking-wide text-emerald-50 sm:text-4xl")}>
                  Order #{placedOrder.id.slice(0, 6).toUpperCase()}
                </p>
              </ComicPanel>
            </motion.div>

            <h2
              className={clsx(
                bangers.className,
                "mx-auto mt-8 max-w-xl px-2 text-2xl leading-snug tracking-wide text-amber-50 sm:text-4xl",
              )}
            >
              Preparing {placedOrder.drinkName} for {nickname}{" "}
              <motion.span
                aria-hidden
                className="inline-block origin-bottom"
                animate={
                  reduceMotion
                    ? { opacity: 1 }
                    : { y: [0, -7, 0], rotate: [0, -6, 6, 0], scale: [1, 1.08, 1] }
                }
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                }
              >
                ☕
              </motion.span>
            </h2>

            <ComicPanel className="mx-auto mt-5 flex max-w-md flex-col items-center text-center">
              <ComicBadge>Status bubble</ComicBadge>
              <p className="mt-1 font-sans text-amber-100">
                <span className="font-black text-amber-200">Status:</span>{" "}
                <span className="font-semibold">{getStatusLabel(placedOrder.status)}</span>
              </p>
            </ComicPanel>

            {placedOrder.status !== "Completed" && (
              <ComicPanel
                className="mx-auto mt-5 flex max-w-md flex-col items-center text-center sm:max-w-lg"
                aria-live="polite"
              >
                <ComicBadge>Tick-tock</ComicBadge>
                <p className={clsx(bangers.className, "mt-1 text-lg tracking-wide text-amber-50")}>Preparation countdown</p>
                <p className={clsx(bangers.className, "mt-3 text-5xl tabular-nums tracking-tight text-amber-50")}>
                  <PreparationCountdown order={placedOrder} />
                </p>
              </ComicPanel>
            )}

            {placedOrder.status === "Completed" && (
              <p className={clsx(bangers.className, "mx-auto mt-4 max-w-md text-xl tracking-wide text-emerald-200")}>
                Boom — ready to collect!
              </p>
            )}

            <div className="mt-8 flex flex-col items-center gap-2">
              <RippleButton
                className="border-[3px] border-amber-100/90 font-sans"
                disabled={placedOrder.status !== "Completed"}
                onClick={() => setHasCollectedDrink(true)}
              >
                I&apos;ve got my cup 
              </RippleButton>
              <RippleButton
                className="border-[3px] border-amber-100/90 font-sans"
                disabled={placedOrder.status !== "Completed" || !hasCollectedDrink}
                onClick={() => setStep("feedback")}
              >
                Drop the review
              </RippleButton>
            </div>
          </motion.section>
        )}

        {step === "feedback" && (
          <motion.section key="feedback" {...fade} className="relative flex flex-1 flex-col pt-6 sm:pt-10">
            <div className="pointer-events-none absolute left-3 top-24 text-3xl opacity-15" aria-hidden>
              ✦
            </div>
            <img
              src="/images/cadbury-amvca-logo.png"
              alt="Cadbury Hot Chocolate Logo"
              className="mx-auto mb-8 block h-16 w-[200px]"
            />

            <ComicHeroGreeting nickname={nickname} variant="feedback" />

            <ComicPanel className="mt-10">
              <ComicBadge>Final panel</ComicBadge>
              <h2 className={clsx(bangers.className, "mt-1 text-3xl tracking-wide text-amber-50 sm:text-4xl")}>
                Rate the adventure
              </h2>
              <p className="mt-2 font-sans text-sm text-amber-100/80">
                Sliders from 1 (meh) to 5 (chef&apos;s kiss). Spill the cocoa beans below.
              </p>
              <Range
                title="Overall rating"
                value={rating}
                onChange={setRating}
                titleClassName={clsx(bangers.className, "text-lg tracking-wide")}
              />
              <Range
                title="Taste"
                value={taste}
                onChange={setTaste}
                titleClassName={clsx(bangers.className, "text-lg tracking-wide")}
              />
              <Range
                title="Presentation"
                value={presentation}
                onChange={setPresentation}
                titleClassName={clsx(bangers.className, "text-lg tracking-wide")}
              />
              <Range
                title="Experience"
                value={experience}
                onChange={setExperience}
                titleClassName={clsx(bangers.className, "text-lg tracking-wide")}
              />
              <label className="mt-4 block text-left">
                <span className={clsx(bangers.className, "text-lg tracking-wide text-amber-50")}>Bonus speech bubble</span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  className="mt-2 min-h-24 w-full rounded-2xl border-[3px] border-amber-950/30 bg-black/25 px-4 py-3 font-sans text-amber-50 outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="Any extra sweetness to share?"
                />
              </label>
            </ComicPanel>
            <div className="mt-6 flex flex-col items-center gap-2">
              <p className={clsx(bangers.className, "text-center text-lg tracking-wide text-amber-200")}>
                {sendingFeedback ? "Beaming it up…" : "Launch when you&apos;re ready!"}
              </p>
              <RippleButton
                className="w-full border-[3px] border-amber-100/90 font-sans sm:w-fit"
                disabled={sendingFeedback}
                onClick={submitFeedback}
              >
                {sendingFeedback ? "Submitting..." : "Send feedback — zoom!"}
              </RippleButton>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </ChcShell>
  );
}

function Range({
  title,
  value,
  onChange,
  titleClassName,
}: {
  title: string;
  value: number;
  onChange: (value: number) => void;
  titleClassName?: string;
}) {
  return (
    <label className="mt-3 flex items-center justify-between gap-4 text-sm text-amber-50">
      <span className={titleClassName}>{title}</span>
      <input
        type="number"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isNaN(next)) return;
          onChange(Math.max(1, Math.min(5, next)));
        }}
        className="w-20 rounded-xl border-[3px] border-amber-950/25 bg-black/25 px-3 py-2 text-center font-sans font-semibold text-amber-50 outline-none focus:ring-2 focus:ring-amber-300"
      />
    </label>
  );
}
