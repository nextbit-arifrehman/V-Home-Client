import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { Star, Trash2, MessageSquare, User, Calendar } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import api from '../../lib/api';

const MyReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchUserReviews();
  }, []);

  const fetchUserReviews = async () => {
    try {
      console.log('🔄 Fetching user reviews from API...');
      const response = await api.get('/api/reviews/my-reviews');
      console.log('✅ Reviews fetched successfully:', response.data);
      setReviews(response.data || []);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      // Handle 404 as empty reviews rather than error
      if (error.response?.status === 404) {
        console.log('📭 No reviews found (404), setting empty array');
        setReviews([]);
      } else {
        toast({
          title: "Error",
          description: "Failed to load your reviews",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    setDeletingId(reviewId);
    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews(reviews.filter(review => review._id !== reviewId));
      
      toast({
        title: "Success",
        description: "Review deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };



  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Reviews</h1>
          <p className="text-gray-600 mt-2">Reviews you've written for properties</p>
        </div>
        
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-300 rounded mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Reviews</h1>
          <p className="text-gray-600 mt-2">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} written
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <span className="text-lg font-semibold">{reviews.length}</span>
        </div>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No reviews yet</h2>
            <p className="text-gray-600 mb-6">
              Start reviewing properties you've visited or are interested in
            </p>
            <Button onClick={() => window.location.href = '/all-properties'}>
              Browse Properties
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {reviews.length}
                </div>
                <div className="text-sm text-gray-600">Total Reviews</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {reviews.length}
                </div>
                <div className="text-sm text-gray-600">Properties Reviewed</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {reviews.length > 0 ? new Date().getFullYear() - new Date(Math.min(...reviews.map(r => new Date(r.createdAt).getTime()))).getFullYear() + 1 : 0}
                </div>
                <div className="text-sm text-gray-600">Years Active</div>
              </CardContent>
            </Card>
          </div>

          {/* Reviews List */}
          <div className="grid gap-6">
            {reviews.map((review) => (
              <Card key={review._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    {/* Property Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      <img 
                        src={review.propertyImage || `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=400&fit=crop`}
                        alt={review.propertyTitle}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=400&fit=crop`;
                        }}
                      />
                    </div>
                    
                    {/* Review Content */}
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{review.propertyTitle}</CardTitle>
                      <CardDescription className="space-y-2">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>Agent: {review.propertyAgentName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardDescription>
                    </div>
                    
                    {/* Delete Button */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deletingId === review._id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Review</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this review? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteReview(review._id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deletingId === review._id ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 leading-relaxed">
                      "{review.reviewText}"
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                    <span>Review ID: {review._id}</span>
                    <span>
                      {new Date(review.createdAt).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReviews;