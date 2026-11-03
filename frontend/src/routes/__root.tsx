import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import ErrorComponent from "@/components/Common/ErrorComponent"
import NotFound from "@/components/Common/NotFound"

export const Route = createRootRoute({
  component: () => (
    <>
      <HeadContent />
      <Outlet />
      {/*
        The devtools toggles ship with a hardcoded z-index of 99999, which puts
        them above every dialog and drawer in the app. Trapping them in their own
        stacking context keeps that value local, so a modal (z-50) correctly
        covers them instead of the other way around.
      */}
      <div className="isolate z-40">
        <TanStackRouterDevtools position="bottom-right" />
        <ReactQueryDevtools initialIsOpen={false} />
      </div>
    </>
  ),
  notFoundComponent: () => <NotFound />,
  errorComponent: () => <ErrorComponent />,
})
