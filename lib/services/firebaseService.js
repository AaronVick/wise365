// lib/services/firebaseService.js

import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit 
} from 'firebase/firestore';


class FirebaseService {
  constructor() {
    this._collections = new Map();
    this._currentUser = null;
    this._initialized = false;
  }

  setCurrentUser(userData) {
    this._currentUser = userData;
    this._initialized = true;
  }

  // Add this method for collections access
  queryCollection(collectionName, params = {}) {
    try {
      if (!this._initialized) {
        throw new Error('Firebase service not initialized');
      }

      const queryParams = {
        where: [],
        orderBy: null,
        limit: null,
        ...params
      };

      return this.query(collectionName, queryParams);
    } catch (error) {
      console.error('Error in queryCollection:', error);
      throw error;
    }
  }

   // Add specific method for funnel data
   async getFunnelData(userId, funnelName) {
    try {
      const data = await this.query('funnelData', {
        where: [
          { field: 'userId', operator: '==', value: userId },
          { field: 'funnelName', operator: '==', value: funnelName }
        ],
        orderBy: 'updatedAt desc',
        limit: 1
      });
      return data[0] || null;
    } catch (error) {
      console.error('Error fetching funnel data:', error);
      throw error;
    }
  }
}

  registerCollection(collectionName, config) {
    if (!collectionName || typeof collectionName !== 'string') {
      throw new Error('Collection name must be a string');
    }
    
    if (!config || typeof config !== 'object') {
      throw new Error('Collection config must be an object');
    }
  
    // Validate required fields
    if (!config.userIdField) {
      throw new Error(`Collection ${collectionName} config must specify userIdField`);
    }
  
    // Store the collection configuration
    this._collections.set(collectionName, {
      ...config,
      defaultQueries: config.defaultQueries || []
    });
  }

  async getUserData(userId) {
    try {
      if (!userId) {
        console.warn('getUserData called with undefined userId');
        return null;
      }

      const userData = await this.query('users', {
        where: [{ field: 'authenticationID', operator: '==', value: userId }]
      });
      return userData[0] || null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  async getTeamData(teamId) {
    try {
      if (!teamId) {
        console.warn('getTeamData called with undefined teamId');
        return null;
      }

      const teamData = await this.query('teams', {
        where: [{ field: 'teamId', operator: '==', value: teamId }]
      });
      return teamData[0] || null;
    } catch (error) {
      console.error('Error fetching team data:', error);
      return null;
    }
  }

  // Generic query builder with better error handling
  async query(collectionName, options = {}) {
    try {
      const config = this._collections.get(collectionName);
      if (!config) {
        console.error(`Collection ${collectionName} not registered`);
        return [];
      }

      const queryConstraints = [];

      // Only add constraints if we have valid data
      if (this._currentUser && this._currentUser[config.userIdField]) {
        queryConstraints.push(where(config.userIdField, '==', this._currentUser[config.userIdField]));
      }

      if (config.useTeamId && this._currentUser?.teamId) {
        queryConstraints.push(where('teamId', '==', this._currentUser.teamId));
      }

      // Add default queries if they exist
      if (config.defaultQueries) {
        queryConstraints.push(...config.defaultQueries);
      }

      // Add custom where clauses with validation
      if (options.where) {
        options.where.forEach(({ field, operator, value }) => {
          if (field && operator && value !== undefined) {
            queryConstraints.push(where(field, operator, value));
          }
        });
      }

      // Add ordering if specified
      if (options.orderBy) {
        const [field, direction] = options.orderBy.split(' ');
        queryConstraints.push(orderBy(field, direction || 'asc'));
      }

      // Add limit if specified
      if (options.limit) {
        queryConstraints.push(limit(options.limit));
      }

      const q = query(collection(db, collectionName), ...queryConstraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error in query for ${collectionName}:`, error);
      throw error;
    }
  }

  

  // Create document
  async create(collectionName, data) {
    const config = this._collections.get(collectionName);
    if (!config) throw new Error(`Collection ${collectionName} not registered`);

    const docData = {
      ...data,
      [config.userIdField]: this._currentUser[config.userIdField],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (config.useTeamId && this._currentUser?.teamId) {
      docData.teamId = this._currentUser.teamId;
    }

    const docRef = await addDoc(collection(db, collectionName), docData);
    return {
      id: docRef.id,
      ...docData
    };
  }

  // Update document
  async update(collectionName, docId, data) {
    const config = this._collections.get(collectionName);
    if (!config) throw new Error(`Collection ${collectionName} not registered`);

    const docRef = doc(db, collectionName, docId);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, updateData);
    return {
      id: docId,
      ...updateData
    };
  }

  // Delete document
  async delete(collectionName, docId) {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  }

  // Get single document
  async get(collectionName, docId) {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  }
}

// Create singleton instance
const firebaseService = new FirebaseService();

firebaseService.registerCollection('users', {
  userIdField: 'authenticationID',
  defaultQueries: [orderBy('createdAt', 'desc')]
});

firebaseService.registerCollection('teams', {
  userIdField: 'userId',
  useTeamId: true
});

firebaseService.registerCollection('funnelsData', {
  userIdField: 'userId',
  useTeamId: true,
  defaultQueries: [orderBy('timestamp', 'desc')]
});

firebaseService.registerCollection('resourcesData', {
  userIdField: 'authenticationID',
  useTeamId: true,
  defaultQueries: [orderBy('timestamp', 'desc')]
});

firebaseService.registerCollection('resources', {
  userIdField: 'authenticationID',
  useTeamId: true
});


firebaseService.registerCollection('conversations', {
  userIdField: 'authenticationID',
  defaultQueries: [orderBy('timestamp', 'desc')]
});

firebaseService.registerCollection('tasks', {
  userIdField: 'userId',
  useTeamId: true,
  defaultQueries: [orderBy('dueDate', 'asc')]
});

firebaseService.registerCollection('goals', {
  userIdField: 'userId',
  defaultQueries: [orderBy('createdAt', 'desc')]
});

firebaseService.registerCollection('projectNames', {
  userIdField: 'authenticationID',
  useTeamId: true
});

firebaseService.registerCollection('funnelData', {
  userIdField: 'userId',
  useTeamId: true,
  defaultQueries: [orderBy('updatedAt', 'desc')]
});

export default firebaseService;