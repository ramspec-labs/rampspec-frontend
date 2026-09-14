export type Role = "owner" | "admin" | "operator" | "viewer";
export type Session = { userId: string; displayName: string; email: string; expiresAt: string; roles: Role[] };

export function isSessionValid(session: Session | null, now = new Date()): boolean { return Boolean(session && new Date(session.expiresAt).getTime() > now.getTime()); }
export function sessionFromPayload(payload: unknown): Session | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Partial<Session>;
  if (typeof value.userId !== "string" || typeof value.displayName !== "string" || typeof value.email !== "string" || typeof value.expiresAt !== "string" || !Array.isArray(value.roles)) return null;
  return { userId: value.userId, displayName: value.displayName, email: value.email, expiresAt: value.expiresAt, roles: value.roles.filter((role): role is Role => ["owner", "admin", "operator", "viewer"].includes(role as string)) };
}
