/**
 * Dynamically imports react-dom/server and renders a React element to an HTML string.
 * This avoids Next.js build errors about importing react-dom/server in Route Handlers.
 */
export async function renderToHtml(element: React.ReactElement): Promise<string> {
  const { renderToString } = await import('react-dom/server');
  return `<!DOCTYPE html>${renderToString(element)}`;
}
