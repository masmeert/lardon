import { colors, websiteUrl } from "@lardon/brand";
import type { ReactNode } from "react";
import { Body, Container, Head, Html, Img, Link, Preview, Section } from "react-email";

import { EmailFooter } from "./email-footer";

export function EmailLayout({
  title,
  preview,
  children,
}: {
  title: string;
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <title>{title}</title>
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: colors.accent,
          fontFamily:
            "'Hanken Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <Section style={{ backgroundColor: colors.background, padding: "40px 0 56px" }}>
          <Container style={{ maxWidth: 560, padding: "0 24px" }}>
            <Link href={websiteUrl}>
              <Img
                src={`${websiteUrl}/email/lardon-logo-ink.png`}
                alt="Lardon"
                width={133}
                height={24}
              />
            </Link>
            <Section style={{ paddingTop: 40, color: colors.muted, fontSize: 15, lineHeight: 1.6 }}>
              {children}
            </Section>
          </Container>
        </Section>
        <EmailFooter />
      </Body>
    </Html>
  );
}
