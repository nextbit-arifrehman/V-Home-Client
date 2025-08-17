import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { ArrowLeft, CreditCard, MapPin, User, CheckCircle, AlertCircle, DollarSign, Calendar } from "lucide-react";
import api from "../lib/api";
import Swal from "sweetalert2";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
console.log('🔑 Frontend: Checking Stripe configuration...');
console.log('📋 STRIPE_PUBLISHABLE_KEY available:', !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
console.log('📋 Legacy VITE_STRIPE_PUBLIC_KEY available:', !!import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY;
console.log('🔑 Using Stripe key:', stripePublishableKey ? `${stripePublishableKey.substring(0, 7)}...${stripePublishableKey.slice(-4)}` : 'NOT FOUND');

const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey)
  : null;

if (stripePromise) {
  console.log('✅ Stripe frontend initialized successfully');
} else {
  console.error('❌ Stripe frontend initialization failed - no publishable key found');
}

const CheckoutForm = ({ offer, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    console.log('🎯 FRONTEND STEP 1: Payment form submitted');
    e.preventDefault();

    if (!stripe || !elements) {
      console.error('❌ FRONTEND STEP 1 FAILED: Stripe or Elements not available');
      Swal.fire({
        title: 'Payment System Error',
        text: 'Payment system not properly loaded. Please refresh the page.',
        icon: 'error'
      });
      return;
    }
    console.log('✅ FRONTEND STEP 1 PASSED: Stripe and Elements ready');

    setIsProcessing(true);
    console.log('🎯 FRONTEND STEP 2: Starting payment confirmation with Stripe');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/dashboard/user/property-bought",
        },
        redirect: "if_required",
      });

      console.log('📋 FRONTEND STEP 3: Stripe payment confirmation result:', {
        error: error ? error.message : 'None',
        paymentIntentStatus: paymentIntent?.status,
        paymentIntentId: paymentIntent?.id
      });

      if (error) {
        console.error('❌ FRONTEND STEP 3 FAILED: Stripe payment error:', error);
        Swal.fire({
          title: 'Payment Failed',
          text: error.message,
          icon: 'error'
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        console.log('✅ FRONTEND STEP 3 PASSED: Payment succeeded');
        console.log('🎯 FRONTEND STEP 4: Calling backend to confirm payment');
        // Payment succeeded, update the offer status
        onSuccess(paymentIntent.id);
      } else {
        console.error('❌ FRONTEND STEP 3 FAILED: Unexpected payment state:', paymentIntent?.status);
        Swal.fire({
          title: 'Payment Status Unknown',
          text: 'Payment status could not be confirmed. Please contact support.',
          icon: 'warning'
        });
      }
    } catch (error) {
      console.error('❌ FRONTEND STEP 2/3 FAILED: Exception during payment:', error);
      Swal.fire({
        title: 'Payment Error',
        text: 'An unexpected error occurred during payment processing.',
        icon: 'error'
      });
    } finally {
      setIsProcessing(false);
      console.log('🔄 FRONTEND: Payment processing completed, form unlocked');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center mb-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mr-2" />
          <h4 className="font-medium text-blue-900">Secure Payment</h4>
        </div>
        <p className="text-sm text-blue-700">
          Your payment information is encrypted and secure. This transaction will complete your property purchase.
        </p>
      </div>
      
      <PaymentElement />
      
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        <CreditCard className="w-4 h-4 mr-2" />
        {isProcessing ? 'Processing Payment...' : `Pay $${(offer.offeredAmount || 0).toLocaleString()}`}
      </Button>
    </form>
  );
};

