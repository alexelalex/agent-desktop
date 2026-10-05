const NULL_BODY = new Set([101, 204, 205, 304])

/**
 * `fetch` for a plugin's own origin (OpenAPI client, spec): the main process
 * sends it with the plugin's token and default scope, refreshing the token if needed.
 */
export const fetchVia =
  (pluginId: string) =>
  async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init)
    const response = await window.desktop.plugins.fetch(pluginId, {
      url: request.url,
      method: request.method,
      headers: [...request.headers],
      body: request.body ? await request.text() : undefined,
    })
    return new Response(NULL_BODY.has(response.status) ? null : response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  }
