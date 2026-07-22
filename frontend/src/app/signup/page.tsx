import AuthPageShell from "@/components/AuthPageShell";
import { PAGE_IMAGES } from "@/lib/pageImages";

export const metadata = {
  title: "Create Account",
};

export default function SignupPage() {
  return (
    <AuthPageShell
      mode="signup"
      image={PAGE_IMAGES.signup}
      imageTitle="Organize your resume journey in one place."
      imageText="Save your profile, resume drafts, and analysis history as you prepare for new opportunities."
    />
  );
}
