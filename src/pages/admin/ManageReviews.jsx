import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Trash2, Star, User, Calendar } from "lucide-react";
import apiClient from "../../lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ManageReviews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all reviews
  const { data: reviews = [], isLoading, error } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const response = await apiClient.get('/api/reviews');
      return response.data;
    }
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      const response = await apiClient.delete(`/api/reviews/${reviewId}`);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Review Deleted",
        description: "The review has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete review.",
        variant: "destructive",
      });
    }
  });

  const handleDeleteReview = (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      deleteReviewMutation.mutate(reviewId);
    }
  };



  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter reviews based on search
  const filteredReviews = reviews.filter(review => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      review.reviewerName?.toLowerCase().includes(searchLower) ||
      review.reviewerEmail?.toLowerCase().includes(searchLower) ||
      review.propertyTitle?.toLowerCase().includes(searchLower) ||
      review.reviewText?.toLowerCase().includes(searchLower) ||
      review.propertyAgentName?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate statistics - only keep what's needed for rating distribution
  const totalReviews = reviews.length;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-red-500 mb-4">Failed to load reviews</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-inter font-bold text-3xl md:text-4xl text-neutral-900 mb-2 flex items-center">
            🧹 Manage Reviews
          </h1>
          <p className="text-lg text-neutral-600">
            Table/card list: reviewer email/name, property title, review description, delete button
          </p>
        </div>



        {/* Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search reviews by reviewer name/email, property title, review text, or agent..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Reviews Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-neutral-900">
              All Reviews ({filteredReviews.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <div className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-full mr-3" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredReviews.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <MessageSquare className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {searchTerm ? "No Reviews Found" : "No Reviews Yet"}
                </h3>
                <p className="text-neutral-600">
                  {searchTerm 
                    ? "Try adjusting your search criteria."
                    : "No reviews have been submitted on the platform yet."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredReviews.map((review) => (
                <Card key={review._id || review.id} className="hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-md hover:shadow-2xl">
                  <CardContent className="p-6">
                    {/* Header with delete button */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center flex-1">
                        <Avatar className="w-12 h-12 mr-4 border-2 border-neutral-200">
                          <AvatarImage src={review.reviewerImage} alt={review.reviewerName} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                            {review.reviewerName?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-900 text-sm">
                            {review.reviewerName || 'Anonymous User'}
                          </h3>
                          <p className="text-xs text-neutral-500">
                            {review.reviewerEmail || 'No email available'}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteReview(review._id || review.id)}
                        disabled={deleteReviewMutation.isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-2 h-8 w-8"
                        title="Delete Review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Property info */}
                    <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
                      <h4 className="font-medium text-sm text-neutral-900 mb-1">
                        Property: {review.propertyTitle || 'Property Title Not Available'}
                      </h4>
                      <p className="text-xs text-neutral-600">
                        Agent: {review.propertyAgentName || 'Agent Name Not Available'}
                      </p>
                    </div>
                    
                    {/* Review content */}
                    <div className="mb-4">
                      <h5 className="text-xs font-medium text-neutral-500 mb-2">REVIEW DESCRIPTION</h5>
                      <blockquote className="text-neutral-700 text-sm leading-relaxed italic border-l-3 border-blue-500 pl-3">
                        "{review.reviewText || 'No description provided'}"
                      </blockquote>
                    </div>
                    
                    {/* Footer with date */}
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                      <div className="text-xs text-neutral-500">
                        {formatDate(review.createdAt)}
                      </div>
                      <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Review #{(filteredReviews.indexOf(review) + 1).toString().padStart(3, '0')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>


      </div>
    </div>
  );
}
