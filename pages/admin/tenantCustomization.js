// pages/admin/tenantCustomization.js

import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function TenantCustomization() {
  const [logoUrl, setLogoUrl] = useState('');
  const [theme, setTheme] = useState('light');

  const handleSave = async () => {
    try {
      const tenantDocRef = doc(db, 'tenants', 'placeholder-tenant-id'); // Replace with actual tenantId logic
      await updateDoc(tenantDocRef, { logoUrl, theme });
      alert('Tenant settings updated successfully!');
    } catch (error) {
      console.error('Error updating tenant settings:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tenant Customization</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Logo URL</label>
          <Input
            type="text"
            placeholder="Enter logo URL"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Theme</label>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
