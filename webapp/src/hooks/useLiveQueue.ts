import { useState, useEffect } from "react";

export function useLiveQueue(hospitalId?: string, doctorId?: string, initialQueuePos: number = 1) {
  const [patientsAhead, setPatientsAhead] = useState(Math.max(0, initialQueuePos - 1));
  const [estimatedWaitMins, setEstimatedWaitMins] = useState(patientsAhead * 12 + 10);
  const [currentServingToken, setCurrentServingToken] = useState("A-001");

  useEffect(() => {
    setPatientsAhead(Math.max(0, initialQueuePos - 1));
    setEstimatedWaitMins(Math.max(0, initialQueuePos - 1) * 12 + 10);

    // Dynamic queue position polling / calculation
    const interval = setInterval(() => {
      setPatientsAhead((prev) => {
        if (prev <= 1) return prev;
        const next = prev - 1;
        setEstimatedWaitMins(next * 12 + 5);
        return next;
      });
    }, 45000);

    return () => clearInterval(interval);
  }, [hospitalId, doctorId, initialQueuePos]);

  return {
    patientsAhead,
    estimatedWaitMins,
    currentServingToken,
  };
}
