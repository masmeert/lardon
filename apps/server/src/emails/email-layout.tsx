import { colors, websiteUrl } from "@lardon/brand";
import { raw } from "hono/html";
import type { PropsWithChildren } from "hono/jsx";

import { EmailFooter } from "./email-footer";

export function EmailLayout({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <>
      {raw("<!doctype html>")}
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-scheme" content="light" />
          <meta name="supported-color-schemes" content="light" />
          <title>{title}</title>
        </head>
        <body style={{ margin: 0, padding: 0, backgroundColor: colors.accentDark }}>
          <table
            role="presentation"
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border={0}
            style={{
              backgroundColor: colors.paper,
              fontFamily:
                "'Hanken Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            }}
          >
            <tr>
              <td align="center" style={{ padding: "40px 0 56px" }}>
                <table
                  role="presentation"
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border={0}
                  style={{ maxWidth: 560 }}
                >
                  <tr>
                    <td style={{ padding: "0 24px" }}>
                      <a href={websiteUrl}>
                        <img
                          src={`${websiteUrl}/email/lardon-logo-ink.png`}
                          alt="Lardon"
                          width={133}
                          height={24}
                          style={{ display: "block", border: 0 }}
                        />
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: "40px 24px 0",
                        color: colors.muted,
                        fontSize: 15,
                        lineHeight: 1.6,
                      }}
                    >
                      {children}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style={{ backgroundColor: colors.accentDark }}>
                <EmailFooter />
              </td>
            </tr>
          </table>
        </body>
      </html>
    </>
  );
}
