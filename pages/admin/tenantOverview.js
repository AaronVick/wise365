// pages/admin/tenantOverview.js

import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TenantOverview() {
  const [tenants, setTenants] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
        const tenantsData = tenantsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTenants(tenantsData);
      } catch (error) {
        console.error('Error fetching tenants:', error);
      }
    };

    fetchTenants();
  }, []);

  const filteredTenants = tenants.filter((tenant) => {
    if (filter === 'all') return true;
    return tenant.subscriptionStatus === filter;
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tenant Overview</h2>
      {/* Filter Controls */}
      <div className="mb-4">
        <label className="block text-sm font-medium">Filter by Subscription Status</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="canceled">Canceled</option>
        </select>
      </div>

      {/* Tenant List */}
      <div className="space-y-4">
        {filteredTenants.map((tenant) => (
          <div key={tenant.id} className="p-4 bg-white shadow rounded flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">{tenant.name}</h3>
              <p>Subscription Status: {tenant.subscriptionStatus}</p>
              <p>Created At: {tenant.createdAt?.toDate().toLocaleDateString()}</p>
            </div>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded"
              onClick={() => alert(`View Billing for Tenant: ${tenant.name}`)} // Placeholder action
            >
              View Billing
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
