import { describe, it, expect, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import axe from "axe-core";
import Legend from "../components/Legend";
import ErrorBoundary from "../components/ErrorBoundary";

function Bomb() {
  throw new Error("Test");
}

async function checkA11y(container) {
  const results = await axe.run(container);
  return results;
}

describe("Accessibility audit", () => {
  afterEach(() => cleanup());

  it("Legend has no critical violations", async () => {
    const { container } = render(<Legend />);
    const results = await checkA11y(container);
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toHaveLength(0);
  });

  it("ErrorBoundary error state has no critical violations", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    const results = await checkA11y(container);
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toHaveLength(0);
    consoleSpy.mockRestore();
  });
});
