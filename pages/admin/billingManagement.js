// pages/admin/billingManagement.js

import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';

const BillingManagement = ({ tenantId }) => {
  const [tenant, setTenant] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenantData();
    fetchBillingHistory();
  }, [tenantId]);

  const fetchTenantData = async () => {
    try {
      const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
      if (tenantDoc.exists()) {
        setTenant(tenantDoc.data());
      }
    } catch (error) {
      console.error('Error fetching tenant data:', error);
    }
  };

  const fetchBillingHistory = async () => {
    try {
      // This would typically query a 'billingHistory' collection
      // For now, we'll use placeholder data
      setBillingHistory([
        {
          id: 1,
          date: '2025-01-15',
          amount: 299.00,
          status: 'paid',
          description: 'Monthly Subscription - Enterprise Plan'
        },
        {
          id: 2,
          date: '2024-12-15',
          amount: 299.00,
          status: 'paid',
          description: 'Monthly Subscription - Enterprise Plan'
        }
      ]);
    } catch (error) {
      console.error('Error fetching billing history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (newPlan) => {
    // TODO: Integrate with Stripe
    // 1. Create Stripe Checkout Session
    // 2. Redirect to Stripe Checkout
    // 3. Handle webhook for successful payment
    // 4. Update Firebase with new subscription status
    console.log('Updating subscription to:', newPlan);
  };

  const handleUpdatePaymentMethod = () => {
    // TODO: Integrate with Stripe
    // 1. Create Stripe Setup Intent
    // 2. Redirect to Stripe Payment Method update page
    console.log('Updating payment method');
  };

  const subscriptionPlans = [
    {
      name: 'Starter',
      price: 99,
      features: ['Up to 5 users', 'Basic support', '2 AI agents'],
      recommended: false
    },
    {
      name: 'Professional',
      price: 199,
      features: ['Up to 20 users', 'Priority support', '5 AI agents', 'Advanced analytics'],
      recommended: true
    },
    {
      name: 'Enterprise',
      price: 299,
      features: ['Unlimited users', '24/7 support', 'Unlimited AI agents', 'Custom integrations'],
      recommended: false
    }
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
          <CardDescription>
            Manage your subscription and billing details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Enterprise Plan</h3>
              <p className="text-sm text-gray-500">Next billing date: February 15, 2025</p>
            </div>
            <Badge variant={tenant?.subscriptionStatus === 'active' ? 'success' : 'destructive'}>
              {tenant?.subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CreditCard className="h-6 w-6" />
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-gray-500">Expires 12/25</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleUpdatePaymentMethod}>
              Update Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Choose the plan that best fits your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan) => (
              <Card key={plan.name} className={plan.recommended ? 'border-primary' : ''}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>${plan.price}/month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-4"
                    variant={plan.recommended ? 'default' : 'outline'}
                    onClick={() => handleUpdateSubscription(plan.name)}
                  >
                    Select Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View your past invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billingHistory.map((invoice) => (
              <div key={invoice.id} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{invoice.description}</p>
                  <p className="text-sm text-gray-500">{invoice.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">${invoice.amount.toFixed(2)}</span>
                  <Badge variant={invoice.status === 'paid' ? 'success' : 'destructive'}>
                    {invoice.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
          <CardDescription>Current billing cycle usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span>Active Users</span>
                <span>15/20</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span>AI Agent Usage</span>
                <span>4/5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingManagement;