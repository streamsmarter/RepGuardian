"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

export type Feedback = {
  id: string
  created_at: string
  feedback_message: string
  sentiment_score: number | null
  client: {
    first_name: string
    last_name: string
    phone_number: string
    email: string
    review_submitted: boolean
    review_request_sent: boolean
  } | null
  tags: string[]
  conflict_status: "active" | "resolved" | "none"
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

const getPriorityBadge = (score: number | null | undefined) => {
  if (score === null || score === undefined) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Unknown
      </Badge>
    )
  }
  
  if (score >= 5) {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
        Promote
      </Badge>
    )
  } else if (score === 4) {
    return (
      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
        Monitor
      </Badge>
    )
  } else if (score === 3) {
    return (
      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
        At risk
      </Badge>
    )
  } else {
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20">
        Urgent
      </Badge>
    )
  }
}

export const columns: ColumnDef<Feedback>[] = [
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 hover:bg-muted hover:text-foreground"
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return formatDate(row.getValue("created_at"))
    },
  },
  {
    id: "client",
    accessorFn: (row) => {
      if (!row.client) return ""
      return `${row.client.first_name} ${row.client.last_name}`
    },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 hover:bg-muted hover:text-foreground"
        >
          Client
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const client = row.original.client
      if (!client) return <span className="text-muted-foreground">Unknown</span>
      return `${client.first_name} ${client.last_name}`
    },
  },
  {
    accessorKey: "feedback_message",
    header: "Feedback",
    cell: ({ row }) => {
      const message = row.getValue("feedback_message") as string
      return (
        <div className="max-w-[400px] truncate">
          {message || <span className="text-muted-foreground">No message</span>}
        </div>
      )
    },
  },
  {
    accessorKey: "sentiment_score",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 hover:bg-muted hover:text-foreground"
        >
          Priority
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return getPriorityBadge(row.getValue("sentiment_score"))
    },
    filterFn: (row, id, value) => {
      const score = row.getValue(id) as number | null
      if (value === "all") return true
      if (value === "promote") return score !== null && score >= 5
      if (value === "monitor") return score !== null && score === 4
      if (value === "at_risk") return score !== null && score === 3
      if (value === "urgent") return score !== null && score <= 2
      return true
    },
  },
]
