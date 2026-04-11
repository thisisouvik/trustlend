import { redirect } from "next/navigation";
import {
  getDashboardPath,
  normalizeUserRole,
  type UserRole,
} from "@/lib/auth/roles";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function requireAuthenticatedUser(expectedRole?: UserRole) {
  const supabase = await getServerSupabaseClient();

  if (!supabase) {
    redirect("/auth");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const role = normalizeUserRole(user.user_metadata?.account_type);

  if (expectedRole && role !== expectedRole) {
    redirect(getDashboardPath(role));
  }

  return { user, role };
}

function parseAllowedAdminEmails(): Set<string> {
  const value = process.env.TRADE_VAULT_ADMIN_EMAILS;
  if (!value) {
    return new Set();
  }

  return new Set(
    value
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

function hasTradeVaultAdminClaim(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }) {
  const appMeta = user.app_metadata ?? {};
  const userMeta = user.user_metadata ?? {};

  const company = (userMeta.company ?? appMeta.company ?? userMeta.org ?? appMeta.org) as string | undefined;
  const isAdminFlag = (userMeta.is_trade_vault_admin ?? appMeta.is_trade_vault_admin) as boolean | undefined;

  return isAdminFlag === true || company === "trade_vault" || company === "tradevault";
}

export function isTradeVaultAdminUser(user: {
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}) {
  const allowedAdmins = parseAllowedAdminEmails();
  const email = user.email?.toLowerCase() ?? "";

  return allowedAdmins.has(email) || hasTradeVaultAdminClaim(user);
}

export async function requireTradeVaultAdmin() {
  const { user, role } = await requireAuthenticatedUser();

  if (!isTradeVaultAdminUser(user)) {
    redirect(getDashboardPath(normalizeUserRole(role)));
  }

  return { user, role };
}