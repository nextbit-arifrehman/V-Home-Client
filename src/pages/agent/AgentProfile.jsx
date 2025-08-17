import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { User, Mail, Calendar, Building } from 'lucide-react';

const AgentProfile = () => {
  const { user } = useAuth();

  const getUserInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getMemberSinceDate = () => {
    if (user?.metadata?.creationTime) {
      return new Date(user.metadata.creationTime).toLocaleDateString();
    }
    if (user?.createdAt) {
      return new Date(user.createdAt).toLocaleDateString();
    }
    return 'N/A';
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-inter font-bold text-3xl md:text-4xl text-neutral-900 mb-2">
            Agent Profile
          </h1>
          <p className="text-lg text-neutral-600">
            Your account information
          </p>
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user?.photoURL} alt={user?.displayName} />
                  <AvatarFallback className="text-2xl">
                    {getUserInitials(user?.displayName || user?.email)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <CardTitle className="text-xl">
                {user?.displayName || user?.email?.split('@')[0] || 'Agent'}
              </CardTitle>
              
              <div className="flex justify-center">
                <Badge variant="default" className="bg-blue-600">
                  Real Estate Agent
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Display Name</p>
                  <p className="font-medium">{user?.displayName || 'Not set'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium">Real Estate Agent</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium">{getMemberSinceDate()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentProfile;