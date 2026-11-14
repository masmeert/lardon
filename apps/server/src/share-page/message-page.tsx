export function MessagePage({ title, message }: { title: string; message: string }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>{title}</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f2f2f7; font: 16px/1.45 -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif; text-align: center; }
              main { max-width: 360px; padding: 24px; }
              h1 { margin: 0 0 8px; font-size: 22px; }
              p { margin: 0; color: #6e6e73; }
              a { color: #5a6a1f; font-weight: 600; text-decoration: none; }
            `,
          }}
        />
      </head>
      <body>
        <main>
          <h1>{title}</h1>
          <p>
            {message} <a href="https://lardon.app">Discover Lardon</a>
          </p>
        </main>
      </body>
    </html>
  );
}
