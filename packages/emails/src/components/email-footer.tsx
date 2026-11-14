import { colors, operator, studioUrl, websiteUrl } from "@lardon/brand";
import { Fragment } from "react";
import { Container, Img, Link, Section, Text } from "react-email";

export function EmailFooter() {
  return (
    <Container style={{ maxWidth: 560, padding: "40px 24px 48px" }}>
      <Text style={{ margin: 0, color: colors.bacon, fontSize: 14, lineHeight: 1.6 }}>
        © {new Date().getFullYear()}{" "}
        <Link href={studioUrl} style={{ color: colors.bacon, textDecoration: "underline" }}>
          {operator.tradeName}
        </Link>
      </Text>
      <Text style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 2 }}>
        {[
          ["Contact", `mailto:${operator.contactEmail}`],
          ["Brand", `${websiteUrl}/brand`],
          ["Privacy Policy", `${websiteUrl}/privacy`],
          ["Terms of Use", `${websiteUrl}/terms`],
        ].map(([label, href]) => (
          <Fragment key={label}>
            <Link
              href={href}
              style={{
                marginRight: 16,
                color: colors.bacon,
                textDecoration: "underline",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </Link>{" "}
          </Fragment>
        ))}
      </Text>
      <Section
        style={{ marginTop: 32, paddingTop: 40, borderTop: "1px solid rgba(255, 253, 246, 0.15)" }}
      >
        <Img
          src={`${websiteUrl}/email/lardon-logo-footer.png`}
          alt=""
          width={512}
          style={{ width: "100%", maxWidth: 512, height: "auto" }}
        />
      </Section>
    </Container>
  );
}
