import { SeedAnalysisResult } from "../types";

export const analyzeSeedImage = async (base64Image: string): Promise<SeedAnalysisResult> => {
  const response = await fetch("/api/analyze-seed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server xatosi: ${response.status}`);
  }

  const result = await response.json();
  return result as SeedAnalysisResult;
};
