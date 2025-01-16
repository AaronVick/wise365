// pages/admin/manageAdmins.js

import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const adminsList = usersSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((user) => user.SystemAdmin);
        setAdmins(adminsList);
      } catch (error) {
        console.error('Error fetching admins:', error);
        setError('Failed to load admins.');
      }
    };

    fetchAdmins();
  }, []);

  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword) {
      setError('Please enter an email address and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 1. Create Firebase Authentication user
      const userCredential = await createUserWithEmailAndPassword(auth, newAdminEmail, newAdminPassword);
      const user = userCredential.user;

      // 2. Add admin to Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const adminData = {
        email: newAdminEmail,
        name: '', // Placeholder for name, can be updated later
        uid: user.uid,
        SystemAdmin: true,
        createdAt: new Date(),
        profilePicture: '',
      };

      await setDoc(userDocRef, adminData);

      setAdmins((prev) => [...prev, adminData]);
      setNewAdminEmail('');
      setNewAdminPassword('');
    } catch (error) {
      console.error('Error adding admin:', error);
      setError('Failed to add admin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAdmin = async (adminId) => {
    setIsLoading(true);
    try {
      const adminRef = doc(db, 'users', adminId);
      await updateDoc(adminRef, { SystemAdmin: false });
      setAdmins((prev) => prev.filter((admin) => admin.uid !== adminId));
    } catch (error) {
      console.error('Error removing admin:', error);
      setError('Failed to remove admin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Manage Admins</h2>

      {/* Add Admin Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Add New Admin</h3>
        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Enter admin email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Enter admin password"
            value={newAdminPassword}
            onChange={(e) => setNewAdminPassword(e.target.value)}
          />
          <Button onClick={handleAddAdmin} disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Admin'}
          </Button>
        </div>
        {error && <Alert variant="destructive">{error}</Alert>}
      </div>

      {/* Admin List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Existing Admins</h3>
        {admins.length > 0 ? (
          <ul>
            {admins.map((admin) => (
              <li
                key={admin.uid}
                className="flex items-center justify-between border-b py-2"
              >
                <div>
                  <p>{admin.email}</p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => handleRemoveAdmin(admin.uid)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Removing...' : 'Remove'}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No admins found.</p>
        )}
      </div>
    </div>
  );
}
