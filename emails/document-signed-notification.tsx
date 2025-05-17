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
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://royal-sign.vercel.app";

  // Theme colors from globals.css
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
  };

  const previewText = `Document "${documentTitle}" has been signed by ${signerName}`;

  const documentUrl = `${baseUrl}/documents/${documentId}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body
        style={{
          backgroundColor: "#f6f6f6",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <Container
          style={{
            margin: "10px auto",
            padding: "20px 0 48px",
            maxWidth: "580px",
          }}
        >
          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            {/* Header */}
            <Section
              style={{
                padding: "20px",
                backgroundColor: theme.secondary,
                textAlign: "center" as const,
              }}
            >
              <Img
                src={`${baseUrl}/logo.png`}
                alt="Royal Sign"
                width="160"
                height="40"
                style={{ margin: "0 auto" }}
              />
            </Section>

            {/* Content */}
            <Section style={{ padding: "30px 40px" }}>
              <Heading
                as="h1"
                style={{
                  color: theme.foreground,
                  fontSize: "24px",
                  fontWeight: "600",
                  margin: "0 0 20px",
                }}
              >
                Document Signed!
              </Heading>

              <Text
                style={{
                  fontSize: "16px",
                  color: theme.foreground,
                  margin: "0 0 10px",
                }}
              >
                Hello{authorName ? ` ${authorName}` : ""},
              </Text>

              <Text
                style={{
                  fontSize: "16px",
                  color: theme.foreground,
                  margin: "0 0 20px",
                }}
              >
                Great news! Your document <strong>"{documentTitle}"</strong> has
                been signed by <strong>{signerName}</strong> ({signerEmail}).
              </Text>

              <Section
                style={{
                  backgroundColor: "#f0fff4",
                  border: "1px solid #c6f6d5",
                  borderRadius: "4px",
                  padding: "15px",
                  margin: "0 0 24px",
                }}
              >
                <Text
                  style={{
                    fontSize: "16px",
                    color: "#276749",
                    margin: "0",
                  }}
                >
                  Your document is now legally complete. You can download the
                  signed document from the document details page.
                </Text>
              </Section>

              <Section
                style={{ textAlign: "center" as const, margin: "30px 0" }}
              >
                <Button
                  href={documentUrl}
                  style={{
                    backgroundColor: theme.primary,
                    color: "#fff",
                    padding: "12px 30px",
                    borderRadius: "6px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    textDecoration: "none",
                    display: "inline-block",
                    textAlign: "center" as const,
                    cursor: "pointer",
                  }}
                >
                  {isAllSignersCompleted
                    ? "View Signed Document"
                    : "View Document Status"}
                </Button>
              </Section>

              <Text
                style={{
                  fontSize: "14px",
                  color: "#666",
                  margin: "30px 0 0",
                }}
              >
                If you're having trouble with the button above, copy and paste
                this URL into your browser:
              </Text>

              <Text
                style={{
                  fontSize: "14px",
                  color: theme.accent,
                  margin: "5px 0 30px",
                  wordBreak: "break-all",
                }}
              >
                {documentUrl}
              </Text>

              <Hr
                style={{
                  borderColor: "#eaeaea",
                  borderStyle: "solid",
                  borderWidth: "1px",
                  margin: "26px 0",
                }}
              />

              <Text
                style={{
                  fontSize: "14px",
                  color: theme.mutedForeground,
                  margin: "0 0 5px",
                }}
              >
                Powered by Royal Sign e-Signature Platform
              </Text>
              <Text
                style={{
                  fontSize: "12px",
                  color: theme.mutedForeground,
                  margin: "0",
                }}
              >
                Secure, reliable electronic signatures for your documents
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Text
            style={{
              fontSize: "12px",
              color: "#666",
              margin: "20px 0 0",
              textAlign: "center" as const,
            }}
          >
            © {new Date().getFullYear()} Royal Sign by RoyalMotionIT. All
            rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};
