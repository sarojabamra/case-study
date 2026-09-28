import Button from "@/components/ui/Button";
import { Action } from "@/components/ui/stateTypes";
import { Link } from "react-router-dom";

export default function Empty({ title, action }: { title: string; action?: Action; }) {
  return (
    <div className="border border-line bg-surface px-6 py-12">
      <p className="font-display text-2xl">{title}</p>
      {action ? (
        <Link to={action.href} className="mt-6 inline-block">
          <Button variant="secondary">{action.label}</Button>
        </Link>
      ) : null}
    </div>
  );
}
