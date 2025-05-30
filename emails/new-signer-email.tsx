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
  Row,
  Section,
  Text,
} from "@react-email/components";

export interface NewSignerEmailProps {
  username: string;
  userEmail: string;
  temporaryPassword: string;
}

export const NewSignerEmail = ({
  username,
  userEmail,
  temporaryPassword,
}: NewSignerEmailProps) => {
  const previewText = `Your account has been created. Use the temporary password to log in.`;

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
              Your Account Information
            </Heading>
          </Section>

          {/* Main content */}
          <Section style={contentSection}>
            <Text style={greeting}>Hello {username},</Text>
            <Text style={text}>
              An account has been created for you to sign documents on Royal
              Sign. Please use the following credentials to log in:
            </Text>

            <Section
              style={{
                ...credentialsBox,
                backgroundColor: `${theme.primaryHex}10`,
                borderLeft: `4px solid ${theme.primaryHex}`,
              }}
            >
              <Text style={securityHeading}>Your Login Credentials</Text>
              <Text style={credentialItem}>
                <strong>Email:</strong> {userEmail}
              </Text>
              <Text style={credentialItem}>
                <strong>Temporary Password:</strong> {temporaryPassword}
              </Text>
              <Text style={securityText}>
                Please change your password after your first login for security
                purposes.
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button
                href={`${baseUrl}/auth/login?email=${userEmail}&password=${temporaryPassword}&returnUrl=${baseUrl}/profile`}
                style={{
                  ...button,
                  backgroundColor: theme.primaryHex,
                  color: theme.primaryForegroundHex,
                }}
              >
                Sign In Now
              </Button>
            </Section>

            <Section
              style={{
                ...securityContainer,
                backgroundColor: `${theme.primaryHex}10`,
                borderLeft: `4px solid ${theme.primaryHex}`,
              }}
            >
              <Text style={securityHeading}>Security Notice</Text>
              <Text style={securityText}>
                • Never share your password with anyone else
              </Text>
              <Text style={securityText}>
                • Royal Sign will never ask for your password via email or phone
              </Text>
              <Text style={securityText}>
                • Always ensure you're visiting the official Royal Sign website
              </Text>
            </Section>
          </Section>

          <Hr
            style={{
              ...hr,
              borderColor: `${theme.primaryHex}30`,
            }}
          />

          {/* Support section */}
          <Section
            style={{
              ...supportSection,
              backgroundColor: `${theme.primaryHex}08`,
            }}
          >
            <Text
              style={{
                ...supportHeading,
                color: theme.primaryForegroundHex,
              }}
            >
              Need Help?
            </Text>
            <Text style={text}>
              If you're having trouble logging in or have any questions, our
              support team is here to help.
            </Text>
            <Img
              src={`${baseUrl}/icon_logo.png`}
              width="30"
              height="30"
              alt="Support"
              style={supportIcon}
            />
            <Button
              href="mailto:support@royalmotionit.com"
              style={{
                ...secondaryButton,
                color: theme.primaryHex,
                borderColor: theme.primaryHex,
              }}
            >
              Contact Support
            </Button>
          </Section>

          {/* Footer */}
          <Section
            style={{
              ...footer,
              backgroundColor: `${theme.secondaryForegroundHex}08`,
            }}
          >
            <Img
              src={`${baseUrl}/logo.png`}
              width="60"
              height="auto"
              alt="Royal Sign Logo"
              style={footerLogo}
            />
            <Text style={footerText}>
              Royal Sign - Secure Document Signing Platform by Royal Motion IT
            </Text>
            <Text style={copyright}>
              © {new Date().getFullYear()} Royal Motion IT. All rights
              reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Email styles
const main = {
  backgroundColor: "#f8f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
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

const credentialsBox = {
  padding: "25px",
  borderRadius: "8px",
  margin: "0 0 30px 0",
};

const securityHeading = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#171717",
  margin: "0 0 15px 0",
};

const credentialItem = {
  fontSize: "16px",
  lineHeight: "1.5",
  color: "#333333",
  margin: "8px 0",
  fontFamily: "monospace",
  backgroundColor: "#ffffff",
  padding: "10px 15px",
  borderRadius: "5px",
  border: "1px solid rgba(0,0,0,0.1)",
};

const securityText = {
  fontSize: "15px",
  lineHeight: "1.5",
  color: "#555555",
  margin: "15px 0 5px 0",
  fontWeight: "500",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0 40px",
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

const securityContainer = {
  padding: "25px",
  borderRadius: "8px",
  margin: "10px 0 30px 0",
};

const hr = {
  margin: "10px 0 30px",
  border: "none",
  height: "1px",
};

const supportSection = {
  padding: "30px",
  textAlign: "center" as const,
  margin: "0 0 30px",
  borderRadius: "8px",
};

const supportHeading = {
  fontSize: "20px",
  fontWeight: "600",
  margin: "0 0 15px 0",
};

const supportIcon = {
  margin: "10px auto 15px",
  display: "block",
};

const secondaryButton = {
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 24px",
  cursor: "pointer",
  backgroundColor: "transparent",
  borderWidth: "1px",
  borderStyle: "solid",
  margin: "10px 0",
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

export default NewSignerEmail;
