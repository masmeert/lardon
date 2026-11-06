import { colors, operator, studioUrl, websiteUrl } from "@lardon/brand";

export function EmailFooter() {
  return (
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border={0}
      style={{ maxWidth: 560 }}
    >
      <tr>
        <td
          style={{ padding: "40px 24px 48px", color: colors.card, fontSize: 14, lineHeight: 1.6 }}
        >
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()}{" "}
            <a href={studioUrl} style={{ color: colors.card, textDecoration: "underline" }}>
              {operator.tradeName}
            </a>
          </p>
          <p style={{ margin: "8px 0 0", lineHeight: 2 }}>
            {[
              ["Contact", `mailto:${operator.contactEmail}`],
              ["Brand", `${websiteUrl}/brand`],
              ["Privacy Policy", `${websiteUrl}/privacy`],
              ["Terms of Use", `${websiteUrl}/terms`],
            ].map(([label, href]) => (
              <>
                <a
                  href={href}
                  style={{
                    marginRight: 16,
                    color: colors.card,
                    textDecoration: "underline",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </a>{" "}
              </>
            ))}
          </p>
          <div
            style={{
              marginTop: 32,
              paddingTop: 40,
              borderTop: "1px solid rgba(255, 253, 246, 0.15)",
            }}
          >
            <img
              src={`${websiteUrl}/email/lardon-logo-footer.png`}
              alt=""
              width={512}
              style={{ display: "block", width: "100%", maxWidth: 512, height: "auto", border: 0 }}
            />
          </div>
        </td>
      </tr>
    </table>
  );
}
