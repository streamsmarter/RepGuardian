"use client";

import { useState } from "react";
import { createBrowserComponentClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/feedback/data-table";
import { columns, type Feedback } from "@/components/feedback/columns";

interface FeedbackTableProps {
  companyId: string;
  initialSentiment?: string;
  initialSearch?: string;
}

export function FeedbackTable({
  companyId,
}: FeedbackTableProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const supabase = createBrowserComponentClient();

  const { data: feedbackData, isLoading } = useQuery({
    queryKey: ["feedback", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select(`
          *,
          client:client(*)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const feedbackWithConflicts = await Promise.all(
        (data || []).map(async (feedback: any) => {
          const { data: conflicts } = await supabase
            .from("conflict")
            .select("status")
            .eq("client_id", feedback.client_id)
            .eq("company_id", companyId);

          const hasActiveConflict = conflicts?.some(
            (conflict: any) => conflict.status === "active"
          );
          const hasResolvedConflict = conflicts?.some(
            (conflict: any) => conflict.status === "closed"
          );

          return {
            ...feedback,
            conflict_status: hasActiveConflict
              ? "active"
              : hasResolvedConflict
              ? "resolved"
              : "none",
          } as Feedback;
        })
      );

      return feedbackWithConflicts;
    },
    staleTime: 1000 * 60,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

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
      );
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
      );
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
      );
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
      );
    }
  };

  const getConflictBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="destructive">Active Conflict</Badge>;
      case "resolved":
        return <Badge variant="outline">Resolved</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[140px]" />
        </div>
        <div className="border rounded-md p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DataTable 
        columns={columns} 
        data={feedbackData || []} 
        onRowClick={(row) => setSelectedFeedback(row)}
      />

      <Dialog
        open={!!selectedFeedback}
        onOpenChange={(open) => {
          if (!open) setSelectedFeedback(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          {selectedFeedback && (
            <>
              <DialogHeader>
                <DialogTitle>Feedback Details</DialogTitle>
                <DialogDescription>
                  From {selectedFeedback.client?.first_name}{" "}
                  {selectedFeedback.client?.last_name} on{" "}
                  {formatDate(selectedFeedback.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <div className="font-medium mb-1">Feedback Message:</div>
                  <Card>
                    <CardContent className="p-4">
                      {selectedFeedback.feedback_message}
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <div className="font-medium mb-1">Sentiment:</div>
                  <div>
                    {getSentimentBadge(selectedFeedback.sentiment_score)}
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-1">Tags:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeedback.tags && selectedFeedback.tags.length > 0 ? (
                      selectedFeedback.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No tags</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-1">Client Information:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Name:</span>{" "}
                      {selectedFeedback.client?.first_name}{" "}
                      {selectedFeedback.client?.last_name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      {selectedFeedback.client?.phone_number}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      {selectedFeedback.client?.email || "N/A"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Review Status:
                      </span>{" "}
                      {selectedFeedback.client?.review_submitted
                        ? "Submitted"
                        : selectedFeedback.client?.review_request_sent
                        ? "Requested"
                        : "Not Requested"}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-1">Conflict Status:</div>
                  <div>
                    {getConflictBadge(selectedFeedback.conflict_status) || (
                      <span className="text-muted-foreground">No conflicts</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
