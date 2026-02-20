export default function ChatLoading() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    </div>
  );
}
