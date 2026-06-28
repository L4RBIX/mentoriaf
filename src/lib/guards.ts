import { ApiError } from "@/lib/http";

export function assertIsPending(request: {
  status: string;
  id: string;
}): void {
  if (request.status !== "pending") {
    throw new ApiError(
      409,
      `Request ${request.id} is not pending — current status: ${request.status}`
    );
  }
}

export function assertNotSelfReview(
  request: { sender_id: string },
  reviewerId: string
): void {
  if (request.sender_id === reviewerId) {
    throw new ApiError(
      403,
      "Reviewer cannot approve or reject their own write-off request"
    );
  }
}
