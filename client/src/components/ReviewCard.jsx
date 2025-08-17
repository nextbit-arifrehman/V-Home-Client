import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, Trash2 } from "lucide-react";

export default function ReviewCard({ review, onDelete, showDeleteButton = false }) {
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-accent fill-accent' : 'text-neutral-300'}`}
      />
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="group hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30 border-2 border-transparent hover:border-blue-200/50 h-full">
      <CardContent className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center bg-yellow-50 px-2 sm:px-3 py-1 sm:py-2 rounded-full">
            <div className="flex mr-1 sm:mr-2">
              {renderStars(review.rating)}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-neutral-700">{review.rating}.0</span>
          </div>
          
          {showDeleteButton && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(review.id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <blockquote className="text-neutral-700 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base lg:text-lg italic border-l-4 border-blue-500 pl-3 sm:pl-4 bg-blue-50/30 py-2 sm:py-3 rounded-r-lg flex-grow">
          "{review.description}"
        </blockquote>
        
        <div className="bg-white/60 p-3 sm:p-4 rounded-lg border border-gray-100 mt-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center min-w-0 flex-1">
              <Avatar className="w-8 h-8 sm:w-10 lg:w-12 sm:h-10 lg:h-12 mr-2 sm:mr-3 lg:mr-4 ring-2 ring-blue-200 flex-shrink-0">
                <AvatarImage src={review.userImage} alt={review.userName} />
                <AvatarFallback className="bg-blue-600 text-white font-bold text-xs sm:text-sm">
                  {review.userName?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-neutral-900 text-sm sm:text-base lg:text-lg truncate">{review.userName}</div>
                <div className="text-xs sm:text-sm text-blue-600 font-medium truncate">{review.propertyTitle}</div>
              </div>
            </div>
          </div>
          
          {review.createdAt && (
            <div className="text-xs text-neutral-500 bg-gray-100 px-2 py-1 rounded w-fit ml-auto">
              {formatDate(review.createdAt)}
            </div>
          )}
        </div>
        
        {review.agentName && (
          <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-neutral-600 bg-green-50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg border border-green-200">
            <span className="font-medium">Agent:</span> <span className="text-green-700 font-semibold">{review.agentName}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
