"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChcShell } from "@/components/chc-shell";
import { DrinkPhoto } from "@/components/drink-photo";
import { RippleButton } from "@/components/ripple-button";
import { DRINK_IMAGES } from "@/lib/drink-images";
import { CUSTOM_OPTIONS, SIGNATURE_DRINKS } from "@/lib/menu-data";
import { useOrderFlowStore } from "@/lib/order-flow-store";
import type { DrinkCategory, Order } from "@/lib/types";

type Step = "welcome" | "form" | "success" | "feedback";
type TreatChoice = "classic" | "signature" | "custom-ice-cream" | "custom-milkshake";
type CustomOption = (typeof CUSTOM_OPTIONS.IceCream)[number] | (typeof CUSTOM_OPTIONS.Milkshake)[number];

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.3 },
};

function getTreatChoiceImage(choice: TreatChoice) {
  switch (choice) {
    case "classic":
      return DRINK_IMAGES.classic;
    case "signature":
      return DRINK_IMAGES.signatureDoubleChocoCrunch;
    case "custom-ice-cream":
      return DRINK_IMAGES.customIceCream;
    default:
      return DRINK_IMAGES.customMilkshake;
  }
}

function getSignatureImage(drinkId: string) {
  switch (drinkId) {
    case "double-choco-crunch":
      return DRINK_IMAGES.signatureDoubleChocoCrunch;
    case "choco-caramel-drip":
      return DRINK_IMAGES.signatureChocoCaramelDrip;
    case "choco-coffee-kick":
      return DRINK_IMAGES.signatureChocoCoffeeKick;
    default:
      return DRINK_IMAGES.signatureChocoBerryFusion;
  }
}

function getStatusLabel(status: Order["status"]) {
  return status === "Completed" ? "Ready" : status;
}

export function OrderFlow() {
  const { nickname, setNickname, builder, setBuilder, setPlacedOrder, placedOrder, resetFlow } = useOrderFlowStore();

  const [step, setStep] = useState<Step>("welcome");
  const [draftName, setDraftName] = useState(nickname);
  const [treatChoice, setTreatChoice] = useState<TreatChoice>("classic");
  const [selectedSignatureId, setSelectedSignatureId] = useState(SIGNATURE_DRINKS[0]?.id ?? "");
  const [selectedCustomOption, setSelectedCustomOption] = useState<CustomOption>(CUSTOM_OPTIONS.IceCream[0]);
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

  const customCategory: DrinkCategory = treatChoice === "custom-milkshake" ? "Milkshake" : "IceCream";

  const currentCustomOptions = useMemo<readonly CustomOption[]>(
    () => (customCategory === "Milkshake" ? CUSTOM_OPTIONS.Milkshake : CUSTOM_OPTIONS.IceCream),
    [customCategory],
  );

  const preview = useMemo(() => {
    if (!builder) return "Choose your premium treat to preview ingredients.";
    return `${builder.drinkName}: ${builder.selections.join(" + ")}`;
  }, [builder]);

  useEffect(() => {
    if (!currentCustomOptions.includes(selectedCustomOption)) {
      setSelectedCustomOption(currentCustomOptions[0]);
    }
  }, [currentCustomOptions, selectedCustomOption]);

  useEffect(() => {
    if (treatChoice === "classic") {
      setBuilder({
        drinkType: "Classic",
        category: "IceCream",
        drinkName: "CHC Classic",
        selections: ["Classic Hot Chocolate Mix"],
      });
      return;
    }

    if (treatChoice === "signature") {
      const drink = SIGNATURE_DRINKS.find((item) => item.id === selectedSignatureId);
      if (!drink || !drink.category) return;
      setBuilder({
        drinkType: "Signature",
        category: drink.category,
        drinkName: drink.name,
        selections: drink.defaultSelections,
      });
      return;
    }

    const base = customCategory === "IceCream" ? "Chocolate Ice Cream" : "Hot Chocolate";
    setBuilder({
      drinkType: "Custom",
      category: customCategory,
      drinkName: `CHC Customized ${customCategory}`,
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
    setTreatChoice("classic");
    setSelectedSignatureId(SIGNATURE_DRINKS[0]?.id ?? "");
    setSelectedCustomOption(CUSTOM_OPTIONS.IceCream[0]);
    setHasCollectedDrink(false);
  }

  function getSummaryImage() {
    if (!builder) return DRINK_IMAGES.classic;
    if (builder.drinkType === "Classic") return DRINK_IMAGES.classic;
    if (builder.drinkType === "Custom") {
      return builder.category === "IceCream" ? DRINK_IMAGES.customIceCream : DRINK_IMAGES.customMilkshake;
    }
    const selectedSignature = SIGNATURE_DRINKS.find((drink) => drink.name === builder.drinkName);
    return getSignatureImage(selectedSignature?.id ?? "double-choco-crunch");
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
          <motion.section key="welcome" {...fade} className="flex flex-1 flex-col justify-center">
            <p className="text-amber-100/80">CHC Experience</p>
            <h1 className="mt-3 text-4xl font-bold text-amber-50 sm:text-5xl">Tell us your nickname first.</h1>
            <p className="mt-4 max-w-xl text-amber-100/75">Then you can choose your treat from image cards.</p>
            <div className="mt-8 rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl sm:p-6">
              <label className="text-sm text-amber-50">
                Nickname
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-amber-100/20 bg-black/20 px-4 py-3 text-amber-50 outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="Chocolate Legend"
                />
              </label>
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
          <motion.section key="form" {...fade} className="flex flex-1 flex-col">
            <p className="text-amber-100/80">CHC Experience</p>
            <h1 className="mt-3 text-4xl font-bold text-amber-50 sm:text-5xl">Build your treat with images.</h1>
            <p className="mt-4 max-w-2xl text-amber-100/75">
              Hi {nickname}, choose your CHC treat and customize with image cards, then place your order.
            </p>

            <div className="mt-8 grid gap-5 rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl sm:p-6">
              <div>
                <p className="text-sm text-amber-50">Choose your treat</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["classic", "CHC Classic"],
                      ["signature", "CHC Signature Treat"],
                      ["custom-ice-cream", "CHC Customized Treat - Ice Cream"],
                      ["custom-milkshake", "CHC Customized - Milkshake"],
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
                  <p className="text-sm text-amber-50">Pick a signature treat</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {SIGNATURE_DRINKS.map((item) => {
                      const selected = selectedSignatureId === item.id;
                      const image = getSignatureImage(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedSignatureId(item.id)}
                          className={`rounded-2xl border p-3 text-left transition ${
                            selected
                              ? "border-amber-300 bg-amber-200/15 ring-2 ring-amber-300/50"
                              : "border-amber-100/20 bg-black/20 hover:border-amber-200/40"
                          }`}
                        >
                          <DrinkPhoto src={image.src} alt={image.alt} />
                          <p className="mt-2 text-sm font-semibold text-amber-50">{item.name}</p>
                          <p className="text-xs text-amber-100/80">{item.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {(treatChoice === "custom-ice-cream" || treatChoice === "custom-milkshake") && (
                <div>
                  <p className="text-sm text-amber-50">Choose your add-on</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {currentCustomOptions.map((option) => {
                      const selected = selectedCustomOption === option;
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
                          <DrinkPhoto src={DRINK_IMAGES.ingredient.src} alt={DRINK_IMAGES.ingredient.alt} />
                          <p className="mt-2 text-sm font-semibold text-amber-50">{option}</p>
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
                  <p className="text-amber-100">Nickname: {draftName.trim() || "Not set yet"}</p>
                  <p className="mt-2 text-amber-100">Drink Type: {builder.drinkType}</p>
                  <p className="mt-2 text-amber-100">Category: {builder.category}</p>
                  <p className="mt-2 text-amber-100">Selection: {builder.selections.join(", ")}</p>
                  <p className="mt-2 text-sm text-amber-100/80">Preview: {preview}</p>
                </div>
                <div className="sm:justify-self-end sm:w-full sm:max-w-52">
                  <DrinkPhoto src={getSummaryImage().src} alt={getSummaryImage().alt} />
                </div>
              </div>
            )}

            <div className="mt-6">
              <RippleButton disabled={loadingOrder || !builder} onClick={placeOrder}>
                {loadingOrder ? "Pouring your treat..." : "Place Order"}
              </RippleButton>
            </div>
          </motion.section>
        )}

        {step === "success" && placedOrder && (
          <motion.section key="success" {...fade} className="flex flex-1 flex-col justify-center text-center">
            <motion.div
              initial={{ scale: 0.7, rotate: -4 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 12 }}
              className="mx-auto w-fit rounded-full bg-emerald-300/20 px-6 py-3 text-emerald-100"
            >
              Order #{placedOrder.id.slice(0, 6).toUpperCase()}
            </motion.div>
            <h2 className="mt-5 text-3xl font-bold text-amber-50">
              Preparing your {placedOrder.drinkName} for {nickname} ☕
            </h2>
            <p className="mt-3 text-amber-100/70">Our chocolatiers are crafting the perfect pour.</p>
            <p className="mt-2 text-sm text-amber-100/70">
              Status: <span className="font-semibold">{getStatusLabel(placedOrder.status)}</span>
            </p>
            <div className="mt-8 flex justify-center">
              <RippleButton
                className="bg-white/20 text-amber-50"
                disabled={placedOrder.status !== "Completed"}
                onClick={() => setHasCollectedDrink(true)}
              >
                I've taken my drink
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
