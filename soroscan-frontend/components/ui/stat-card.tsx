import * as React from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface StatCardProps {
  title: string
  value: string | number
  trendValue?: number
  icon?: React.ReactNode
  isLoading?: boolean
  className?: string
}

export function StatCard({ title, value, trendValue, icon, isLoading, className }: StatCardProps) {
  const isPositive = trendValue && trendValue > 0
  const isNegative = trendValue && trendValue < 0
  
  if (isLoading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="animate-pulse flex justify-between">
          <div className="space-y-3 w-full">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          </div>
          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card hoverable className={cn("p-6 flex items-start justify-between", className)}>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h3 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">{value}</h3>
        
        {trendValue !== undefined && (
          <div className="mt-2 flex items-center text-sm">
            {isPositive ? (
              <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
            ) : isNegative ? (
              <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
            ) : (
              <Minus className="mr-1 h-4 w-4 text-slate-500" />
            )}
            <span
              className={cn(
                "font-medium",
                isPositive && "text-green-600 dark:text-green-400",
                isNegative && "text-red-600 dark:text-red-400",
                !isPositive && !isNegative && "text-slate-600 dark:text-slate-400"
              )}
            >
              {Math.abs(trendValue)}%
            </span>
            <span className="ml-1 text-slate-500 dark:text-slate-400">vs last month</span>
          </div>
        )}
      </div>
      
      {icon && (
        <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 text-slate-600 dark:text-slate-300">
          {icon}
        </div>
      )}
    </Card>
  )
}