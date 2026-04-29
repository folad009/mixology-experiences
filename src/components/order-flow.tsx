"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChcShell } from "@/components/chc-shell";
import { DrinkCard } from "@/components/drink-card";
import { DrinkPhoto } from "@/components/drink-photo";
import { RippleButton } from "@/components/ripple-button";
import { DRINK_IMAGES } from "@/lib/drink-images";
import { CUSTOM_OPTIONS, SIGNATURE_DRINKS } from "@/lib/menu-data";
import { useOrderFlowStore } from "@/lib/order-flow-store";
import type { DrinkCategory, Order } from "@/lib/types";

type Step = "welcome" | "drink" | "customize" | "summary" | "success" | "feedback";
const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.3 },
};

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

export function OrderFlow() {
  const { nickname, setNickname, builder, setBuilder, setPlacedOrder, placedOrder, resetFlow } = useOrderFlowStore();

  const [step, setStep] = useState<Step>("welcome");
  const [draftName, setDraftName] = useState("");
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [rating, setRating] = useState(5);
  const [taste, setTaste] = useState(5);
  const [presentation, setPresentation] = useState(5);
  const [experience, setExperience] = useState(5);
  const [comment, setComment] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [showReadyToast, setShowReadyToast] = useState(false);
  const readyToastShownRef = useRef(false);

  const preview = useMemo(() => {
    if (!builder) return "Choose your premium treat to preview ingredients.";
    return `${builder.drinkName}: ${builder.selections.join(" + ")}`;
  }, [builder]);

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
  }

  function setClassic() {
    setBuilder({
      drinkType: "Classic",
      category: "IceCream",
      drinkName: "CHC Classic",
      selections: ["Classic Hot Chocolate Mix"],
    });
    setStep("summary");
  }

  function setSignature(id: string) {
    const drink = SIGNATURE_DRINKS.find((item) => item.id === id);
    if (!drink || !drink.category) return;
    setBuilder({
      drinkType: "Signature",
      category: drink.category,
      drinkName: drink.name,
      selections: drink.defaultSelections,
    });
    setStep("summary");
  }

  function setCustomBase(category: DrinkCategory) {
    const base = category === "IceCream" ? "Chocolate Ice Cream" : "Hot Chocolate";
    setBuilder({
      drinkType: "Custom",
      category,
      drinkName: `CHC Customized ${category}`,
      selections: [base],
    });
    setStep("customize");
  }

  function toggleSelection(item: string) {
    if (!builder) return;
    const exists = builder.selections.includes(item);
    const nextSelections = exists
      ? builder.selections.filter((selection) => selection !== item)
      : [...builder.selections, item];
    setBuilder({ ...builder, selections: nextSelections });
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
            <h1 className="mt-3 text-4xl font-bold text-amber-50 sm:text-5xl">Pour your chocolate story.</h1>
            <p className="mt-4 max-w-xl text-amber-100/75">
              Enter your nickname and craft a luxury drink with playful, immersive interactions.
            </p>
            <div className="mt-8 rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl sm:p-6">
              <label className="block text-sm text-amber-50">Enter your nickname</label>
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                className="mt-3 w-full rounded-2xl border border-amber-100/20 bg-black/20 px-4 py-3 text-amber-50 outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="Chocolate Legend"
              />
              <RippleButton
                className="mt-4 w-full"
                disabled={!draftName.trim()}
                onClick={() => {
                  setNickname(draftName.trim());
                  setStep("drink");
                }}
              >
                Start Your Treat
              </RippleButton>
            </div>
          </motion.section>
        )}

        {step === "drink" && (
          <motion.section key="drink" {...fade} className="flex flex-1 flex-col">
            <h2 className="text-3xl font-bold text-amber-50">Hi {nickname}, pick your vibe</h2>
            <p className="mt-2 text-amber-100/75">Choose Classic, Signature, or build your own masterpiece.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <DrinkCard
                title="CHC Classic"
                description="The regular cup. Smooth and timeless."
                visual={<DrinkPhoto src={DRINK_IMAGES.classic.src} alt={DRINK_IMAGES.classic.alt} />}
                onClick={setClassic}
              />
              <DrinkCard
                title="CHC Signature Treat"
                description="Curated premium combinations across ice cream and milkshake."
                visual={
                  <DrinkPhoto
                    src={DRINK_IMAGES.signatureDoubleChocoCrunch.src}
                    alt={DRINK_IMAGES.signatureDoubleChocoCrunch.alt}
                  />
                }
                onClick={() => setStep("customize")}
              />
              <DrinkCard
                title="CHC Customized Treat - Ice Cream"
                description="Base ice cream with multi-select toppings."
                visual={<DrinkPhoto src={DRINK_IMAGES.customIceCream.src} alt={DRINK_IMAGES.customIceCream.alt} />}
                onClick={() => setCustomBase("IceCream")}
              />
              <DrinkCard
                title="CHC Customized Treat - Milkshake"
                description="Hot chocolate base with crafted add-ons."
                visual={<DrinkPhoto src={DRINK_IMAGES.customMilkshake.src} alt={DRINK_IMAGES.customMilkshake.alt} />}
                onClick={() => setCustomBase("Milkshake")}
              />
            </div>
            <div className="mt-5 flex gap-3">
              <RippleButton className="bg-white/20 text-amber-50" onClick={() => setStep("welcome")}>
                Back
              </RippleButton>
            </div>
          </motion.section>
        )}

        {step === "customize" && (
          <motion.section key="customize" {...fade} className="flex flex-1 flex-col">
            <h2 className="text-3xl font-bold text-amber-50">Customize your treat</h2>
            <p className="mt-2 text-amber-100/75">Tap ingredients to toggle and watch your live preview evolve.</p>
            {!builder && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <DrinkCard
                  title="Signature Ice Creams"
                  description="Double Choco Crunch, Choco Caramel Drip"
                  visual={
                    <DrinkPhoto
                      src={DRINK_IMAGES.signatureChocoCaramelDrip.src}
                      alt={DRINK_IMAGES.signatureChocoCaramelDrip.alt}
                    />
                  }
                  onClick={() => setSignature("double-choco-crunch")}
                />
                <DrinkCard
                  title="Signature Milkshakes"
                  description="Choco Coffee Kick, Choco Berry Fusion"
                  visual={
                    <DrinkPhoto
                      src={DRINK_IMAGES.signatureChocoBerryFusion.src}
                      alt={DRINK_IMAGES.signatureChocoBerryFusion.alt}
                    />
                  }
                  onClick={() => setSignature("choco-coffee-kick")}
                />
                {SIGNATURE_DRINKS.map((item) => (
                  <DrinkCard
                    key={item.id}
                    title={item.name}
                    description={item.description}
                    visual={<DrinkPhoto src={getSignatureImage(item.id).src} alt={getSignatureImage(item.id).alt} />}
                    onClick={() => setSignature(item.id)}
                  />
                ))}
              </div>
            )}
            {builder && (
              <>
                <div className="mt-6 rounded-3xl border border-white/20 bg-white/10 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-amber-100/70">Live Preview</p>
                  <p className="mt-2 text-amber-50">{preview}</p>
                </div>
                {builder.drinkType === "Custom" && (
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {CUSTOM_OPTIONS[builder.category].map((option) => (
                      <DrinkCard
                        key={option}
                        title={option}
                        description="Tap to add or remove"
                        visual={<DrinkPhoto src={DRINK_IMAGES.ingredient.src} alt={DRINK_IMAGES.ingredient.alt} />}
                        selected={builder.selections.includes(option)}
                        onClick={() => toggleSelection(option)}
                      />
                    ))}
                  </div>
                )}
                <div className="mt-5 flex gap-3">
                  <RippleButton onClick={() => setStep("summary")}>Continue to Summary</RippleButton>
                  <RippleButton className="bg-white/20 text-amber-50" onClick={() => setStep("drink")}>
                    Back
                  </RippleButton>
                </div>
              </>
            )}
          </motion.section>
        )}

        {step === "summary" && builder && (
          <motion.section key="summary" {...fade} className="flex flex-1 flex-col">
            <h2 className="text-3xl font-bold text-amber-50">Order Summary</h2>
            <div className="mt-6 grid gap-4 rounded-3xl border border-white/20 bg-white/10 p-5 sm:grid-cols-[1.4fr_1fr] sm:items-center">
              <div>
                <p className="text-amber-100">Nickname: {nickname}</p>
                <p className="mt-2 text-amber-100">Drink Type: {builder.drinkType}</p>
                <p className="mt-2 text-amber-100">Category: {builder.category}</p>
                <p className="mt-2 text-amber-100">Selection: {builder.selections.join(", ")}</p>
              </div>
              <div className="sm:justify-self-end sm:w-full sm:max-w-52">
                <DrinkPhoto src={getSummaryImage().src} alt={getSummaryImage().alt} />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <RippleButton disabled={loadingOrder} onClick={placeOrder}>
                {loadingOrder ? "Pouring your treat..." : "Place Order"}
              </RippleButton>
              <RippleButton className="bg-white/20 text-amber-50" onClick={() => setStep("customize")}>
                Edit
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
            <h2 className="mt-5 text-4xl font-bold text-amber-50">Preparing your drink for {nickname} ☕</h2>
            <p className="mt-3 text-amber-100/70">Our chocolatiers are crafting the perfect pour.</p>
            <div className="mt-8 flex justify-center">
              <RippleButton onClick={() => setStep("feedback")}>Leave Feedback</RippleButton>
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
    <label className="mt-3 block text-sm text-amber-50">
      {title}: <span className="font-semibold">{value}</span>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-amber-300"
      />
    </label>
  );
}
