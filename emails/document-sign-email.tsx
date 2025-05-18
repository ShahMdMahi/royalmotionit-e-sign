import {
  Body,
  Button,
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
  Column,
  Row,
} from "@react-email/components";

interface DocumentSignEmailProps {
  recipientName: string;
  recipientEmail: string;
  documentTitle: string;
  documentId: string;
  message: string;
  expirationDate?: string;
  senderName?: string;
  senderEmail?: string;
}

export const DocumentSignEmail = ({
  recipientName,
  recipientEmail,
  documentTitle,
  documentId,
  message,
  expirationDate,
  senderName,
  senderEmail,
}: DocumentSignEmailProps) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://royal-sign.vercel.app";

  // Theme colors from globals.css using exact OKLCH values
  const theme = {
    primary: "oklch(0.795 0.184 86.047)",
    primaryForeground: "oklch(0.421 0.095 57.708)",
    secondary: "oklch(0.967 0.001 286.375)",
    secondaryForeground: "oklch(0.21 0.006 285.885)",
    background: "oklch(1 0 0)",
    foreground: "oklch(0.141 0.005 285.823)",
    muted: "oklch(0.967 0.001 286.375)",
    mutedForeground: "oklch(0.552 0.016 285.938)",
    accent: "oklch(0.554 0.135 66.442)",
    border: "oklch(0.92 0.004 286.32)",
    destructive: "oklch(0.577 0.245 27.325)",
    // Converting OKLCH to hex for email clients that don't support OKLCH
    primaryHex: "#FF9D42",
    primaryForegroundHex: "#6A4B1D",
    secondaryForegroundHex: "#363636",
    accentHex: "#B57A3B",
  };

  const currentYear = new Date().getFullYear();
  const previewText = `Hello ${recipientName}, you have a document "${documentTitle}" ready for signature.`;
  const signUrl = `${baseUrl}/documents/${documentId}/sign`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with gradient background */}
          <Section
            style={{
              ...header,
              backgroundImage: `linear-gradient(120deg, ${theme.primaryHex}30 0%, ${theme.primaryHex}70 100%)`,
            }}
          >
            <Img
              src={`${baseUrl}/name_logo.png`}
              width="220"
              height="auto"
              alt="Royal Sign Logo"
              style={logo}
            />
            <Heading
              style={{
                ...heading,
                color: theme.primaryForegroundHex,
              }}
            >
              Document Ready for Signature
            </Heading>
          </Section>

          {/* Main content */}
          <Section style={contentSection}>
            <Text style={greeting as any}>
              Hello{recipientName ? ` ${recipientName}` : ""},
            </Text>

            <Text style={text as any}>
              + You have a new document ready for your signature. Please review
              the details below:
            </Text>

            <Section
              style={{
                ...documentContainer,
                backgroundColor: `${theme.primaryHex}10`,
                borderLeft: `4px solid ${theme.primaryHex}`,
              }}
            >
              <Text style={documentTitle as any}>"{documentTitle}"</Text>
              {senderName && senderEmail && (
                <Text style={documentMessage as any}>
                  <strong>From:</strong> {senderName} ({senderEmail})
                </Text>
              )}
              {message && (
                <Text style={documentMessage as any}>
                  <strong>Message:</strong> {message}
                </Text>
              )}
              {expirationDate && (
                <Text style={expirationWarning as any}>
                  Please sign this document by {expirationDate}
                </Text>
              )}
            </Section>

            {/* Call to action button */}
            <Section style={buttonContainer}>
              <Button
                href={signUrl}
                style={{
                  ...button,
                  backgroundColor: theme.primaryHex,
                  color: theme.primaryForegroundHex,
                }}
              >
                Review & Sign Document
              </Button>
            </Section>

            <Text style={{ ...text, marginTop: "30px" } as any}>
              If you're having trouble with the button above, copy and paste
              this URL into your browser:
            </Text>

            <Text
              style={
                {
                  ...verificationLink,
                  color: theme.primaryHex,
                } as any
              }
            >
              {signUrl}
            </Text>

            {/* Security note section */}
            <Section
              style={{
                ...securityContainer,
                backgroundColor: `${theme.primaryHex}10`,
                borderLeft: `4px solid ${theme.primaryHex}`,
                marginTop: "30px",
              }}
            >
              <Text style={securityHeading as any}>Security Information:</Text>
              <Text style={securityText as any}>
                • Documents are securely transmitted and stored
              </Text>
              <Text style={securityText as any}>
                • Your electronic signature is legally binding
              </Text>
              <Text style={securityText as any}>
                • Please do not forward this email to others
              </Text>
            </Section>

            <Hr style={divider as any} />

            <Text style={footerText as any}>
              Powered by Royal Sign e-Signature Platform
            </Text>
            <Text style={footerSubText as any}>
              Secure, reliable electronic signatures for your documents
            </Text>
          </Section>

          {/* Footer */}
          <Text style={copyright as any}>
            © {currentYear} Royal Sign by RoyalMotionIT. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Email-client compatible styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  maxWidth: "600px",
  marginBottom: "40px",
  boxShadow: "0 1px 5px rgba(0,0,0,0.1)",
  borderRadius: "8px",
  overflow: "hidden" as const,
};

const header = {
  padding: "30px 0",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto 20px",
};

const heading = {
  fontSize: "28px",
  fontWeight: "bold" as const,
  margin: "10px 0",
  padding: "0 20px",
  textAlign: "center" as const,
};

const contentSection = {
  padding: "35px 40px",
  backgroundColor: "#ffffff",
};

const greeting = {
  fontSize: "20px",
  lineHeight: "28px",
  fontWeight: "500" as const,
  color: "#363636",
  margin: "0 0 15px",
};

const text = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#444444",
  margin: "0 0 20px",
  textAlign: "left" as const,
};

const documentContainer = {
  padding: "15px",
  margin: "10px 0 30px",
  borderRadius: "4px",
};

const documentTitle = {
  fontSize: "19px",
  fontWeight: "600" as const,
  color: "#333333",
  margin: "0 0 10px",
};

const documentMessage = {
  fontSize: "15px",
  color: "#555555",
  margin: "10px 0",
};

const expirationWarning = {
  fontSize: "15px",
  color: "#e63946",
  margin: "10px 0 0",
  fontWeight: "500" as const,
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  padding: "12px 28px",
  borderRadius: "6px",
  fontSize: "16px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
};

const securityContainer = {
  padding: "15px 20px",
  margin: "15px 0",
  borderRadius: "4px",
};

const securityHeading = {
  fontSize: "15px",
  fontWeight: "700" as const,
  color: "#333333",
  margin: "0 0 10px",
};

const securityText = {
  fontSize: "14px",
  color: "#555555",
  margin: "5px 0",
};

const verificationLink = {
  fontSize: "14px",
  lineHeight: "22px",
  margin: "10px 0 20px",
  wordBreak: "break-all" as const,
};

const highlight = {
  fontWeight: "bold" as const,
  display: "inline-block",
};

const divider = {
  borderColor: "#e6ebf1",
  margin: "30px 0",
};

const footerText = {
  fontSize: "14px",
  color: "#666666",
  margin: "0 0 5px",
  fontWeight: "500" as const,
};

const footerSubText = {
  fontSize: "13px",
  color: "#888888",
  margin: "0",
};

const copyright = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "20px 0 0",
  textAlign: "center" as const,
};
