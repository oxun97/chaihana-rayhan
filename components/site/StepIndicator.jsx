"use client";

import { Check } from "lucide-react";
import { useLang } from "@/context/LangContext";

const STEPS = ["step_cart", "step_delivery", "step_payment"];

// The 1-2-3 progress row from the brief's checkout screen.
export default function StepIndicator({ step, onStepClick }) {
  const { t } = useLang();

  return (
    <div className="flex items-start">
      {STEPS.map((key, i) => {
        const done = i < step;
        const current = i === step;
        const reachable = i <= step;

        return (
          <div key={key} className="flex flex-1 items-start">
            <div className="flex flex-1 flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => reachable && onStepClick?.(i)}
                disabled={!reachable}
                aria-current={current ? "step" : undefined}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  done
                    ? "bg-brand text-white"
                    : current
                      ? "bg-brand text-white ring-4 ring-brand/15"
                      : "border border-edge bg-card text-muted"
                } ${reachable ? "cursor-pointer" : "cursor-default"}`}
              >
                {done ? <Check size={16} /> : i + 1}
              </button>
              <span
                className={`text-center text-[0.72rem] font-medium ${
                  current ? "text-body" : "text-muted"
                }`}
              >
                {t(key)}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <span
                className={`mt-[1.1rem] h-0.5 w-full flex-1 rounded-full ${
                  i < step ? "bg-brand" : "bg-edge"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
