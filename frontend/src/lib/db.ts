import { getCurrentUser } from "@/lib/auth";
import {
  HistoryRecord,
  ResumeDraft,
  UserProfile,
} from "@/lib/types";

const DB_NAME = "career-canvas";
const DB_VERSION = 3;
const HISTORY_STORE = "history";
const PROFILE_STORE = "profile";
const DRAFT_STORE = "drafts";

export const PROFILE_EVENT =
  "career-canvas-profile-change";

type StoredHistoryRecord = HistoryRecord & {
  ownerEmail: string;
};

type StoredProfileRecord = {
  id: string;
  ownerEmail: string;
  profile: UserProfile;
};

type StoredDraftRecord = {
  id: string;
  ownerEmail: string;
  draft: ResumeDraft;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function currentOwnerEmail(): string | null {
  const user = getCurrentUser();

  return user
    ? normalizeEmail(user.email)
    : null;
}

function requireOwnerEmail(): string {
  const email = currentOwnerEmail();

  if (!email) {
    throw new Error(
      "You must be logged in to access private user data.",
    );
  }

  return email;
}

function profileKey(email: string): string {
  return `profile:${email}`;
}

function draftKey(email: string): string {
  return `draft:${email}`;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION,
    );

    request.onupgradeneeded = () => {
      const database = request.result;
      const transaction = request.transaction;

      let historyStore: IDBObjectStore;

      if (
        !database.objectStoreNames.contains(
          HISTORY_STORE,
        )
      ) {
        historyStore =
          database.createObjectStore(
            HISTORY_STORE,
            {
              keyPath: "id",
            },
          );
      } else {
        if (!transaction) {
          throw new Error(
            "IndexedDB upgrade transaction is unavailable.",
          );
        }

        historyStore =
          transaction.objectStore(
            HISTORY_STORE,
          );
      }

      if (
        !historyStore.indexNames.contains(
          "createdAt",
        )
      ) {
        historyStore.createIndex(
          "createdAt",
          "createdAt",
        );
      }

      if (
        !historyStore.indexNames.contains(
          "ownerEmail",
        )
      ) {
        historyStore.createIndex(
          "ownerEmail",
          "ownerEmail",
          {
            unique: false,
          },
        );
      }

      if (
        !database.objectStoreNames.contains(
          PROFILE_STORE,
        )
      ) {
        database.createObjectStore(
          PROFILE_STORE,
          {
            keyPath: "id",
          },
        );
      }

      if (
        !database.objectStoreNames.contains(
          DRAFT_STORE,
        )
      ) {
        database.createObjectStore(
          DRAFT_STORE,
          {
            keyPath: "id",
          },
        );
      }
    };

    request.onsuccess = () =>
      resolve(request.result);

    request.onerror = () =>
      reject(request.error);
  });
}

async function putValue<T>(
  storeName: string,
  value: T,
): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      storeName,
      "readwrite",
    );

    transaction
      .objectStore(storeName)
      .put(value);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

async function getValue<T>(
  storeName: string,
  key: IDBValidKey,
): Promise<T | null> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      storeName,
      "readonly",
    );

    const request = transaction
      .objectStore(storeName)
      .get(key);

    request.onsuccess = () => {
      database.close();
      resolve(
        (request.result as T | undefined) ??
          null,
      );
    };

    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}

async function deleteValue(
  storeName: string,
  key: IDBValidKey,
): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      storeName,
      "readwrite",
    );

    transaction
      .objectStore(storeName)
      .delete(key);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export async function saveHistory(
  record: HistoryRecord,
): Promise<void> {
  const ownerEmail = requireOwnerEmail();

  const storedRecord: StoredHistoryRecord = {
    ...record,
    ownerEmail,
  };

  await putValue(HISTORY_STORE, storedRecord);
}

export async function listHistory(): Promise<
  HistoryRecord[]
> {
  const ownerEmail = currentOwnerEmail();

  if (!ownerEmail) {
    return [];
  }

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      HISTORY_STORE,
      "readonly",
    );

    const request = transaction
      .objectStore(HISTORY_STORE)
      .index("ownerEmail")
      .getAll(ownerEmail);

    request.onsuccess = () => {
      database.close();

      const records = (
        request.result as StoredHistoryRecord[]
      )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        )
        .map((record) => ({
          id: record.id,
          createdAt: record.createdAt,
          resumeName: record.resumeName,
          resumeType: record.resumeType,
          resumeBlob: record.resumeBlob,
          jobDescription: record.jobDescription,
          jobFileName: record.jobFileName,
          result: record.result,
        }));

      resolve(records);
    };

    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}

export async function deleteHistory(
  id: string,
): Promise<void> {
  const ownerEmail = requireOwnerEmail();
  const record =
    await getValue<StoredHistoryRecord>(
      HISTORY_STORE,
      id,
    );

  if (!record) {
    return;
  }

  if (record.ownerEmail !== ownerEmail) {
    throw new Error(
      "This history record belongs to another user.",
    );
  }

  await deleteValue(HISTORY_STORE, id);
}

export async function saveProfile(
  profile: UserProfile,
): Promise<void> {
  const ownerEmail = requireOwnerEmail();

  const record: StoredProfileRecord = {
    id: profileKey(ownerEmail),
    ownerEmail,
    profile,
  };

  await putValue(PROFILE_STORE, record);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event(PROFILE_EVENT),
    );
  }
}

export async function getProfile(): Promise<
  UserProfile | null
> {
  const ownerEmail = currentOwnerEmail();

  if (!ownerEmail) {
    return null;
  }

  const record =
    await getValue<StoredProfileRecord>(
      PROFILE_STORE,
      profileKey(ownerEmail),
    );

  return record?.profile ?? null;
}

export async function saveDraft(
  draft: ResumeDraft,
): Promise<void> {
  const ownerEmail = requireOwnerEmail();

  const record: StoredDraftRecord = {
    id: draftKey(ownerEmail),
    ownerEmail,
    draft,
  };

  await putValue(DRAFT_STORE, record);
}

export async function getDraft(): Promise<
  ResumeDraft | null
> {
  const ownerEmail = currentOwnerEmail();

  if (!ownerEmail) {
    return null;
  }

  const record =
    await getValue<StoredDraftRecord>(
      DRAFT_STORE,
      draftKey(ownerEmail),
    );

  return record?.draft ?? null;
}
