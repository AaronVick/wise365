import React from 'react';
import AdminLayout from '@/components/AdminLayout'; // Assuming this is your admin layout component
import SeedButton from '@/components/seedButton'; // Adjust the path if SeedButton is in a different directory

export default function ImportPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Import Data to Firebase</h1>
        <div className="bg-white shadow rounded p-6">
          <p className="text-gray-600 mb-4">
            Click the button below to import the funnel data into Firebase. This action cannot be undone.
          </p>
          <SeedButton />
        </div>
      </div>
    </AdminLayout>
  );
}
