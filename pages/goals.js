// pages/goals.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  MoreVertical,
  PlusCircle,
  UserCircle 
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  'in_progress': 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const goalsRef = collection(db, 'goals');
        const q = query(
          goalsRef,
          where('userId', '==', localStorage.getItem('userId')),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const goalsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setGoals(goalsData);
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const updateGoalStatus = async (goalId, newStatus) => {
    try {
      const goalRef = doc(db, 'goals', goalId);
      await updateDoc(goalRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setGoals(goals.map(goal => 
        goal.id === goalId 
          ? { ...goal, status: newStatus, updatedAt: new Date() }
          : goal
      ));
    } catch (error) {
      console.error('Error updating goal status:', error);
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    return goal.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Goals & Progress</h1>
          <p className="text-gray-500">Track and manage your goals</p>
        </div>
        <Button className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          New Goal
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button 
          variant={filter === 'in_progress' ? 'default' : 'outline'}
          onClick={() => setFilter('in_progress')}
        >
          In Progress
        </Button>
        <Button 
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
        >
          Completed
        </Button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGoals.map((goal) => (
          <Card key={goal.id} className="p-6">
            <div className="flex justify-between items-start">
              <Badge className={statusColors[goal.status]}>
                {goal.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => updateGoalStatus(goal.id, 'in_progress')}>
                    Mark In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateGoalStatus(goal.id, 'completed')}>
                    Mark Complete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <h3 className="text-lg font-semibold mt-4 mb-2">{goal.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{goal.description}</p>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <UserCircle className="w-4 h-4" />
                {goal.agentId}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(goal.dueDate?.seconds * 1000).toLocaleDateString()}
              </div>
            </div>

            {goal.notes && goal.notes.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-semibold mb-2">Latest Update</h4>
                <p className="text-sm text-gray-600">{goal.notes[0]}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GoalsPage;