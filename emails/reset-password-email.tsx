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

interface ResetPasswordEmailProps {
  username: string;
  userEmail: string;
  resetToken: string;
}

export const ResetPasswordEmail = ({
  username,
  userEmail,
  resetToken,
}: ResetPasswordEmailProps) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://sign.royalmotionit.com";
  const resetPasswordUrl = `${baseUrl}/auth/reset-password/${resetToken}`;

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

  return (
    <Html>
      <Head />
      <Preview>Reset Your Password for Royal Sign</Preview>
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
              Password Reset Request
            </Heading>
          </Section>

          {/* Main content */}
          <Section style={contentSection}>
            <Text style={greeting}>Hello {username},</Text>
            <Text style={text}>
              We received a request to reset the password for your Royal Sign
              account with email address: 
              <span
                style={{
                  ...highlight,
                  color: theme.primaryHex,
                }}
              >
                {userEmail}
              </span>
            </Text>
            <Text style={text}>
              To reset your password, click the button below. This link will
              expire in 1 hour for security purposes.
            </Text>

            {/* Call to action button */}
            <Section style={buttonContainer}>
              <Button
                href={resetPasswordUrl}
                style={{
                  ...button,
                  backgroundColor: theme.primaryHex,
                  color: theme.primaryForegroundHex,
                }}
              >
                Reset Password
              </Button>
            </Section>

            {/* Security note section */}
            <Section
              style={{
                ...securityContainer,
                backgroundColor: `${theme.primaryHex}10`,
                borderLeft: `4px solid ${theme.primaryHex}`,
              }}
            >
              <Text style={securityHeading}>
                Important Security Information:
              </Text>
              <Text style={securityText}>
                • This password reset link will expire in 1 hour
              </Text>
              <Text style={securityText}>
                • If you did not request a password reset, please ignore this
                email or contact support
              </Text>
              <Text style={securityText}>
                • For security, never share this reset link with anyone
              </Text>
              <Text style={securityText}>
                • Choose a strong, unique password that you haven't used
                elsewhere
              </Text>
            </Section>

            <Text style={{ ...text, marginTop: "30px" }}>
              If the button above doesn't work, you can copy and paste the
              following URL into your browser:
            </Text>
            <Text
              style={{
                ...resetLink,
                color: theme.primaryHex,
              }}
            >
              {resetPasswordUrl}
            </Text>
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
              If you're having trouble resetting your password or didn't request
              this change, contact our support team immediately.
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
              If you have any questions or need assistance, please contact our
              support team at 
              <Link
                href="mailto:support@royalmotionit.com"
                style={{
                  ...link,
                  color: theme.primaryHex,
                }}
              >
                support@royalmotionit.com
              </Link>
            </Text>
            <Text
              style={{
                ...accountInfo,
                backgroundColor: `${theme.primaryHex}10`,
                borderLeft: `3px solid ${theme.primaryHex}`,
              }}
            >
              Account email: 
              <span
                style={{
                  ...highlight,
                  color: theme.primaryHex,
                }}
              >
                {userEmail}
              </span>
            </Text>
            <Text style={footerText}>Powered by Royal Motion IT</Text>
            <Text style={copyright}>
              © {currentYear} Royal Motion IT. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ResetPasswordEmail;

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

const highlight = {
  fontWeight: "600",
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
  margin: "0 0 30px 0",
};

const securityHeading = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#171717",
  margin: "0 0 15px 0",
};

const securityText = {
  fontSize: "15px",
  lineHeight: "1.5",
  color: "#555555",
  margin: "0 0 10px 0",
  fontWeight: "500",
};

const resetLink = {
  fontSize: "14px",
  lineHeight: "1.5",
  fontWeight: "500",
  wordBreak: "break-all" as const,
  padding: "12px 15px",
  backgroundColor: "#f5f5f5",
  borderRadius: "6px",
  margin: "0 0 25px 0",
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

const accountInfo = {
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#666666",
  margin: "15px 0",
  padding: "12px 15px",
  borderRadius: "6px",
  display: "inline-block",
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
