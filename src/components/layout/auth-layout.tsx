import { Outlet } from 'react-router'

/** Shell for the signed-out pages: sign in, register, and password reset. */
export function AuthLayout() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Decorative on small screens it simply disappears; nothing here is
          needed to complete the form. */}
      <section className="hidden flex-col justify-center bg-accent/60 px-12 py-16 lg:flex">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
          >
            R
          </span>
          <span className="text-base font-semibold">Remmi</span>
        </div>

        <h2 className="mt-10 max-w-md text-3xl font-semibold tracking-tight">
          Organize your day and stay accountable.
        </h2>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Plan your timeline, track your tasks, and keep your schedule visible in one place.
          Designed for personal use now, with room to grow into shared family planning later.
        </p>
      </section>

      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
            >
              R
            </span>
            <span className="text-base font-semibold">Remmi</span>
          </div>

          <Outlet />
        </div>
      </main>
    </div>
  )
}
