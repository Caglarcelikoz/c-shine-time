import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

export function VerifyEmail({ name, url }: { name: string; url: string }) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your email to activate your C-Shine Time account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Confirm your email</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            Welcome to C-Shine Time. Confirm your email address to activate your
            account and sign in.
          </Text>
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button style={button} href={url}>
              Verify email
            </Button>
          </Section>
          <Text style={muted}>
            This link expires in 24 hours. If you didn&apos;t create an account,
            you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default VerifyEmail

const main = { backgroundColor: "#f6f6f4", fontFamily: "Georgia, serif" }
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px",
  maxWidth: "480px",
}
const heading = { fontSize: "24px", fontWeight: 500 as const, color: "#1a1a1a" }
const text = { fontSize: "15px", lineHeight: "24px", color: "#333333" }
const muted = { fontSize: "13px", lineHeight: "20px", color: "#888888" }
const button = {
  backgroundColor: "#1a1a1a",
  color: "#ffffff",
  padding: "12px 28px",
  borderRadius: "4px",
  fontSize: "14px",
  textDecoration: "none",
}
