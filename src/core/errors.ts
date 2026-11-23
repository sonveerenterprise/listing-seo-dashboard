/** Thrown by core methods that return plain data (me, listReports) when no signed-in user is given. */
export class Unauthorized extends Error {
  constructor() {
    super("Please sign in");
    this.name = "Unauthorized";
  }
}

/** Core configuration is missing or invalid; answered with 500 "Core misconfigured" (fails closed). */
export class Misconfigured extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Misconfigured";
  }
}

/** Thrown by the HTTP client when the core service can't be reached or answers unexpectedly. */
export class CoreUnavailable extends Error {
  status: number;
  constructor(status: number, message = "Core service unavailable") {
    super(message);
    this.status = status;
    this.name = "CoreUnavailable";
  }
}
