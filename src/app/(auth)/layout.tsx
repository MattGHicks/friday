export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            friday
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
