export function FormMessage({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <p role="alert" className="text-sm text-danger">
      {message}
    </p>
  );
}
