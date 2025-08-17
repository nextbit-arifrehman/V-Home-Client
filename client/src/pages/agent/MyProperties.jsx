import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Home, MapPin, DollarSign, Edit, Trash2, Plus, Check, Clock, XCircle, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import apiClient from "../../lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const updatePropertySchema = z.object({
  title: z.string().min(1, "Property title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(1, "Location is required"),
  minPrice: z.string().min(1, "Minimum price is required"),
  maxPrice: z.string().min(1, "Maximum price is required"),
});

export default function MyProperties() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingProperty, setEditingProperty] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch agent's properties
  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ['agent-properties', user?.uid],
    queryFn: async () => {
      const response = await apiClient.get('/api/properties/agent/my-properties');
      return response.data.properties || response.data || [];
    },
    enabled: !!user?.uid,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always fetch fresh data
  });

  // Fetch sold properties to get sold prices
  const { data: soldProperties = [] } = useQuery({
    queryKey: ['agent-sold-properties', user?.uid],
    queryFn: async () => {
      const response = await apiClient.get('/api/offers/agent/sold-properties');
      return response.data.soldProperties || response.data || [];
    },
    enabled: !!user?.uid,
  });

  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId) => {
      const response = await apiClient.delete(`/api/properties/${propertyId}`);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Property Deleted",
        description: "Property has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['agent-properties', user?.uid] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete property.",
        variant: "destructive",
      });
    }
  });

  // Update property mutation
  const updatePropertyMutation = useMutation({
    mutationFn: async ({ propertyId, formData }) => {
      console.log('🔄 Updating property:', propertyId);
      const response = await apiClient.patch(`/api/properties/${propertyId}`, formData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // Increase timeout to 30 seconds
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Property Updated",
        description: "Property has been successfully updated.",
      });
      // Force refetch of agent properties
      queryClient.invalidateQueries({ queryKey: ['agent-properties', user?.uid] });
      queryClient.refetchQueries({ queryKey: ['agent-properties', user?.uid] });
      // Also invalidate public properties to refresh All Properties page
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties/public'] });
      setIsDialogOpen(false);
      setEditingProperty(null);
      setNewImages([]);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update property.",
        variant: "destructive",
      });
    }
  });

  const form = useForm({
    resolver: zodResolver(updatePropertySchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      minPrice: "",
      maxPrice: "",
    },
  });

  const handleEdit = (property) => {
    setEditingProperty(property);
    
    // Safely extract minPrice and maxPrice from property
    const minPrice = property.minPrice || property.priceMin || 0;
    const maxPrice = property.maxPrice || property.priceMax || 0;
    
    form.reset({
      title: property.title || "",
      description: property.description || "",
      location: property.location || "",
      minPrice: minPrice.toString(),
      maxPrice: maxPrice.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (propertyId) => {
    if (window.confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      deletePropertyMutation.mutate(propertyId);
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 5) {
      toast({
        title: "Too Many Images",
        description: "You can upload a maximum of 5 images.",
        variant: "destructive",
      });
      return;
    }
    setNewImages(files);
  };

  const removeNewImage = (index) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    const minPrice = parseFloat(data.minPrice) || 0;
    const maxPrice = parseFloat(data.maxPrice) || 0;

    // Allow any positive price range
    if (minPrice < 0 || maxPrice < 0) {
      toast({
        title: "Invalid Price",
        description: "Prices must be positive numbers.",
        variant: "destructive",
      });
      return;
    }

    if (minPrice > 0 && maxPrice > 0 && minPrice >= maxPrice) {
      toast({
        title: "Invalid Price Range",
        description: "Maximum price must be greater than minimum price.",
        variant: "destructive",
      });
      return;
    }

    const updateData = {
      title: data.title,
      description: data.description,
      location: data.location,
      minPrice: minPrice,
      maxPrice: maxPrice,
      // Generate price range string for frontend display
      priceRange: minPrice > 0 && maxPrice > 0 ? 
        `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}` : 
        minPrice > 0 ? `From ${formatCurrency(minPrice)}` :
        maxPrice > 0 ? `Up to ${formatCurrency(maxPrice)}` : 
        "Price on request"
    };

    console.log('📤 Sending update data:', updateData);

    updatePropertyMutation.mutate({
      propertyId: editingProperty._id || editingProperty.id,
      formData: updateData
    });
  };

  const getStatusBadge = (property) => {
    // If property is sold, show sold status regardless of verification status
    if (property.status === 'sold') {
      return (
        <Badge className="bg-green-600 text-white">
          <DollarSign className="w-3 h-3 mr-1" />
          SOLD
        </Badge>
      );
    }
    
    // Otherwise show verification status
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
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-red-500 mb-4">Failed to load properties</p>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-inter font-bold text-3xl md:text-4xl text-neutral-900 mb-2">
              My Properties
            </h1>
            <p className="text-lg text-neutral-600">
              Manage your property listings
            </p>
          </div>
          
          <Link to="/dashboard/agent/add-property">
            <Button className="bg-primary hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </Link>
        </div>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 sm:p-6">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Home className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Properties Listed</h3>
              <p className="text-neutral-600 mb-6">
                You haven't added any properties yet. Start by adding your first property listing.
              </p>
              <Link to="/dashboard/agent/add-property">
                <Button className="bg-primary hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Property
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {properties.map((property) => (
              <Card key={property.id || property._id?.toString() || Math.random()} className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                <div className="relative">
                  <img 
                    src={property.images?.[0] || "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"} 
                    alt={property.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  <div className="absolute top-4 left-4">
                    {getStatusBadge(property)}
                  </div>
                </div>
                
                <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                    <span className="text-lg sm:text-xl font-bold text-primary break-words">
                      {(() => {
                        // Check if property is sold and get sold price from soldProperties
                        if (property.status === "sold") {
                          const soldProperty = soldProperties.find(sp => 
                            sp.property?.id === property.id || 
                            sp.property?._id === property._id ||
                            sp.propertyId === property.id ||
                            sp.propertyId === property._id
                          );
                          if (soldProperty?.offerAmount || soldProperty?.offeredAmount) {
                            const soldPrice = soldProperty.offerAmount || soldProperty.offeredAmount;
                            return `Sold for ${formatCurrency(soldPrice)}`;
                          }
                        }
                        
                        // Show price range if available and valid
                        if (property.priceRange && property.priceRange !== "undefined" && !property.priceRange.includes("NaN") && !property.priceRange.includes("$0")) {
                          return property.priceRange;
                        }
                        
                        // Show min-max if both are valid numbers
                        if (property.minPrice && property.maxPrice && property.minPrice > 0 && property.maxPrice > 0) {
                          return `${formatCurrency(property.minPrice)} - ${formatCurrency(property.maxPrice)}`;
                        }
                        
                        // If we have just one valid price, show it
                        if (property.minPrice && property.minPrice > 0) {
                          return `From ${formatCurrency(property.minPrice)}`;
                        }
                        if (property.maxPrice && property.maxPrice > 0) {
                          return `Up to ${formatCurrency(property.maxPrice)}`;
                        }
                        
                        // Fallback
                        return "Price on request";
                      })()}
                    </span>
                    <span className="text-xs text-neutral-500 whitespace-nowrap">
                      Listed {new Date(property.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-lg text-neutral-900 mb-2 line-clamp-2">
                    {property.title}
                  </h3>
                  
                  <p className="text-neutral-600 mb-4 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-neutral-400 flex-shrink-0" />
                    <span className="truncate text-sm sm:text-base">{property.location}</span>
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-200 mt-auto">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={property.agentImage} alt={property.agentName} />
                        <AvatarFallback>
                          {property.agentName?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-neutral-600 truncate">
                        {property.agentName}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    {property.verificationStatus === "pending" && property.status !== "sold" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(property)}
                        className="flex-1 min-w-0"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                    )}
                    
                    {property.verificationStatus === "verified" && property.status !== "sold" && (
                      <div className="flex-1 text-center py-2 text-xs sm:text-sm text-green-600 font-medium">
                        Property is verified - no edits allowed
                      </div>
                    )}
                    
                    {property.verificationStatus === "rejected" && property.status !== "sold" && (
                      <div className="flex-1 text-center py-2 text-xs sm:text-sm text-red-600 font-medium">
                        Property was rejected - contact admin
                      </div>
                    )}
                    
                    {property.status === "sold" && (
                      <div className="flex-1 text-center py-2 text-xs sm:text-sm text-green-600 font-medium">
                        Sold on {new Date(property.updatedAt || property.createdAt).toLocaleDateString()}
                      </div>
                    )}
                    
                    {property.status !== "sold" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(property.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 sm:w-auto w-full"
                        disabled={deletePropertyMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="sm:hidden ml-1">Delete</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Statistics */}
        {properties.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Property Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{properties.length}</div>
                  <div className="text-sm text-blue-700">Total Properties</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {properties.filter(p => p.verificationStatus === "verified").length}
                  </div>
                  <div className="text-sm text-green-700">Verified</div>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {properties.filter(p => p.verificationStatus === "pending").length}
                  </div>
                  <div className="text-sm text-yellow-700">Pending</div>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {properties.filter(p => p.verificationStatus === "rejected").length}
                  </div>
                  <div className="text-sm text-red-700">Rejected</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Property Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Property</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter property title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the property..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Price ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="1" 
                            placeholder="Enter minimum price"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Price ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="1" 
                            placeholder="Enter maximum price"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* New Images Upload */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Update Property Images (Optional)
                  </label>
                  <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="edit-image-upload"
                    />
                    <label htmlFor="edit-image-upload" className="cursor-pointer">
                      <Upload className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
                      <p className="text-neutral-600 text-sm">Click to upload new images</p>
                    </label>
                  </div>

                  {newImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {newImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`New ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute -top-1 -right-1 w-5 h-5"
                            onClick={() => removeNewImage(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-blue-700"
                    disabled={updatePropertyMutation.isPending}
                  >
                    {updatePropertyMutation.isPending ? "Updating..." : "Update Property"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
