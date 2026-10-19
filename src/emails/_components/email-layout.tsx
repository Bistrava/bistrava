import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";
import type { ReactNode } from "react";
import { companyDetails, companyPostalAddress } from "@/lib/content/company";

type EmailLayoutProps = {
  preview: string;
  title: string;
  children: ReactNode;
};

export function EmailLayout({ preview, title, children }: EmailLayoutProps) {
  return (
    <Html lang="sl">
      <Head>
        <meta name="color-scheme" content="light" />
        <style>{`
          @media only screen and (max-width: 480px) {
            .email-body { padding: 16px 8px !important; }
            .email-header, .email-content, .email-footer { padding-left: 20px !important; padding-right: 20px !important; }
            .email-heading { font-size: 26px !important; line-height: 34px !important; }
            .email-panel { padding: 16px !important; }
          }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body className="email-body" style={styles.body}>
        <Container style={styles.container}>
          <Section className="email-header" style={styles.brandBar}>
            <Link href="https://bistrava.com" aria-label="Bistrava — domov">
              <Img src="https://bistrava.com/brand/bistrava-logo-web.png" alt="Bistrava" width={210} height={54} style={styles.logo} />
            </Link>
            <Text style={styles.tagline}>Mehka voda. Pametna izbira.</Text>
          </Section>
          <Section className="email-content" style={styles.content}>
            <Heading className="email-heading" style={styles.heading}>{title}</Heading>
            {children}
          </Section>
          <Hr style={styles.hr} />
          <Section className="email-footer" style={styles.footer}>
            <Text style={styles.footerTitle}>Potrebujete pomoč?</Text>
            <Text style={styles.footerText}>
              Odgovorite na to sporočilo ali nam pišite na{" "}
              <Link href={`mailto:${companyDetails.email}`} style={styles.link}>{companyDetails.email}</Link>.
            </Text>
            <Text style={styles.footerText}>
              {companyDetails.shortName}<br />{companyPostalAddress}
            </Text>
            <Text style={styles.footerText}>
              To je transakcijsko sporočilo, povezano z vašo zahtevo pri Bistravi.
            </Text>
            <Link href="https://bistrava.com" style={styles.link}>
              bistrava.com
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#EAF5F6",
    color: "#263640",
    fontFamily: "Inter, Arial, sans-serif",
    margin: 0,
    padding: "36px 12px",
  },
  container: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #CFE2E5",
    borderRadius: "12px",
    margin: "0 auto",
    maxWidth: "600px",
    overflow: "hidden" as const,
  },
  brandBar: {
    backgroundColor: "#F8FCFC",
    borderTop: "6px solid #10324A",
    borderBottom: "3px solid #20B8A6",
    padding: "28px 32px 22px",
  },
  logo: { display: "block", width: "210px", maxWidth: "100%", height: "auto", border: 0 },
  tagline: {
    color: "#148F83",
    fontSize: "13px",
    lineHeight: "20px",
    fontWeight: 600,
    margin: "12px 0 0",
  },
  content: { padding: "30px 32px 8px" },
  heading: {
    color: "#10324A",
    fontFamily: "Manrope, Arial, sans-serif",
    fontSize: "28px",
    lineHeight: "38px",
    margin: "0 0 20px",
  },
  hr: { borderColor: "#CFE2E5", margin: "16px 0 0" },
  footer: { backgroundColor: "#F8FCFC", padding: "24px 32px" },
  footerTitle: { color: "#10324A", fontSize: "15px", fontWeight: 700, margin: "0 0 8px" },
  footerText: { color: "#647780", fontSize: "12px", lineHeight: "18px" },
  link: { color: "#148F83", fontSize: "13px", fontWeight: 700 },
};
