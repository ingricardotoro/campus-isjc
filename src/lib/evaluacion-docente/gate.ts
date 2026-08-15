import { NextRequest } from "next/server";

export const GATE_COOKIE = "eval_gate";

export function hasGateAccess(request: NextRequest): boolean {
  return request.cookies.get(GATE_COOKIE)?.value === "1";
}
