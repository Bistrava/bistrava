import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";
import type { ReactNode } from "react";

type EmailLayoutProps = {
  preview: string;
  title: string;
  children: ReactNode;
};

export function EmailLayout({ preview, title, children }: EmailLayoutProps) {
  return (
    <Html lang="sl">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.brandBar}>
            <Text style={styles.brand}>BISTRAVA</Text>
            <Text style={styles.tagline}>Mehka voda. Pametna izbira.</Text>
          </Section>
          <Section style={styles.content}>
            <Heading style={styles.heading}>{title}</Heading>
            {children}
          </Section>
          <Hr style={styles.hr} />
          <Section style={styles.footer}>
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
    padding: "32px 12px",
  },
  container: {
    backgroundColor: "#F8FCFC",
    border: "1px solid #CFE2E5",
    borderRadius: "12px",
    margin: "0 auto",
    maxWidth: "620px",
    overflow: "hidden" as const,
  },
  brandBar: {
    backgroundColor: "#10324A",
    padding: "22px 28px",
  },
  brand: {
    color: "#FFFFFF",
    fontFamily: "Manrope, Arial, sans-serif",
    fontSize: "22px",
    fontWeight: 800,
    letterSpacing: "1.5px",
    margin: 0,
  },
  tagline: {
    color: "#63D7C9",
    fontSize: "13px",
    margin: "4px 0 0",
  },
  content: { padding: "30px 28px 12px" },
  heading: {
    color: "#10324A",
    fontFamily: "Manrope, Arial, sans-serif",
    fontSize: "30px",
    lineHeight: "38px",
    margin: "0 0 20px",
  },
  hr: { borderColor: "#CFE2E5", margin: "22px 28px" },
  footer: { padding: "0 28px 28px" },
  footerText: { color: "#647780", fontSize: "12px", lineHeight: "18px" },
  link: { color: "#148F83", fontSize: "13px", fontWeight: 700 },
};
