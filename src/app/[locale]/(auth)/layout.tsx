export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="mb-10">
        <span className="font-serif text-2xl italic tracking-wide text-foreground">
          C-Shine Time
        </span>
      </div>
      {children}
    </div>
  );
}
