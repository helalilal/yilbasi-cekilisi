import { randomInt } from "node:crypto";

export type Pair = [string, string];

export class DrawImpossibleError extends Error {
  constructor() {
    super("No valid assignment exists for these participants and exclusions");
  }
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Returns a map giver -> receiver where nobody draws themselves and
 * excluded pairs (in either direction) never draw each other.
 * Randomised backtracking: always finds a solution if one exists.
 */
export function drawAssignments(ids: string[], exclusions: Pair[] = []): Map<string, string> {
  if (ids.length < 2) throw new DrawImpossibleError();

  const blocked = new Map<string, Set<string>>();
  for (const id of ids) blocked.set(id, new Set([id]));
  for (const [a, b] of exclusions) {
    blocked.get(a)?.add(b);
    blocked.get(b)?.add(a);
  }

  // Most-constrained givers first keeps the search shallow.
  const givers = shuffle(ids).sort((x, y) => blocked.get(y)!.size - blocked.get(x)!.size);
  const taken = new Set<string>();
  const result = new Map<string, string>();

  const solve = (i: number): boolean => {
    if (i === givers.length) return true;
    const giver = givers[i];
    for (const receiver of shuffle(ids)) {
      if (taken.has(receiver) || blocked.get(giver)!.has(receiver)) continue;
      taken.add(receiver);
      result.set(giver, receiver);
      if (solve(i + 1)) return true;
      taken.delete(receiver);
      result.delete(giver);
    }
    return false;
  };

  if (!solve(0)) throw new DrawImpossibleError();
  return result;
}
