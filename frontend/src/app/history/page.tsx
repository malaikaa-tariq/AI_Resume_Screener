import Footer from "@/components/Footer";
import HistoryManager from "@/components/HistoryManager";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import RequireAuth from "@/components/RequireAuth";
import { PAGE_IMAGES } from "@/lib/pageImages";

export const metadata = {
  title: "Analysis History",
};

export default function HistoryPage() {
  return (
    <main>
      <Navbar />
      <PageHero
        eyebrow="Analysis history"
        title="Return to old resumes and results whenever you need them."
        description="Open previous reports, download the original uploaded file, compare recommendations, or permanently delete individual records."
        image={PAGE_IMAGES.history}
        primaryHref="/analyze"
        primaryLabel="New analysis"
      />
      <section className="workspace-section">
        <RequireAuth
          title="Log in to view your history"
          description="Resume files and analysis results are separated by account and shown only to the currently signed-in user."
        >
          <HistoryManager />
        </RequireAuth>
      </section>
      <Footer />
    </main>
  );
}
