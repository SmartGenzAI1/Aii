// @ts-nocheck
import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted rounded-md",
        className
      )}
    />
  )
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center space-x-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-3/4" />
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex space-x-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TemplateSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-6 w-6 rounded" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-32" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  )
}