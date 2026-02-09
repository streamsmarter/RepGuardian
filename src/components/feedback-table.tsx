"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createBrowserComponentClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface FeedbackTableProps {
  companyId: string;
  initialSentiment?: string;
  initialSearch?: string;
}

export function FeedbackTable({
  companyId,
  initialSentiment = "all",
  initialSearch = "",
}: FeedbackTableProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sentiment, setSentiment] = useState(initialSentiment);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createBrowserComponentClient();

  // Update URL with filters
  const updateFilters = (
    newSentiment?: string,
    newSearch?: string
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newSentiment !== undefined) {
      if (newSentiment === "all") {
        params.delete("sentiment");
      } else {
        params.set("sentiment", newSentiment);
      }
    }
    
    if (newSearch !== undefined) {
      if (newSearch === "") {
        params.delete("search");
      } else {
        params.set("search", newSearch);
      }
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  // Fetch feedback data
  const { data: feedbackData, isLoading } = useQuery({
    queryKey: ["feedback", companyId, sentiment, searchQuery],
    queryFn: async () => {
      // Base query for feedback with client data
      let query = supabase
        .from("feedback")
        .select(`
          *,
          client:client(*)
        `)
        .eq("company_id", companyId);

      // Apply sentiment filter based on 1-5 scale
      // 1-3 = negative, 4 = neutral, 5 = positive
      if (sentiment === "positive") {
        query = query.gte("sentiment_score", 5);
      } else if (sentiment === "negative") {
        query = query.lte("sentiment_score", 3);
      }

      // Order by created_at
      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Filter by search query on client side (client name, phone, feedback message, tags)
      let filteredData = data || [];
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filteredData = filteredData.filter((feedback: any) => {
          const firstName = feedback.client?.first_name?.toLowerCase() || "";
          const lastName = feedback.client?.last_name?.toLowerCase() || "";
          const phone = feedback.client?.phone_number || "";
          const message = feedback.feedback_message?.toLowerCase() || "";
          const tags = feedback.tags || [];
          const tagsMatch = tags.some((tag: string) => 
            tag.toLowerCase().includes(searchLower)
          );
          
          return (
            firstName.includes(searchLower) ||
            lastName.includes(searchLower) ||
            phone.includes(searchQuery) ||
            message.includes(searchLower) ||
            tagsMatch
          );
        });
      }

      // For each feedback, check if there are conflicts for this client
      const feedbackWithConflicts = await Promise.all(
        filteredData.map(async (feedback: any) => {
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
          };
        })
      );

      return feedbackWithConflicts;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(undefined, searchQuery);
  };

  const handleSentimentChange = (value: string) => {
    setSentiment(value);
    updateFilters(value, undefined);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getSentimentBadge = (score: number | null | undefined) => {
    // Score is 1-5: 1-3 = bad, 4 = average, 5 = great
    // Style: 10% bg opacity, 100% border opacity, text same color as border
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

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by client name, phone, or feedback content..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
        <div className="flex gap-2">
          <Select value={sentiment} onValueChange={handleSentimentChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Sentiment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sentiment</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Feedback Table */}
      <div className="border rounded-md">
        <div className="grid grid-cols-10 gap-4 p-4 border-b font-medium">
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Client</div>
          <div className="col-span-4">Feedback</div>
          <div className="col-span-2">Sentiment</div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-10 gap-4">
                <Skeleton className="h-6 col-span-2" />
                <Skeleton className="h-6 col-span-2" />
                <Skeleton className="h-6 col-span-4" />
                <Skeleton className="h-6 col-span-2" />
              </div>
            ))}
          </div>
        ) : feedbackData && feedbackData.length > 0 ? (
          <div className="divide-y">
            {feedbackData.map((feedback: any) => (
              <div
                key={feedback.id}
                className="grid grid-cols-10 gap-4 p-4 hover:bg-muted/50 cursor-pointer"
                onClick={() => setSelectedFeedback(feedback)}
              >
                <div className="col-span-2">
                  {formatDate(feedback.created_at)}
                </div>
                <div className="col-span-2">
                  {feedback.client?.first_name} {feedback.client?.last_name}
                </div>
                <div className="col-span-4 truncate">
                  {feedback.feedback_message}
                </div>
                <div className="col-span-2">
                  {getSentimentBadge(feedback.sentiment_score)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No feedback found matching your filters
          </div>
        )}
      </div>

      {/* Feedback Detail Dialog */}
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
