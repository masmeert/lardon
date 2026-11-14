import { colors } from "@lardon/brand";

export function MessagePage({ title, message }: { title: string; message: string }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>{title}</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: colors.background,
          font: '16px/1.45 -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
          textAlign: "center",
        }}
      >
        <main style={{ maxWidth: 360, padding: 24 }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 22 }}>{title}</h1>
          <p style={{ margin: 0, color: colors.muted }}>
            {message}{" "}
            <a
              href="https://lardon.app"
              style={{ color: colors.accent, fontWeight: 600, textDecoration: "none" }}
            >
              Discover Lardon
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
