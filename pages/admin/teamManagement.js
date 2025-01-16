// pages/admin/teamManagement.js

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function TeamManagement({ tenantId }) {
  const [team, setTeam] = useState([]);
  const [newMember, setNewMember] = useState('');

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const docRef = doc(db, 'tenants', tenantId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTeam(docSnap.data().members || []);
        }
      } catch (error) {
        console.error('Error fetching team:', error);
      }
    };

    fetchTeam();
  }, [tenantId]);

  const addMember = async () => {
    try {
      const docRef = doc(db, 'tenants', tenantId);
      await updateDoc(docRef, { members: arrayUnion(newMember) });
      setTeam((prev) => [...prev, newMember]);
      setNewMember('');
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const removeMember = async (member) => {
    try {
      const docRef = doc(db, 'tenants', tenantId);
      await updateDoc(docRef, { members: arrayRemove(member) });
      setTeam((prev) => prev.filter((m) => m !== member));
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Team Management</h2>
      <ul className="space-y-2">
        {team.map((member) => (
          <li key={member} className="flex justify-between items-center">
            <span>{member}</span>
            <Button variant="outline" onClick={() => removeMember(member)}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Input
          type="email"
          placeholder="Enter email to add"
          value={newMember}
          onChange={(e) => setNewMember(e.target.value)}
        />
        <Button onClick={addMember} className="ml-2">
          Add Member
        </Button>
      </div>
    </div>
  );
}
