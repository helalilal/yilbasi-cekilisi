import { describe, expect, it } from "vitest";
import { drawAssignments, DrawImpossibleError, type Pair } from "./draw";

const people = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

function check(ids: string[], exclusions: Pair[], result: Map<string, string>) {
  expect(result.size).toBe(ids.length);
  expect(new Set(result.values()).size).toBe(ids.length);
  for (const [giver, receiver] of result) {
    expect(giver).not.toBe(receiver);
    expect(ids).toContain(receiver);
    for (const [a, b] of exclusions) {
      expect([giver, receiver].sort()).not.toEqual([a, b].sort());
    }
  }
}

describe("drawAssignments", () => {
  it("produces a valid derangement for many sizes", () => {
    for (let n = 2; n <= 50; n++) {
      for (let k = 0; k < 20; k++) {
        const ids = people(n);
        check(ids, [], drawAssignments(ids));
      }
    }
  });

  it("respects exclusions in both directions", () => {
    const ids = people(6);
    const ex: Pair[] = [["p0", "p1"], ["p2", "p3"], ["p4", "p5"]];
    for (let k = 0; k < 200; k++) check(ids, ex, drawAssignments(ids, ex));
  });

  it("is random (not always the same result)", () => {
    const ids = people(5);
    const seen = new Set<string>();
    for (let k = 0; k < 100; k++) seen.add(JSON.stringify([...drawAssignments(ids)].sort()));
    expect(seen.size).toBeGreaterThan(5);
  });

  it("throws when impossible", () => {
    expect(() => drawAssignments(["a"])).toThrow(DrawImpossibleError);
    // "a" is excluded from everyone else
    expect(() => drawAssignments(["a", "b", "c"], [["a", "b"], ["a", "c"]])).toThrow(DrawImpossibleError);
  });
});
