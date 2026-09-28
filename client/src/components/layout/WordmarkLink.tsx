import { Link } from "react-router-dom";

export default function WordmarkLink() {
  return (
    <Link
      to="/"
      className="inline-flex cursor-pointer items-center transition-opacity hover:opacity-80"
      aria-label="E-commerce home"
    >
      <span className="text-lg font-semibold text-ink">E-commerce</span>
    </Link>
  );
}
