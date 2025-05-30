import { Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text, Column, Row } from "@react-email/components";

interface DocumentSignedNotificationProps {
  authorName: string;
  documentTitle: string;
  documentId: string;
  signerName: string;
  signerEmail: string;
  isAllSignersCompleted?: boolean; // Kept for backward compatibility
}

export const DocumentSignedNotification = ({
  authorName = "Document Owner",
  documentTitle = "Untitled Document",
  documentId,
  signerName = "Signer",
  signerEmail,
  isAllSignersCompleted = true, // Always true since we have a single signer
}: DocumentSignedNotificationProps) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sign.royalmotionit.com";

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
    successHex: "#22C55E",
  };

  const previewText = `Document "${documentTitle}" has been signed by ${signerName}`;

  const documentUrl = `${baseUrl}/documents/${documentId}`;

  const currentYear = new Date().getFullYear();

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
            <Img src={`${baseUrl}/name_logo.png`} width="220" height="auto" alt="Royal Sign Logo" style={logo} />
            <Heading
              style={{
                ...heading,
                color: theme.primaryForegroundHex,
              }}
            >
              Document Signed!
            </Heading>
          </Section>

          {/* Main content */}
          <Section style={contentSection}>
            <Text style={greeting}>Hello{authorName ? ` ${authorName}` : ""},</Text>

            <Text style={text}>
              Great news! Your document <span style={{ ...highlight, color: theme.primaryHex }}>"{documentTitle}"</span> has been signed by{" "}
              <span style={{ ...highlight, color: theme.primaryHex }}>{signerName}</span> ({signerEmail}).
            </Text>

            {/* Success notification */}
            <Section
              style={{
                ...featuresContainer,
                backgroundColor: `${theme.successHex}10`,
                borderLeft: `4px solid ${theme.successHex}`,
              }}
            >
              <Text
                style={{
                  fontSize: "16px",
                  color: "#276749",
                  margin: "0",
                }}
              >
                <Img
                  src={`${baseUrl}/icon_logo.png`}
                  width="24"
                  height="24"
                  alt="Success Icon"
                  style={{
                    display: "inline-block",
                    verticalAlign: "middle",
                    marginRight: "10px",
                  }}
                />
                Your document is now legally complete. You can download the signed document from the document details page.
              </Text>
            </Section>

            {/* What's Next Section */}
            <Text style={{ ...featuresHeading, marginTop: "30px", textAlign: "left" as const }}>What's next?</Text>

            <Row>
              <Column style={featureColumn}>
                <Img src={`${baseUrl}/icon_logo.png`} width="40" height="40" alt="Download" style={featureIcon} />
                <Text style={featureText}>Download the signed document</Text>
              </Column>
              <Column style={featureColumn}>
                <Img src={`${baseUrl}/icon_logo.png`} width="40" height="40" alt="Share" style={featureIcon} />
                <Text style={featureText}>Share with other stakeholders</Text>
              </Column>
            </Row>

            {/* Call to action button */}
            <Section style={buttonContainer}>
              <Button
                href={documentUrl}
                style={{
                  ...button,
                  backgroundColor: theme.primaryHex,
                  color: "#FFFFFF",
                }}
              >
                {isAllSignersCompleted ? "View Signed Document" : "View Document Status"}
              </Button>
            </Section>

            <Text
              style={{
                ...text,
                fontSize: "14px",
                color: "#666666",
                margin: "10px 0 0",
                textAlign: "center" as const,
              }}
            >
              If you're having trouble with the button above, copy and paste this URL into your browser:
            </Text>

            <Text
              style={{
                ...text,
                fontSize: "14px",
                color: theme.accentHex,
                margin: "5px 0 30px",
                wordBreak: "break-all",
                textAlign: "center" as const,
              }}
            >
              {documentUrl}
            </Text>
          </Section>

          <Hr
            style={{
              ...hr,
              borderColor: `${theme.primaryHex}30`,
            }}
          />

          {/* Footer */}
          <Section
            style={{
              ...footer,
              backgroundColor: `${theme.secondaryForegroundHex}08`,
            }}
          >
            <Img src={`${baseUrl}/logo.png`} width="60" height="auto" alt="Royal Sign Logo" style={footerLogo} />
            <Text style={footerText}>
              If you have any questions or need assistance, please contact our support team at
              <Link
                href="mailto:support@royalmotionit.com"
                style={{
                  ...link,
                  color: theme.primaryHex,
                }}
              >
                {" "}
                support@royalmotionit.com
              </Link>
            </Text>
            <Text style={footerText}>Powered by Royal Sign e-Signature Platform</Text>
            <Text style={copyright}>© {currentYear} Royal Motion IT. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default DocumentSignedNotification;

// Email styles
const main = {
  backgroundColor: "#f8f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  color: "#333333",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  maxWidth: "600px",
  borderRadius: "10px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  overflow: "hidden",
};

const header = {
  padding: "40px 0",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto 20px auto",
  display: "block",
};

const heading = {
  fontSize: "28px",
  lineHeight: "1.3",
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "0",
  padding: "0 20px",
};

const contentSection = {
  padding: "40px 30px 20px",
};

const greeting = {
  fontSize: "22px",
  lineHeight: "1.5",
  fontWeight: "600",
  color: "#171717",
  margin: "0 0 20px 0",
};

const text = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#333333",
  margin: "0 0 20px 0",
};

const highlight = {
  fontWeight: "600",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0 20px",
};

const button = {
  borderRadius: "8px",
  fontSize: "16px",
  fontWeight: "600",
  padding: "14px 28px",
  cursor: "pointer",
  border: "none",
  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
  transition: "all 0.2s ease-in-out",
};

const featuresContainer = {
  padding: "20px",
  borderRadius: "8px",
  margin: "20px 0",
};

const featuresHeading = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#171717",
  margin: "0 0 20px 0",
  textAlign: "center" as const,
};

const featureColumn = {
  textAlign: "center" as const,
  padding: "10px",
  margin: "5px 0 15px",
};

const featureIcon = {
  margin: "0 auto 15px",
  display: "block",
};

const featureText = {
  fontSize: "15px",
  lineHeight: "1.5",
  color: "#555555",
  margin: "0",
  fontWeight: "500",
};

const hr = {
  margin: "10px 0 30px",
  border: "none",
  height: "1px",
};

const footer = {
  padding: "30px",
  textAlign: "center" as const,
  borderTopLeftRadius: "8px",
  borderTopRightRadius: "8px",
};

const footerLogo = {
  margin: "0 auto 20px",
  display: "block",
};

const footerText = {
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#666666",
  margin: "0 0 10px 0",
};

const copyright = {
  fontSize: "14px",
  color: "#999999",
  margin: "20px 0 0 0",
};

const link = {
  textDecoration: "underline",
  fontWeight: "500",
};
