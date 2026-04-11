import { Suspense } from "react";
import { PortalLoginForm } from "./portal-login-form";

export const metadata = {
  title: "Sign in — Friday Portal",
};

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "", error } = await searchParams;

  return (
    <Suspense>
      <PortalLoginForm next={next} serverError={error} />
    </Suspense>
  );
}