export default function Payment() {
  const { offerId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Check if Stripe is properly configured
  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Payment System Not Configured</h3>
            <p className="text-neutral-600 mb-4">
              Payment processing is not available at this time. Please contact support.
            </p>
            <Button onClick={() => navigate("/dashboard/user/property-bought")}>
              Back to My Offers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch offer details
  const { data: offers = [], isLoading: offerLoading, error: offerError } = useQuery({
    queryKey: ['/api/offers/my-offers'],
    queryFn: async () => {
      const response = await api.get('/api/offers/my-offers');
      return response.data;
    },
    enabled: !!user?.uid,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const offer = offers.find(o => o._id === offerId);
  


  // Create payment intent mutation
  const createPaymentIntentMutation = useMutation({
    mutationFn: async (data) => {
      console.log('🎯 FRONTEND API: Creating payment intent with data:', data);
      const response = await api.post('/api/payment/create-payment-intent', data);
      console.log('✅ FRONTEND API: Payment intent response:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ FRONTEND: Payment intent created successfully');
      console.log('🔑 Client secret received:', data.clientSecret ? 'YES' : 'NO');
      setClientSecret(data.clientSecret);
    },
    onError: (error) => {
      console.error('❌ FRONTEND: Payment intent creation failed:', error);
      console.error('Backend error details:', error.response?.data);
      Swal.fire({
        title: 'Payment Setup Failed',
        text: error.response?.data?.error || "Failed to initialize payment",
        icon: 'error'
      });
    }
  });

  // Confirm payment mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: async (data) => {
      console.log('🎯 FRONTEND API: Confirming payment with data:', data);
      const response = await api.post('/api/payment/confirm-payment', data);
      console.log('✅ FRONTEND API: Payment confirmation response:', response.data);
      return response.data;
    },
    onSuccess: () => {
      console.log('✅ FRONTEND: Payment confirmed successfully');
      setPaymentSuccess(true);
      Swal.fire({
        title: 'Payment Successful!',
        text: 'Your property purchase has been completed',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
      });
    },
    onError: (error) => {
      console.error('❌ FRONTEND: Payment confirmation failed:', error);
      console.error('Backend error details:', error.response?.data);
      Swal.fire({
        title: 'Payment Confirmation Failed',
        text: error.response?.data?.error || "Failed to confirm payment",
        icon: 'error'
      });
    }
  });

  useEffect(() => {
    if (offer && offer.status === 'accepted' && !clientSecret) {
      console.log('🚀 FRONTEND: Initializing payment for accepted offer');
      console.log('📋 Offer details:', {
        id: offer._id,
        amount: offer.offeredAmount,
        status: offer.status,
        property: offer.propertyTitle
      });
      createPaymentIntentMutation.mutate({
        amount: offer.offeredAmount,
        offerId: offer._id
      });
    }
  }, [offer, clientSecret]);

  const handlePaymentSuccess = (paymentIntentId) => {
    console.log('🎉 FRONTEND: Payment succeeded, confirming with backend');
    console.log('📋 Payment details:', {
      paymentIntentId,
      offerId: offer._id
    });
    confirmPaymentMutation.mutate({
      paymentIntentId,
      offerId: offer._id
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (offerError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">Payment Error</h3>
            <p className="text-neutral-600 mb-4">Failed to load offer details.</p>
            <Button onClick={() => navigate("/dashboard/user/property-bought")}>
              Back to My Offers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (offerLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">Offer Not Found</h3>
            <p className="text-neutral-600 mb-4">The offer you're trying to pay for doesn't exist.</p>
            <Button onClick={() => navigate("/dashboard/user/property-bought")}>
              Back to My Offers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (offer.status !== 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Payment Not Available</h3>
            <p className="text-neutral-600 mb-4">
              This offer is currently {offer.status}. Only accepted offers can be paid for.
            </p>
            <Button onClick={() => navigate("/dashboard/user/property-bought")}>
              Back to My Offers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-600 mb-2">Payment Successful!</h3>
            <p className="text-neutral-600 mb-4">
              Your property purchase has been completed. You will receive a confirmation email shortly.
            </p>
            <Button onClick={() => navigate("/dashboard/user/property-bought")}>
              View My Properties
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/user/property-bought")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Offers
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold">Complete Payment</h1>
            <p className="text-neutral-600 mt-2">Finalize your property purchase</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Property & Offer Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Property Purchase Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <img
                  src={offer.propertyImage}
                  alt={offer.propertyTitle}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-xl mb-2">{offer.propertyTitle}</h3>
                  <Badge variant="default" className="mb-2">
                    Accepted Offer
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-neutral-500" />
                    <span className="text-neutral-700">{offer.propertyLocation}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-neutral-500" />
                    <span className="text-neutral-700">Agent: {offer.agentName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral-500" />
                    <span className="text-neutral-700">
                      Purchase Date: {formatDate(offer.buyingDate)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-neutral-500" />
                    <span className="font-semibold text-green-600">
                      {formatCurrency(offer.offeredAmount)}
                    </span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Purchase Details</h4>
                <div className="space-y-1 text-sm text-green-800">
                  <div className="flex justify-between">
                    <span>Property Price:</span>
                    <span className="font-medium">{formatCurrency(offer.offeredAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fee:</span>
                    <span className="font-medium">$0</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(offer.offeredAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm offer={offer} onSuccess={handlePaymentSuccess} />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}