/**
 * Functional Result Pattern for robust domain operations without throwing exceptions
 */
export type Result<T, E = Error> =
  { success: true; data: T; error?: never } | { success: false; error: E; data?: never };

export const Ok = <T>(data: T): Result<T, never> => ({
  success: true,
  data,
});

export const Err = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});
