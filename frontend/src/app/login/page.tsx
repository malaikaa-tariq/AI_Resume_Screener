import AuthPageShell from "@/components/AuthPageShell";
import { PAGE_IMAGES } from "@/lib/pageImages";

export const metadata = {
  title: "Log In",
};

export default function LoginPage() {
  return (
    <AuthPageShell
      mode="login"
      image={PAGE_IMAGES.login}
      imageTitle="Continue building your strongest application."
      imageText="Return to your saved profile, resume draft, and previous analysis results."
    />
  );
}
