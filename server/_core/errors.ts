import { TRPCError } from "@trpc/server";

export class UnauthorizedError extends TRPCError {
  constructor(message = "Please log in to continue.") {
    super({ code: "UNAUTHORIZED", message });
  }
}

export class ForbiddenError extends TRPCError {
  constructor(message = "You do not have permission to perform this action.") {
    super({ code: "FORBIDDEN", message });
  }
}

export class NotFoundError extends TRPCError {
  constructor(message = "The requested resource was not found.") {
    super({ code: "NOT_FOUND", message });
  }
}
