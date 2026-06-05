import type { IdJagClaims } from "./verify.js";
import {
  type User,
  createUser,
  findDelegation,
  findUserByEmail,
  findUserByPhone,
  upsertDelegation,
  users,
} from "./store.js";

export type MatchResult = {
  user: User;
  match: "delegation" | "email" | "phone" | "jit";
};

export function matchOrProvision(claims: IdJagClaims): MatchResult {
  const { iss, sub } = claims;

  const existingDelegation = findDelegation(iss, sub);
  if (existingDelegation) {
    const user = users.get(existingDelegation.user_id);
    if (user) {
      upsertDelegation(iss, sub, user.id);
      return { user, match: "delegation" };
    }
  }

  if (claims.email && claims.email_verified) {
    const byEmail = findUserByEmail(claims.email);
    if (byEmail) {
      upsertDelegation(iss, sub, byEmail.id);
      return { user: byEmail, match: "email" };
    }
  }

  if (claims.phone_number && claims.phone_number_verified) {
    const byPhone = findUserByPhone(claims.phone_number);
    if (byPhone) {
      upsertDelegation(iss, sub, byPhone.id);
      return { user: byPhone, match: "phone" };
    }
  }

  const user = createUser({
    email: claims.email ?? `agent+${sub}@jit.local`,
    email_verified: Boolean(claims.email_verified),
    phone_number: claims.phone_number,
    phone_number_verified: claims.phone_number_verified,
    name: claims.name,
  });
  upsertDelegation(iss, sub, user.id);
  return { user, match: "jit" };
}
