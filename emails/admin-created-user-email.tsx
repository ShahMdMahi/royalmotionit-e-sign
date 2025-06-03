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

interface AdminCreatedUserEmailProps {
  username: string;
  userEmail: string;
  password: string;
  isEmailVerified: boolean;
}

export const AdminCreatedUserEmail = ({
  username,
  userEmail,
  password,
  isEmailVerified,
}: AdminCreatedUserEmailProps) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://sign.royalmotionit.com";

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

  const loginUrl = `${baseUrl}/auth/login`;
  const currentYear = new Date().getFullYear();

  return (
    <Html>
      <Head />
      <Preview>Welcome to Royal Sign - Your Account Details</Preview>
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
              Your Account Has Been Created
            </Heading>
          </Section>
          {/* Main content */}
          <Section style={contentSection}>
            <Text style={greeting}>Hello {username},</Text>
            <Text style={text}>
              An administrator has created a new account for you on Royal Sign.
              Below are your login credentials:
            </Text>
            <Section style={credentialsContainer}>
              <Text style={credentialLabel}>Email:</Text>
              <Text style={credentialValue}>
                <span style={{ ...highlight, color: theme.primaryHex }}>
                  {userEmail}
                </span>
              </Text>
              <Text style={credentialLabel}>Password:</Text>
              <Text style={credentialValue}>{password}</Text>
            </Section>
            <Text style={text}>
              For security reasons, please change your password as soon as you
              log in.
            </Text>
            {isEmailVerified ? (
              <Text style={text}>
                Your email has been pre-verified by the administrator. You can
                log in right away.
              </Text>
            ) : (
              <Text style={text}>
                You will need to verify your email address after logging in.
              </Text>
            )}
            {/* Call to action button */}
            <Section style={buttonContainer}>
              <Button
                href={loginUrl}
                style={{
                  ...button,
                  backgroundColor: theme.primaryHex,
                  color: theme.primaryForegroundHex,
                }}
              >
                Log In Now
              </Button>
            </Section>
            <Text style={text}>
              If you have any questions, please contact your administrator.
            </Text>
            <Text style={{ ...text, marginTop: "24px" }}>
              Thank you for choosing Royal Sign.
            </Text>
            <Text style={signature}>The Royal Sign Team</Text>
          </Section>
          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              © {currentYear} Royal Motion IT. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link style={footerLink} href={`${baseUrl}/privacy-policy`}>
                Privacy Policy
              </Link>{" "}
              •{" "}
              <Link style={footerLink} href={`${baseUrl}/terms-of-service`}>
                Terms of Service
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  padding: "0",
  margin: "0",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "0",
};

const header = {
  backgroundColor: "#FFF",
  padding: "30px",
  textAlign: "center" as const,
  borderTopLeftRadius: "4px",
  borderTopRightRadius: "4px",
};

const logo = {
  maxWidth: "220px",
};

const heading = {
  fontSize: "26px",
  fontWeight: "700" as const,
  marginBottom: "0",
  textAlign: "center" as const,
};

const contentSection = {
  backgroundColor: "#FFF",
  padding: "30px",
};

const greeting = {
  fontSize: "18px",
  lineHeight: "24px",
  fontWeight: "bold" as const,
  color: "#333",
  marginBottom: "16px",
};

const text = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#444",
  marginBottom: "16px",
};

const highlight = {
  fontWeight: "bold" as const,
};

const credentialsContainer = {
  backgroundColor: "#f9f9f9",
  padding: "20px",
  borderRadius: "6px",
  marginTop: "16px",
  marginBottom: "24px",
  border: "1px solid #e5e5e5",
};

const credentialLabel = {
  fontSize: "14px",
  color: "#777",
  marginBottom: "4px",
  fontWeight: "600" as const,
};

const credentialValue = {
  fontSize: "18px",
  fontFamily: "monospace",
  backgroundColor: "#f1f1f1",
  color: "#333",
  padding: "8px 12px",
  borderRadius: "4px",
  marginBottom: "16px",
  fontWeight: "500" as const,
  letterSpacing: "0.5px",
  border: "1px solid #e0e0e0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#FF9D42",
  borderRadius: "6px",
  color: "#6A4B1D",
  fontSize: "16px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  cursor: "pointer",
};

const signature = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#444",
  fontWeight: "600" as const,
  marginTop: "12px",
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "0",
};

const footer = {
  color: "#706a7b",
  padding: "20px 30px",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "14px",
  color: "#706a7b",
  margin: "8px 0",
  textAlign: "center" as const,
};

const footerLink = {
  color: "#706a7b",
  textDecoration: "underline",
};
