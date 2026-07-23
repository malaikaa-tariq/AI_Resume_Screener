import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import RequireAuth from "@/components/RequireAuth";
import ResumeBuilder from "@/components/ResumeBuilder";
import { PAGE_IMAGES } from "@/lib/pageImages";

export const metadata = {
  title: "Resume Builder",
};

export default function BuilderPage() {
  return (
    <main>
      <Navbar />
      <PageHero
        eyebrow="Resume builder"
        title="Create, update, preview, save, and export your resume."
        description="Choose any supported format, maintain a reusable draft, and download common document formats. PDF export uses the browser print dialog."
        image={PAGE_IMAGES.builder}
      />
      <section className="workspace-section">
        <RequireAuth
          title="Log in to use your resume builder"
          description="Saved resume drafts are separated by account and are available only to the currently signed-in user."
        >
          <ResumeBuilder />
        </RequireAuth>
      </section>
      <Footer />
    </main>
  );
}
