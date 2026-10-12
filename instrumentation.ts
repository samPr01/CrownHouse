import type { Instrumentation } from "next"
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  _request,
  context
) => {
  // Do not log cookies, URLs with query strings, contact details or database errors.
  console.error(
    JSON.stringify({
      event: "store.request_error",
      digest:
        error && typeof error === "object" && "digest" in error
          ? String(error.digest)
          : "unavailable",
      route: context.routePath,
      type: context.routeType,
      time: new Date().toISOString(),
    })
  )
}
