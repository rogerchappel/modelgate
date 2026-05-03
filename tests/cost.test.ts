import test from "node:test";
import assert from "node:assert/strict";
import { estimateModelUsd, roundUsd } from "../src/index.js";

test("roundUsd keeps four decimal places", () => {
  assert.equal(roundUsd(1.23456), 1.2346);
});

test("estimateModelUsd combines input and output token prices", () => {
  const model = { id: "m", provider: "p", cost: { inputPerMillion: 0.4, outputPerMillion: 1.6 } };
  assert.equal(estimateModelUsd(model, 1_000_000, 250_000), 0.8);
});
