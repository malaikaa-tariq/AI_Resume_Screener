import Link from "next/link";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="not-found">
      <Logo />
      <span className="eyebrow">404</span>
      <h1>This page is not in the portfolio.</h1>
      <p>Return to the homepage or start a new resume analysis.</p>
      <Link href="/" className="primary-button">
        Home <Icon name="arrow" size={18} />
      </Link>
    </main>
  );
}
