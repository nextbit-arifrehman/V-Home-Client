import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Heart, ArrowRight, Check, Clock } from "lucide-react";
import { useState } from "react";
import api from "../lib/api";
import Swal from "sweetalert2";
import { useAuth } from "../contexts/AuthContext";

export default function PropertyCard({ property, onAddToWishlist, showWishlistButton = true }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { user } = useAuth();

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if user is logged in
    if (!user) {
      Swal.fire({
        title: 'Login Required',
        text: 'Please log in to add properties to your wishlist',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        confirmButtonText: 'Login Now',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/login';
        }
      });
      return;
    }
    
    try {
      if (isWishlisted) {
        // Remove from wishlist - not implemented in this component
        return;
      } else {
        // Add to wishlist
        await api.post('/api/wishlist', {
          propertyId: property._id || property.id
        });
        
        setIsWishlisted(true);
        Swal.fire({
          title: 'Added to Wishlist!',
          text: 'Property has been added to your wishlist',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        if (onAddToWishlist) {
          onAddToWishlist(property);
        }
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      if (error.response?.status === 401) {
        Swal.fire({
          title: 'Login Required',
          text: 'Please log in to add properties to your wishlist',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3b82f6',
          confirmButtonText: 'Login Now',
          cancelButtonText: 'Cancel'
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = '/login';
          }
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: 'Failed to add property to wishlist',
          icon: 'error'
        });
      }
    }
  };

  const getVerificationBadge = () => {
    switch (property.verificationStatus) {
      case "verified":
        return (
          <Badge className="bg-secondary text-white">
            <Check className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-accent text-white border-accent">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="relative">
        <img 
          src={property.images?.[0] || "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"} 
          alt={property.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        <div className="absolute top-4 left-4">
          {getVerificationBadge()}
        </div>
        
        {showWishlistButton && (
          <div className="absolute top-4 right-4">
            <Button
              size="icon"
              variant="secondary"
              className="w-10 h-10 bg-white/95 shadow-lg hover:bg-white hover:text-red-500 transition-all duration-200 border border-gray-200 hover:border-red-300"
              onClick={handleWishlist}
              disabled={isWishlisted}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'}`} />
            </Button>
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-primary">
            {property.priceRange || `$${property.minPrice?.toLocaleString()} - $${property.maxPrice?.toLocaleString()}`}
          </span>
        </div>
        
        <h3 className="font-semibold text-lg text-neutral-900 mb-2 line-clamp-1">
          {property.title}
        </h3>
        
        <p className="text-neutral-600 mb-4 flex items-center">
          <MapPin className="w-4 h-4 mr-2 text-neutral-400" />
          <span className="truncate">{property.location}</span>
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={property.agentImage} alt={property.agentName} />
              <AvatarFallback>
                {property.agentName?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-neutral-600 truncate">
              {property.agentName}
            </span>
          </div>
          
          <Link to={`/property/${property._id || property.id}`}>
            <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700">
              View Details
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
