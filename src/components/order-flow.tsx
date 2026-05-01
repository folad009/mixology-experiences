/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChcShell } from "@/components/chc-shell";
import { DrinkPhoto } from "@/components/drink-photo";
import { RippleButton } from "@/components/ripple-button";
import { DRINK_IMAGES } from "@/lib/drink-images";
import { CUSTOM_OPTIONS, SIGNATURE_DRINKS, TREAT_NAMES } from "@/lib/menu-data";
import { useOrderFlowStore } from "@/lib/order-flow-store";
import type { DrinkCategory, Order } from "@/lib/types";

type Step = "welcome" | "form" | "success" | "feedback";
type TreatChoice = "signature" | "custom-milkshake";
type CustomOption = (typeof CUSTOM_OPTIONS.Milkshake)[number];

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
    if (readyToastShownRef.current) return;

    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/orders/${placedOrder.id}`);
        if (!response.ok) return;
        const data = (await response.json()) as { order: Order };
        if (data.order.status === "Completed") {
          setPlacedOrder(data.order);
          setShowReadyToast(true);
          readyToastShownRef.current = true;
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
            className="fixed bottom-6 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-2xl border border-emerald-200/30 bg-emerald-500/20 px-4 py-3 text-emerald-50 backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">Your drink is ready!</p>
                <p className="text-sm text-emerald-100/90">Please collect your treat at the CHC counter.</p>
              </div>
              <button
                onClick={() => setShowReadyToast(false)}
                className="rounded-md border border-emerald-100/30 px-2 py-1 text-xs hover:bg-emerald-100/10"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.section key="welcome" {...fade} className="flex flex-1 flex-col items-center justify-center">
            <img src="/images/cadbury-amvca-logo.png" alt="Cadbury Logo" className="mx-auto h-16 w-[200px]" />
            <h1 className="mt-3 text-center text-4xl font-bold text-amber-50 sm:text-5xl capitalize">Choose your treat</h1>

            <div className="mt-8 w-full max-w-xl rounded-3xl border border-white/20 bg-white/10 p-5 text-left backdrop-blur-xl sm:p-6">
              <label className="text-sm text-amber-50">
                Name
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-amber-100/20 bg-black/20 px-4 py-3 text-amber-50 outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="Chocolate Legend"
                />
              </label>
              <p className="mt-4 max-w-xl text-amber-100/75">Click to see image cards</p>
              <RippleButton
                className="mt-4"
                disabled={!draftName.trim()}
                onClick={() => {
                  setNickname(draftName.trim());
                  setStep("form");
                }}
              >
                Continue
              </RippleButton>
            </div>
          </motion.section>
        )}

        {step === "form" && (
          <motion.section key="form" {...fade} className="flex flex-1 flex-col mt-16">
            <img src="/images/cadbury-amvca-logo.png" alt="Cadbury Hot Chocolate Logo" className="h-16 w-[200px]" />
            <p className="mt-4 max-w-4xl text-amber-100/75 capitalize">
              Hi {nickname}, choose your Cadbury Chocolate treat
            </p>

            <div className="mt-8 grid gap-5 rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl sm:p-6">
              <div>
                
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
                      <button
                        key={choice}
                        type="button"
                        onClick={() => setTreatChoice(choice)}
                        className={`rounded-2xl border p-3 text-left transition ${
                          selected
                            ? "border-amber-300 bg-amber-200/15 ring-2 ring-amber-300/50"
                            : "border-amber-100/20 bg-black/20 hover:border-amber-200/40"
                        }`}
                      >
                        <DrinkPhoto src={image.src} alt={image.alt} />
                        <p className="mt-2 text-sm font-semibold text-amber-50">{label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {treatChoice === "signature" && (
                <div>
                  <p className="text-sm text-amber-50">Pick a signature gelato treat</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {SIGNATURE_DRINKS.map((item) => {
                      const selected = selectedSignatureId === item.id;
                      const image = getSignatureImage(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedSignatureId(item.id)}
                          className={`rounded-xl border p-2.5 text-center transition ${
                            selected
                              ? "border-amber-300 bg-amber-200/15 ring-2 ring-amber-300/50"
                              : "border-amber-100/20 bg-black/20 hover:border-amber-200/40"
                          }`}
                        >
                          <DrinkPhoto src={image.src} alt={image.alt} />
                          <p className="mt-2 text-sm font-semibold text-amber-50">{item.name}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {treatChoice === "custom-milkshake" && (
                <div>
                  <p className="text-sm text-amber-50">Pick a signature milkshake treat below</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {currentCustomOptions.map((option) => {
                      const selected = selectedCustomOption === option;
                      const image = getCustomOptionImage(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSelectedCustomOption(option)}
                          className={`rounded-2xl border p-3 text-left transition ${
                            selected
                              ? "border-amber-300 bg-amber-200/15 ring-2 ring-amber-300/50"
                              : "border-amber-100/20 bg-black/20 hover:border-amber-200/40"
                          }`}
                        >
                          <DrinkPhoto src={image.src} alt={image.alt} />
                          <p className="mt-2 text-xs capitalize font-semibold text-amber-50">{option}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {builder && (
              <div className="mt-6 grid gap-4 rounded-3xl border border-white/20 bg-white/10 p-5 sm:grid-cols-[1.4fr_1fr] sm:items-center">
                <div>
                  <p className="text-amber-100">Name: {draftName.trim() || "Not set yet"}</p>
                  <p className="mt-2 text-amber-100">Order: {drinkTypeLabel}</p>
                  <p className="mt-2 text-amber-100">Add-on Topping: {selectionLabel}</p>
                 
                </div>
                <div className="sm:justify-self-end sm:w-full sm:max-w-52">
                  <DrinkPhoto src={getSummaryImage().src} alt={getSummaryImage().alt} />
                </div>
              </div>
            )}

            <div className="mt-6">
              <RippleButton disabled={loadingOrder || !builder} onClick={placeOrder}>
                {loadingOrder ? "Pouring your treat..." : "Submit Order"}
              </RippleButton>
            </div>
          </motion.section>
        )}

        {step === "success" && placedOrder && (
          <motion.section key="success" {...fade} className="flex flex-1 flex-col justify-center text-center">
            <img src="/images/cadbury-amvca-logo.png" alt="Cadbury Hot Chocolate Logo" className="mx-auto h-16 w-[200px] mb-10" />
            <motion.div
              initial={{ scale: 0.7, rotate: -4 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 12 }}
              className="mx-auto w-fit rounded-full bg-emerald-300/20 px-6 py-3 text-emerald-100"
            >
              Order #{placedOrder.id.slice(0, 6).toUpperCase()}
            </motion.div>
            <h2 className="mt-5 text-xl sm:text-3xl font-bold text-amber-50">
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
            
            <p className="mt-2 text-sm text-amber-100/70">
              Status: <span className="font-semibold">{getStatusLabel(placedOrder.status)}</span>
            </p>
            <div className="mt-8 flex justify-center">
              <RippleButton
                className="bg-white/20 text-amber-50"
                disabled={placedOrder.status !== "Completed"}
                onClick={() => setHasCollectedDrink(true)}
              >
                I have taken my drink
              </RippleButton>
            </div>
            <div className="mt-3 flex justify-center">
              <RippleButton
                disabled={placedOrder.status !== "Completed" || !hasCollectedDrink}
                onClick={() => setStep("feedback")}
              >
                Leave Feedback
              </RippleButton>
            </div>
          </motion.section>
        )}

        {step === "feedback" && (
          <motion.section key="feedback" {...fade} className="flex flex-1 flex-col">
            <img src="/images/cadbury-amvca-logo.png" alt="Cadbury Hot Chocolate Logo" className="mx-auto h-16 w-[200px] mb-10" />

            <h2 className="text-3xl font-bold text-amber-50">Rate your CHC experience</h2>
            <div className="mt-6 rounded-3xl border border-white/20 bg-white/10 p-5">
              <Range title="Overall rating" value={rating} onChange={setRating} />
              <Range title="Taste" value={taste} onChange={setTaste} />
              <Range title="Presentation" value={presentation} onChange={setPresentation} />
              <Range title="Experience" value={experience} onChange={setExperience} />
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                className="mt-4 min-h-24 w-full rounded-2xl border border-amber-100/20 bg-black/20 px-4 py-3 text-amber-50 outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="Any extra sweetness to share?"
              />
            </div>
            <RippleButton className="mt-6 w-full sm:w-fit" disabled={sendingFeedback} onClick={submitFeedback}>
              {sendingFeedback ? "Submitting..." : "Submit Feedback"}
            </RippleButton>
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
}: {
  title: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="mt-3 flex items-center justify-between gap-4 text-sm text-amber-50">
      <span>{title}</span>
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
        className="w-20 rounded-xl border border-amber-100/20 bg-black/20 px-3 py-2 text-center text-amber-50 outline-none focus:ring-2 focus:ring-amber-300"
      />
    </label>
  );
}
