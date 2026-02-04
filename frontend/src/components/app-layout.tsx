"use client"

import type { ReactNode } from "react"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/animate-ui/components/radix/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { ThemeTogglerButton } from "./animate-ui/components/buttons/theme-toggler"
import { AppSidebar } from "./app-sidebar"

interface BreadcrumbItemType {
  label: string
  href?: string
}

interface AppLayoutProps {
  children: ReactNode
  isLoading?: boolean
  headerAction?: ReactNode
  breadcrumbs?: BreadcrumbItemType[]
}

export const AppLayout = ({
  children,
  isLoading = false,
  headerAction,
  breadcrumbs = [],
}: AppLayoutProps) => {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1" />

          {/* Add flex-1 here to take up all remaining space */}
          <div className="flex flex-1 items-center justify-between">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <BreadcrumbItem>
                      {item.href ? (
                        <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-2">
              {headerAction}
              <ThemeTogglerButton modes={["light", "dark"]} variant="secondary" />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {isLoading ? (
            <>
              <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <Skeleton className="aspect-video rounded-xl" />
                <Skeleton className="aspect-video rounded-xl" />
                <Skeleton className="aspect-video rounded-xl" />
              </div>
              <Skeleton className="min-h-screen flex-1 rounded-xl" />
            </>
          ) : (
            children
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
