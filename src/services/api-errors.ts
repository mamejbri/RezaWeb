import { HttpErrorResponse } from '@angular/common/http';

/** The backend answers 409 SLOT_UNAVAILABLE when the slot was taken (e.g. by a concurrent booking). */
export function isSlotUnavailable(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 409 && error.error?.code === 'SLOT_UNAVAILABLE';
}
