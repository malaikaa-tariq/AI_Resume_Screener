import AnalyzerWorkspace from "@/components/AnalyzerWorkspace";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import { PAGE_IMAGES } from "@/lib/pageImages";

export const metadata = { title: "Analyze Resume" };

export default function AnalyzePage() {
  return (
    <main>
      <Navbar />
      <PageHero
        eyebrow="Resume analysis"
        title="Compare your resume with the role you actually want."
        description="Upload PDF, DOCX, or an image. Paste or upload the job description. The result is saved to your browser history after a successful analysis."
        image={PAGE_IMAGES.analyze}
      />
      <section className="workspace-section"><AnalyzerWorkspace /></section>
      <Footer />
    </main>
  );
}
