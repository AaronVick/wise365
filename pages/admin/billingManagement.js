// pages/admin/billingManagement.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Search } from 'lucide-react';

export default function BillingManagement() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
        const tenantsData = tenantsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Set default values for new fields if they don't exist
          subscriptionPlan: doc.data().subscriptionPlan || 'Free',
          subscriptionStatus: doc.data().subscriptionStatus || 'inactive',
          billingCycle: doc.data().billingCycle || 'monthly',
          nextBillingDate: doc.data().nextBillingDate || null,
        }));
        setTenants(tenantsData);
      } catch (error) {
        console.error('Error fetching tenants:', error);
        setError('Failed to load tenant billing information');
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const filteredTenants = tenants.filter(tenant => {
    const matchesFilter = filter === 'all' || tenant.subscriptionStatus === filter;
    const matchesSearch = searchQuery === '' || 
      tenant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleViewBillingDetails = (tenantId) => {
    // TODO: Implement billing details view
    console.log('View billing details for tenant:', tenantId);
  };

  const handleUpdateSubscription = (tenantId) => {
    // TODO: Implement Stripe integration
    console.log('Update subscription for tenant:', tenantId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-gray-500">Loading billing information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Billing Overview</CardTitle>
          <CardDescription>Manage tenant subscriptions and billing</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tenants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tenants List */}
          <div className="space-y-4">
            {filteredTenants.length > 0 ? (
              filteredTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <CreditCard className="h-8 w-8 text-gray-400" />
                    <div>
                      <h3 className="font-medium">{tenant.name || 'Unnamed Tenant'}</h3>
                      <p className="text-sm text-gray-500">ID: {tenant.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right mr-4">
                      <p className="font-medium">{tenant.subscriptionPlan}</p>
                      <p className="text-sm text-gray-500">
                        {tenant.billingCycle === 'monthly' ? 'Monthly' : 'Annual'} billing
                      </p>
                    </div>
                    
                    <Badge className="mr-4" variant={
                      tenant.subscriptionStatus === 'active' ? 'success' :
                      tenant.subscriptionStatus === 'trial' ? 'warning' :
                      'destructive'
                    }>
                      {tenant.subscriptionStatus.charAt(0).toUpperCase() + 
                       tenant.subscriptionStatus.slice(1)}
                    </Badge>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleViewBillingDetails(tenant.id)}
                      >
                        View Details
                      </Button>
                      <Button 
                        onClick={() => handleUpdateSubscription(tenant.id)}
                      >
                        Update Plan
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : searchQuery || filter !== 'all' ? (
              <div className="text-center py-8 text-gray-500">
                No tenants found matching your filters
              </div>
            ) : (
              <div className="text-center py-8">
                <h3 className="text-lg font-medium mb-2">No Tenants Found</h3>
                <p className="text-gray-500 mb-4">
                  Start by adding tenants to your system or check your database configuration.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Tenants</p>
              <p className="text-2xl font-bold">{tenants.length}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Active Subscriptions</p>
              <p className="text-2xl font-bold">
                {tenants.filter(t => t.subscriptionStatus === 'active').length}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Trial Accounts</p>
              <p className="text-2xl font-bold">
                {tenants.filter(t => t.subscriptionStatus === 'trial').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}