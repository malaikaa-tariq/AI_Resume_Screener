import Link from "next/link";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";

const columns = [
  { title: "Product", links: [["/analyze","Resume analysis"],["/resume-builder","Resume builder"],["/templates","Template library"],["/history","Analysis history"]] },
  { title: "Account", links: [["/profile","Profile"],["/login","Log in"],["/signup","Create account"]] },
  { title: "Guidance", links: [["/features","Features and process"],["/templates","Choosing a format"],["/analyze","Start an analysis"]] },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <Logo />
          <p className="footer-description">
            Build a clearer, truthful, role-focused resume with guided analysis,
            editable templates, and saved history.
          </p>
          <div className="footer-trust">
            <span><Icon name="check" size={16}/>Privacy-aware uploads</span>
            <span><Icon name="check" size={16}/>Mobile responsive</span>
          </div>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h3>{column.title}</h3>
            <div className="footer-links">
              {column.links.map(([href,label]) => (
                <Link key={href+label} href={href}>
                  <Icon name="arrow" size={14}/>{label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <span>© 2026 CareerCanvas. All rights reserved.</span>
        <div><Link href="/features">Accessibility</Link><Link href="/features">Privacy</Link><Link href="/features">Help</Link></div>
      </div>
    </footer>
  );
}
