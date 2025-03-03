// hooks/useFirebaseData.js
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import firebaseService from '../lib/services/firebaseService';

export function useFirebaseData(collectionName, queryParams = [], dependencies = []) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Use direct Firebase query
        const collectionRef = collection(db, collectionName);
        
        // Build query with provided parameters
        let queryRef = collectionRef;
        if (queryParams && queryParams.length > 0) {
          queryRef = query(collectionRef, ...queryParams);
        }

        const querySnapshot = await getDocs(queryRef);
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setData(items);
      } catch (err) {
        console.error(`Error fetching ${collectionName}:`, err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, isLoading, error };
}

export function useGoals(authenticationID) {
  return useFirebaseData(
    'goals',
    [where('userId', '==', authenticationID)],
    [authenticationID]
  );
}

export function useRecentActivity(userId) {
  return useFirebaseData(
    'conversations',
    [
      where('participants', 'array-contains', userId),
      orderBy('lastUpdatedAt', 'desc'),
      limit(10)
    ],
    [userId]
  );
}

export function useResources(teamId) {
  return useFirebaseData(
    'resources',
    teamId ? [where('teamId', '==', teamId)] : [],
    [teamId]
  );
}