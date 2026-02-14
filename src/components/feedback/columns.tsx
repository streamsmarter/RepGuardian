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

const getSentimentBadge = (score: number | null | undefined) => {
  if (score === null || score === undefined) {
    return (
      <Badge 
        className="border"
        style={{ 
          backgroundColor: "rgba(107, 114, 128, 0.1)", 
          borderColor: "#6b7280",
          color: "#6b7280"
        }}
      >
        Unknown
      </Badge>
    )
  }
  
  if (score >= 5) {
    return (
      <Badge 
        className="border"
        style={{ 
          backgroundColor: "rgba(62, 207, 142, 0.1)", 
          borderColor: "#3ecf8e",
          color: "#3ecf8e"
        }}
      >
        Positive
      </Badge>
    )
  } else if (score >= 4) {
    return (
      <Badge 
        className="border"
        style={{ 
          backgroundColor: "rgba(234, 179, 8, 0.1)", 
          borderColor: "#eab308",
          color: "#eab308"
        }}
      >
        Neutral
      </Badge>
    )
  } else {
    return (
      <Badge 
        className="border"
        style={{ 
          backgroundColor: "rgba(239, 68, 68, 0.1)", 
          borderColor: "#ef4444",
          color: "#ef4444"
        }}
      >
        Negative
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
          Sentiment
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return getSentimentBadge(row.getValue("sentiment_score"))
    },
    filterFn: (row, id, value) => {
      const score = row.getValue(id) as number | null
      if (value === "all") return true
      if (value === "positive") return score !== null && score >= 5
      if (value === "negative") return score !== null && score <= 3
      return true
    },
  },
]
