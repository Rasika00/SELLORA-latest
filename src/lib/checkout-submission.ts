import {
  CheckoutError,
  createOrder,
  type ConfirmedOrder,
  type CreateOrderPayload,
} from "./api/checkout";

const STORAGE_KEY = "sellora_pending_checkout";
type Attempt = { fingerprint: string; key: string };
function browserStorage() {
  try {
    return typeof sessionStorage === "undefined" ? undefined : sessionStorage;
  } catch {
    return undefined;
  }
}
export class CheckoutSubmission {
  private busy = false;
  private confirmed: ConfirmedOrder | null = null;
  private attempt: Attempt | null = null;
  private outcomeUnconfirmed = false;
  constructor(
    private readonly send = createOrder,
    private readonly storage:
      | Pick<Storage, "getItem" | "setItem" | "removeItem">
      | undefined = browserStorage(),
  ) {}

  async submit(payload: CreateOrderPayload): Promise<ConfirmedOrder | null> {
    // Synchronous guard also covers two submits before React renders disabled UI.
    if (this.busy || this.confirmed) return null;
    this.busy = true;
    try {
      if (!this.storage)
        throw new CheckoutError(
          "Allow browser session storage before ordering so an interrupted checkout can be retried safely.",
        );
      const fingerprint = [
        ...new Uint8Array(
          await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload))),
        ),
      ]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (this.attempt?.fingerprint !== fingerprint) {
        let saved: Attempt | null = null;
        try {
          const value: unknown = JSON.parse(this.storage?.getItem(STORAGE_KEY) || "null");
          if (
            value &&
            typeof value === "object" &&
            "fingerprint" in value &&
            "key" in value &&
            typeof value.fingerprint === "string" &&
            /^[0-9a-f]{64}$/.test(value.fingerprint) &&
            typeof value.key === "string" &&
            /^[A-Za-z0-9_-]{16,128}$/.test(value.key)
          )
            saved = { fingerprint: value.fingerprint, key: value.key };
          else if (value !== null) throw new Error("Invalid pending checkout state");
        } catch {
          throw new CheckoutError(
            "Saved checkout state could not be read. Check My Orders and allow browser session storage before retrying.",
          );
        }
        if (this.attempt || (saved && saved.fingerprint !== fingerprint))
          throw new CheckoutError(
            "A previous checkout is unconfirmed. Restore its original details and retry before starting a different order.",
          );
        this.attempt = saved || { fingerprint, key: crypto.randomUUID() };
        // A saved pending key may belong to an order committed before a lost
        // response/reload. A later rejection cannot resolve that earlier outcome.
        if (saved) this.outcomeUnconfirmed = true;
      }
      try {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(this.attempt));
      } catch {
        throw new CheckoutError(
          "Could not save a safe checkout request. Allow browser session storage before ordering.",
        );
      }
      const receipt = await this.send(payload, this.attempt.key);
      this.confirmed = receipt.order;
      try {
        this.storage?.removeItem(STORAGE_KEY);
      } catch {
        /* Success remains confirmed in this controller. */
      }
      return receipt.order;
    } catch (error) {
      // Only a first, definite non-auth rejection confirms no order was created.
      // Session expiry never abandons an attempt; reauthentication must reuse it.
      if (
        error instanceof CheckoutError &&
        error.definitive &&
        error.status !== 401 &&
        !this.outcomeUnconfirmed
      ) {
        this.attempt = null;
        try {
          this.storage?.removeItem(STORAGE_KEY);
        } catch {
          /* In-memory state is cleared. */
        }
      } else if (this.attempt) this.outcomeUnconfirmed = true;
      throw error;
    } finally {
      this.busy = false;
    }
  }
}
