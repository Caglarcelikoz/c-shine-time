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

export function ResetPassword({ name, url }: { name: string; url: string }) {
  return (
    <Html>
      <Head />
      <Preview>Reset your C-Shine Time password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Reset your password</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            We received a request to reset your password. Click below to choose a
            new one.
          </Text>
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button style={button} href={url}>
              Reset password
            </Button>
          </Section>
          <Text style={muted}>
            This link expires in 30 minutes and can be used once. If you
            didn&apos;t request this, you can safely ignore this email — your
            password won&apos;t change.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ResetPassword

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
