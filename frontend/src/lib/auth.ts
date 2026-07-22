export type DemoUser = {
  name: string;
  email: string;
};

type StoredAccount = DemoUser & {
  passwordHash: string;
};

type StoredAccounts = Record<string, StoredAccount>;

const LEGACY_ACCOUNT_KEY = "resume_screener_account";
const ACCOUNTS_KEY = "resume_screener_accounts";
const SESSION_KEY = "resume_screener_session";

export const AUTH_EVENT =
  "resume-screener-auth-change";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function hashPassword(
  password: string,
): Promise<string> {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    bytes,
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) =>
      byte.toString(16).padStart(2, "0"),
    )
    .join("");
}

function notify(): void {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function readAccounts(): StoredAccounts {
  const stored =
    window.localStorage.getItem(ACCOUNTS_KEY);

  let accounts: StoredAccounts = {};

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as unknown;

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        accounts = parsed as StoredAccounts;
      }
    } catch {
      window.localStorage.removeItem(ACCOUNTS_KEY);
    }
  }

  const legacy =
    window.localStorage.getItem(
      LEGACY_ACCOUNT_KEY,
    );

  if (legacy) {
    try {
      const account = JSON.parse(
        legacy,
      ) as StoredAccount;
      const email = normalizeEmail(
        account.email ?? "",
      );

      if (
        email &&
        account.name &&
        account.passwordHash &&
        !accounts[email]
      ) {
        accounts[email] = {
          ...account,
          email,
        };
        window.localStorage.setItem(
          ACCOUNTS_KEY,
          JSON.stringify(accounts),
        );
      }
    } catch {
      // Invalid legacy data is ignored.
    } finally {
      window.localStorage.removeItem(
        LEGACY_ACCOUNT_KEY,
      );
    }
  }

  return accounts;
}

function writeAccounts(
  accounts: StoredAccounts,
): void {
  window.localStorage.setItem(
    ACCOUNTS_KEY,
    JSON.stringify(accounts),
  );
}

export function getCurrentUser(): DemoUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value =
    window.localStorage.getItem(SESSION_KEY);

  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as DemoUser;
    const email = normalizeEmail(
      parsed.email ?? "",
    );
    const name = parsed.name?.trim();

    if (!email || !name) {
      throw new Error("Invalid session.");
    }

    return {
      name,
      email,
    };
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export async function createAccount(
  name: string,
  email: string,
  password: string,
): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = name.trim();

  if (!normalizedEmail || !normalizedName) {
    throw new Error(
      "Name and email are required.",
    );
  }

  const accounts = readAccounts();

  if (accounts[normalizedEmail]) {
    throw new Error(
      "An account with this email already exists in this browser.",
    );
  }

  const account: StoredAccount = {
    name: normalizedName,
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
  };

  accounts[normalizedEmail] = account;
  writeAccounts(accounts);

  window.localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      name: account.name,
      email: account.email,
    }),
  );

  notify();
}

export async function signIn(
  email: string,
  password: string,
): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const accounts = readAccounts();
  const account = accounts[normalizedEmail];

  if (!account) {
    throw new Error(
      "No account with this email exists in this browser.",
    );
  }

  const suppliedHash = await hashPassword(password);

  if (suppliedHash !== account.passwordHash) {
    throw new Error(
      "The email or password is incorrect.",
    );
  }

  window.localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      name: account.name,
      email: account.email,
    }),
  );

  notify();
}

export function signOut(): void {
  window.localStorage.removeItem(SESSION_KEY);
  notify();
}
