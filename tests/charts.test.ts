import assert from "node:assert/strict";
import test from "node:test";
import { cashFlowChartInitialDimension } from "../src/components/charts/cash-flow-chart";
import { categoryChartInitialDimension } from "../src/components/charts/category-chart";

test("chart responsive containers start with positive dimensions", () => {
  for (const dimension of [cashFlowChartInitialDimension, categoryChartInitialDimension]) {
    assert.ok(dimension.width > 0);
    assert.ok(dimension.height > 0);
  }
});
