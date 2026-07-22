import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import { PAGE_IMAGES } from "@/lib/pageImages";

export const metadata = {
  title: "Features and Process",
};

const steps = [
  [
    "Upload",
    "Choose PDF, DOCX, PNG, JPG, JPEG, or WEBP. Drag and drop is supported.",
  ],
  [
    "Compare",
    "Paste or upload the job description so the analysis uses the complete role.",
  ],
  [
    "Review",
    "Inspect the score, missing terms, truthful rewrites, and template recommendation.",
  ],
  [
    "Build",
    "Create or update a complete resume in the selected format.",
  ],
  [
    "Save",
    "Keep drafts, original files, results, profile details, and history in the browser.",
  ],
];

export default function FeaturesPage() {
  return (
    <main>
      <Navbar />

      <PageHero
        eyebrow="Features and process"
        title="A complete resume workflow without a crowded single page."
        description="Every capability supports a clear step: upload, compare, review, build, and return to saved work."
        image={PAGE_IMAGES.features}
        primaryHref="/analyze"
        primaryLabel="Start analysis"
        secondaryHref="/templates"
        secondaryLabel="Explore templates"
      />

      <section className="content-section">
        <div className="section-intro">
          <span className="eyebrow">
            How the website works
          </span>
          <h2>
            Five connected steps from upload to
            final resume
          </h2>
          <p>
            Each step has its own focused page, so
            users can complete one task without
            searching through an oversized
            dashboard.
          </p>
        </div>

        <div className="process-timeline">
          {steps.map(
            ([title, text], index) => (
              <article key={title}>
                <span className="process-number">
                  {String(index + 1).padStart(
                    2,
                    "0",
                  )}
                </span>
                <h2>{title}</h2>
                <p>{text}</p>
              </article>
            ),
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
