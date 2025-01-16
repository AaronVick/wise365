// pages/admin/tenantManagement.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Users,
  Settings,
  CreditCard,
  BarChart3,
  PlusCircle
} from 'lucide-react';

const debug = (area, message, data = '') => {
  console.log(`[Tenant Management][${area}] ${message}`, data ? JSON.stringify(data) : '');
};

export default function TenantManagement() {
  // State Management
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewTenantForm, setShowNewTenantForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // New Tenant Form State
  const [newTenant, setNewTenant] = useState({
    name: '',
    industry: '',
    primaryContact: '',
    email: '',
    subscriptionPlan: 'trial',
    maxUsers: 5
  });

  // Fetch Tenants
  useEffect(() => {
    const fetchTenants = async () => {
      debug('Data', 'Fetching tenants');
      setLoading(true);
      try {
        const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
        const tenantsData = tenantsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          subscriptionStatus: doc.data().subscriptionStatus || 'inactive',
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));
        debug('Data', 'Fetched tenants', tenantsData);
        setTenants(tenantsData);
      } catch (err) {
        debug('Error', 'Failed to fetch tenants', err);
        setError('Failed to load tenants');
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  // Handle New Tenant Creation
  const handleCreateTenant = async (e) => {
    e.preventDefault();
    debug('Action', 'Creating new tenant', newTenant);
    setLoading(true);
    try {
      const tenantRef = doc(collection(db, 'tenants'));
      const tenantData = {
        ...newTenant,
        id: tenantRef.id,
        createdAt: serverTimestamp(),
        status: 'active',
        subscriptionStatus: 'trial',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        settings: {
          theme: 'light',
          features: {
            chat: true,
            analytics: false,
            customization: false
          }
        },
        teams: [],
        members: []
      };

      await setDoc(tenantRef, tenantData);
      debug('Success', 'Tenant created', tenantData);
      
      setTenants(prev => [...prev, { ...tenantData, id: tenantRef.id }]);
      setShowNewTenantForm(false);
      setNewTenant({
        name: '',
        industry: '',
        primaryContact: '',
        email: '',
        subscriptionPlan: 'trial',
        maxUsers: 5
      });
    } catch (err) {
      debug('Error', 'Failed to create tenant', err);
      setError('Failed to create tenant: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Tenant Status Update
  const handleStatusUpdate = async (tenantId, newStatus) => {
    debug('Action', 'Updating tenant status', { tenantId, newStatus });
    try {
      const tenantRef = doc(db, 'tenants', tenantId);
      await updateDoc(tenantRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      setTenants(prev => prev.map(tenant => 
        tenant.id === tenantId ? { ...tenant, status: newStatus } : tenant
      ));

      debug('Success', 'Status updated', { tenantId, newStatus });
    } catch (err) {
      debug('Error', 'Failed to update status', err);
      setError('Failed to update tenant status');
    }
  };

  // Render New Tenant Form
  const renderNewTenantForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Create New Tenant</CardTitle>
        <CardDescription>Add a new organization to the system</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateTenant} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Organization Name</label>
            <Input
              required
              value={newTenant.name}
              onChange={(e) => setNewTenant(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter organization name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Industry</label>
            <Input
              value={newTenant.industry}
              onChange={(e) => setNewTenant(prev => ({ ...prev, industry: e.target.value }))}
              placeholder="Enter industry"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Primary Contact</label>
            <Input
              required
              value={newTenant.primaryContact}
              onChange={(e) => setNewTenant(prev => ({ ...prev, primaryContact: e.target.value }))}
              placeholder="Enter primary contact name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contact Email</label>
            <Input
              required
              type="email"
              value={newTenant.email}
              onChange={(e) => setNewTenant(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter contact email"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setShowNewTenantForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Tenant'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  // Render Tenant List
  const renderTenantList = () => (
    <div className="space-y-4">
      {tenants.map((tenant) => (
        <Card 
          key={tenant.id} 
          className={`hover:shadow-md transition-shadow ${
            selectedTenant?.id === tenant.id ? 'border-primary' : ''
          }`}
        >
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <Building2 className="h-8 w-8 text-gray-400" />
              <div>
                <h3 className="font-medium">{tenant.name}</h3>
                <p className="text-sm text-gray-500">Created: {new Date(tenant.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant={
                tenant.subscriptionStatus === 'active' ? 'success' :
                tenant.subscriptionStatus === 'trial' ? 'warning' : 'destructive'
              }>
                {tenant.subscriptionStatus}
              </Badge>

              <Button 
                variant="outline"
                onClick={() => setSelectedTenant(tenant)}
              >
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render Selected Tenant Details
  const renderTenantDetails = () => {
    if (!selectedTenant) return null;

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{selectedTenant.name}</CardTitle>
            <Button 
              variant="ghost"
              onClick={() => setSelectedTenant(null)}
            >
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedTenant.members?.length || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Teams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedTenant.teams?.length || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={
                      selectedTenant.status === 'active' ? 'success' :
                      selectedTenant.status === 'trial' ? 'warning' : 'destructive'
                    }>
                      {selectedTenant.status}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTenant.members?.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedTenant.members.map((member, index) => (
                        <li key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                          <span>{member.email}</span>
                          <Badge>{member.role}</Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No members yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Tenant Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Theme</label>
                      <select 
                        className="w-full p-2 border rounded"
                        value={selectedTenant.settings?.theme || 'light'}
                        onChange={async (e) => {
                          try {
                            await updateDoc(doc(db, 'tenants', selectedTenant.id), {
                              'settings.theme': e.target.value
                            });
                            setSelectedTenant(prev => ({
                              ...prev,
                              settings: { ...prev.settings, theme: e.target.value }
                            }));
                          } catch (err) {
                            setError('Failed to update theme');
                          }
                        }}
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Features</label>
                      {Object.entries(selectedTenant.settings?.features || {}).map(([feature, enabled]) => (
                        <div key={feature} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={async (e) => {
                              try {
                                await updateDoc(doc(db, 'tenants', selectedTenant.id), {
                                  [`settings.features.${feature}`]: e.target.checked
                                });
                                setSelectedTenant(prev => ({
                                  ...prev,
                                  settings: {
                                    ...prev.settings,
                                    features: {
                                      ...prev.settings.features,
                                      [feature]: e.target.checked
                                    }
                                  }
                                }));
                              } catch (err) {
                                setError(`Failed to update ${feature} feature`);
                              }
                            }}
                          />
                          <span className="capitalize">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing">
              <Card>
                <CardHeader>
                  <CardTitle>Billing Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Subscription Plan</label>
                      <p className="text-lg font-medium">{selectedTenant.subscriptionPlan || 'Free'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <Badge variant={
                        selectedTenant.subscriptionStatus === 'active' ? 'success' :
                        selectedTenant.subscriptionStatus === 'trial' ? 'warning' : 'destructive'
                      }>
                        {selectedTenant.subscriptionStatus}
                      </Badge>
                    </div>

                    {selectedTenant.subscriptionStatus === 'trial' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Trial Ends</label>
                        <p>{new Date(selectedTenant.trialEndsAt).toLocaleDateString()}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-1">Billing Cycle</label>
                      <p>{selectedTenant.billingCycle || 'Monthly'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Active Users</label>
                      <p>{selectedTenant.members?.length || 0} / {selectedTenant.maxUsers || 'Unlimited'}</p>
                    </div>

                    <div className="pt-4">
                      <Button
                        onClick={() => {
                          // TODO: Implement Stripe integration
                          debug('Action', 'Opening billing portal', selectedTenant.id);
                        }}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Manage Subscription
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  if (loading && !tenants.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-gray-500">Loading tenants...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Tenant Management</h2>
          <p className="text-gray-500">Manage your organization tenants</p>
        </div>
        {!showNewTenantForm && (
          <Button onClick={() => setShowNewTenantForm(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {tenants.filter(t => t.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Trial Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {tenants.filter(t => t.subscriptionStatus === 'trial').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {tenants.reduce((acc, tenant) => acc + (tenant.members?.length || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6">
        {showNewTenantForm ? renderNewTenantForm() : (
          <>
            {selectedTenant ? renderTenantDetails() : renderTenantList()}
          </>
        )}
      </div>
    </div>
  );
}