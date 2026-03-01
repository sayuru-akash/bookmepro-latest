// components/ProgressBar.js
import React from "react";

const steps = ["Register", "Payment Gateway", "Login"];

const ProgressBar = ({ currentStep }) => {
  return (
    <div className="mt-20 flex justify-center gap-10">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        return (
          <div key={step} className="flex flex-col items-center mb-10">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white 
                ${isCompleted ? "bg-green-500" : isActive ? "bg-blue-500" : "bg-gray-300"}`}
            >
              {stepNumber}
            </div>
            <span className="mt-2 text-sm font-medium">{step}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressBar;