import { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = {
  title: "Sign In — SHIPRAG Code Intelligence",
  description: "Sign in to your SHIPRAG AI code intelligence workspace.",
};

export default function LoginPage() {
  return <AuthLayout />;
}
