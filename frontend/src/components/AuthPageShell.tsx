import AuthForm from "@/components/AuthForm";
import Logo from "@/components/Logo";

export default function AuthPageShell({
  mode,
  image,
  imageTitle,
  imageText,
}: {
  mode: "login" | "signup";
  image: string;
  imageTitle: string;
  imageText: string;
}) {
  return (
    <main className="auth-page">
      <div className="auth-topbar">
        <Logo />
      </div>

      <div className="auth-shell">
        <section className="auth-card-layout">
          <div
            className="auth-photo-panel"
            style={{
              backgroundImage: `linear-gradient(
                180deg,
                color-mix(in srgb, #000 4%, transparent),
                color-mix(in srgb, #000 70%, transparent)
              ), url("${image}")`,
            }}
          >
            <div>
              <span>CareerCanvas</span>
              <h2>{imageTitle}</h2>
              <p>{imageText}</p>
            </div>
          </div>

          <div className="auth-form-column">
            <AuthForm mode={mode} />
          </div>
        </section>
      </div>
    </main>
  );
}
