import { SignInForm } from "@/components/SignInForm";

export default function LoginPage() {
  return <SignInForm emailFlowsEnabled={process.env.ORY_EMAIL_FLOWS_ENABLED === "true"} />;
}
