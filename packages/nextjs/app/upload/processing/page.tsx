"use client";

import React, { useEffect, useState } from "react";
import getProcessingStatus from "../../../mock/processing";
import ZeroKnowledgeProofs from "../components/ZkProof";
import { FiFile, FiLock, FiUpload } from "react-icons/fi";

interface Step {
  description: string;
  icon: JSX.Element;
}

const STEP_DESCRIPTIONS: Step[] = [
  {
    description: "Processing your file",
    icon: <FiFile className="text-2xl" />,
  },
  {
    description: "Finalizing the proof",
    icon: <FiUpload className="text-2xl" />,
  },
  {
    description: "Generating a zero-knowledge proof",
    icon: <FiLock className="text-2xl" />,
  },
];

const ProcessingSteps: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [zkProofs, setZkProofs] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [finished, setFinished] = useState<boolean>(false);

  useEffect(() => {
    const fetchProcessingStatus = async () => {
      try {
        const { step, zkProofs: mockZkProofs, loading } = getProcessingStatus();

        if (step === "processing") {
          setCurrentStep(0);
        } else if (step === "finalizing") {
          setCurrentStep(1);
        } else if (step === "generating") {
          setCurrentStep(2);
        } else if (step === "completed") {
          setZkProofs(mockZkProofs);
          setFinished(true);
        }
        setLoading(loading);
      } catch (error) {
        console.error("Error fetching processing status:", error);
      }
    };

    const interval = setInterval(fetchProcessingStatus, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center p-6">
      {loading && <span className="loading loading-ring loading-lg"></span>}
      <div className="container mx-auto p-8 text-center">
        <div className="steps w-full max-w-md">
          {STEP_DESCRIPTIONS.map((step, i) => (
            <div key={i} className={`step ${i <= currentStep ? "step-primary" : "step-secondary"} mb-4`}>
              {step.icon}
            </div>
          ))}
        </div>
        {!loading && finished && <ZeroKnowledgeProofs zkProofs={zkProofs} />}
      </div>
    </div>
  );
};

export default ProcessingSteps;
