export const dynamic = "force-dynamic"

export default async function Page() {
  return (
    <main className="min-h-svh bg-gradient-to-b from-muted/50 to-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                TODO Starter Pack
              </h1>
              <p className="text-sm text-muted-foreground">
                A boilerplate template &mdash; customize it to fit your use
                case.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
