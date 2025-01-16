// pages/admin/teamManagement.js

import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsSnapshot = await getDocs(collection(db, 'teams'));
        const teamsData = teamsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTeams(teamsData);
      } catch (error) {
        console.error('Error fetching teams:', error);
      }
    };

    fetchTeams();
  }, []);

  const handleRoleChange = async (teamId, userId, newRole) => {
    try {
      const teamDocRef = doc(db, 'teams', teamId);
      const team = teams.find((t) => t.id === teamId);
      const updatedMembers = team.members.map((member) =>
        member.id === userId ? { ...member, role: newRole } : member
      );

      await updateDoc(teamDocRef, { members: updatedMembers });

      // Update the state for immediate feedback
      setTeams((prevTeams) =>
        prevTeams.map((t) =>
          t.id === teamId ? { ...t, members: updatedMembers } : t
        )
      );
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Team Management</h2>
      <div className="space-y-4">
        {teams.map((team) => (
          <div key={team.id} className="p-4 bg-white shadow rounded">
            <h3 className="text-lg font-semibold">{team.name}</h3>
            <p>Created At: {team.createdAt?.toDate().toLocaleDateString()}</p>
            <div className="mt-4 space-y-2">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div>
                    <p>{member.name}</p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(team.id, member.id, e.target.value)
                    }
                    className="p-2 border rounded"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Member">Member</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
