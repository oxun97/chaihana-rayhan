// res.json() on an empty or non-JSON body (a crashed serverless function,
// a proxy error page) throws "Unexpected end of JSON input" — which then
// surfaced to guests verbatim as the error message. Reading through this
// yields {} instead, so callers fall back to their own translated message.
export async function readJson(res) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch (e) {
    return {};
  }
}
