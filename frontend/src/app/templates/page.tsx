import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import TemplateLibrary from "@/components/TemplateLibrary";
import { PAGE_IMAGES } from "@/lib/pageImages";

export const metadata = { title: "Resume Templates" };

export default function TemplatesPage() {
  return (
    <main>
      <Navbar />
      <PageHero
        eyebrow="Complete template library"
        title="See every resume format from header to final section."
        description="Review chronological, functional, combination, targeted, academic CV, and creative portfolio structures before building your own document."
        image={PAGE_IMAGES.templates}
        primaryHref="/resume-builder"
        primaryLabel="Build a resume"
      />
      <section className="workspace-section"><TemplateLibrary /></section>
      <Footer />
    </main>
  );
}
