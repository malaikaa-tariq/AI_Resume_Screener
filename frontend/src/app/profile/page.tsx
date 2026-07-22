import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import ProfileManager from "@/components/ProfileManager";
import RequireAuth from "@/components/RequireAuth";
import { PAGE_IMAGES } from "@/lib/pageImages";

export const metadata = {
  title: "User Profile",
};

export default function ProfilePage() {
  return (
    <main>
      <Navbar />
      <PageHero
        eyebrow="User profile"
        title="Maintain the personal details used across your resume workspace."
        description="Upload a profile picture, keep your contact details current, and reuse profile information in the resume builder."
        image={PAGE_IMAGES.profile}
      />
      <section className="workspace-section">
        <RequireAuth
          title="Log in to view your profile"
          description="Profile details and profile pictures are private to each account and are hidden after logout."
        >
          <ProfileManager />
        </RequireAuth>
      </section>
      <Footer />
    </main>
  );
}
