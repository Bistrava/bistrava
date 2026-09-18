import { describe, expect, it } from "vitest";

import {
  recommendSolutions,
  type ConfiguratorInput,
} from "@/lib/configurator/recommendation-engine";

const baseInput: ConfiguratorInput = {
  municipality: "Ljubljana",
  postalCode: "1000",
  hardnessDgh: 16,
  dwellingType: "house",
  residents: 4,
  monthlyUsageM3: null,
  bathrooms: 2,
  waterHeater: "heat_pump",
  availableSpace: "standard",
  connectionSize: null,
  installationNeed: "yes",
};

describe("recommendSolutions", () => {
  it("requests advice when hardness is unknown", () => {
    const result = recommendSolutions({ ...baseInput, hardnessDgh: null });
    expect(result.needsAdvice).toBe(true);
    expect(result.recommendations).toEqual([]);
  });

  it("returns a standard profile for a typical household", () => {
    const result = recommendSolutions(baseInput);
    expect(result.needsAdvice).toBe(false);
    expect(result.recommendations[0]?.id).toBe("standard");
    expect(result.recommendations.length).toBeLessThanOrEqual(3);
  });

  it("prioritizes high flow for larger demand", () => {
    const result = recommendSolutions({
      ...baseInput,
      residents: 7,
      bathrooms: 3,
    });
    expect(result.recommendations[0]?.id).toBe("high-flow");
  });

  it("does not recommend central softening for a low reading", () => {
    const result = recommendSolutions({ ...baseInput, hardnessDgh: 5 });
    expect(result.needsAdvice).toBe(true);
  });
});
