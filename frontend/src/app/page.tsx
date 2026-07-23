import Link from "next/link";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import { PAGE_IMAGES } from "@/lib/pageImages";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <PageHero
        eyebrow="AI resume workspace"
        title="Turn your experience into a clearer career story."
        description="Analyze a resume against a real role, select the right format, edit a complete document, maintain your profile, and return to every saved result."
        image={PAGE_IMAGES.home}
        primaryHref="/analyze"
        primaryLabel="Analyze a resume"
        secondaryHref="/resume-builder"
        secondaryLabel="Open resume builder"
      />

      <section className="content-section">
        <div className="section-intro">
          <span className="eyebrow">One focused platform</span>
          <h2>Separate pages for every important task</h2>
          <p>
            Navigate directly to analysis, templates, editing, history, or
            profile management instead of scrolling through one oversized
            dashboard.
          </p>
        </div>

        <div className="home-card-grid">
          {[
            { href: "/analyze", icon: "upload" as const, title: "Analyze", text: "Upload PDF, DOCX, or an image and compare it with a job description." },
            { href: "/templates", icon: "template" as const, title: "Template library", text: "Study every complete format from header to final section." },
            { href: "/resume-builder", icon: "edit" as const, title: "Resume builder", text: "Create, update, save, preview, and export your resume." },
            { href: "/history", icon: "history" as const, title: "History", text: "Open old results, download original files, or delete records." },
            { href: "/profile", icon: "user" as const, title: "Profile", text: "Maintain your personal details and profile picture." },
            { href: "/features", icon: "sparkles" as const, title: "Features and process", text: "Understand the full workflow and built-in safeguards." },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="home-feature-card">
              <span><Icon name={item.icon} size={24} /></span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <em>Open page <Icon name="arrow" size={15} /></em>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-cta">
        <div>
          <span className="eyebrow">Start with a real opportunity</span>
          <h2>Upload your resume and see what deserves attention.</h2>
          <p>Keep every claim accurate while improving clarity, relevance, and structure.</p>
        </div>
        <Link href="/analyze" className="primary-button">
          Start analysis <Icon name="arrow" size={18} />
        </Link>
      </section>
      <Footer />
    </main>
  );
}
