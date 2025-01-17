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
    // Collection configurations
    this._collections = new Map();
    this._currentUser = null;
  }

  // Initialize with user data
  setCurrentUser(userData) {
    this._currentUser = userData;
  }

  // Register a new collection configuration
  registerCollection(name, config) {
    this._collections.set(name, {
      name,
      userIdField: config.userIdField || 'authenticationID',
      defaultQueries: config.defaultQueries || [],
      useTeamId: config.useTeamId || false,
      ...config
    });
  }

  // Get collection configuration
  getCollectionConfig(name) {
    return this._collections.get(name);
  }

  async getUserData(userId) {
    try {
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
      const teamData = await this.query('teams', {
        where: [{ field: 'teamId', operator: '==', value: teamId }]
      });
      return teamData[0] || null;
    } catch (error) {
      console.error('Error fetching team data:', error);
      return null;
    }
  }

  async getFunnelData(userId) {
    try {
      const funnelData = await this.query('funnelsData', {
        where: [{ field: 'userId', operator: '==', value: userId }]
      });
      return funnelData || [];
    } catch (error) {
      console.error('Error fetching funnel data:', error);
      return [];
    }
  }

  async getResourcesData(userId) {
    try {
      const resourcesData = await this.query('resourcesData', {
        where: [{ field: 'userId', operator: '==', value: userId }]
      });
      return resourcesData || [];
    } catch (error) {
      console.error('Error fetching resources data:', error);
      return [];
    }
  }

  // Generic query builder
  async query(collectionName, options = {}) {
    const config = this._collections.get(collectionName);
    if (!config) throw new Error(`Collection ${collectionName} not registered`);

    const queryConstraints = [];

    // Add user ID constraint
    if (this._currentUser) {
      const userIdField = config.userIdField;
      queryConstraints.push(where(userIdField, '==', this._currentUser[userIdField]));
    }

    // Add team ID if configured and available
    if (config.useTeamId && this._currentUser?.teamId) {
      queryConstraints.push(where('teamId', '==', this._currentUser.teamId));
    }

    // Add default queries from collection config
    queryConstraints.push(...config.defaultQueries);

    // Add custom where clauses
    if (options.where) {
      options.where.forEach(({ field, operator, value }) => {
        queryConstraints.push(where(field, operator, value));
      });
    }

    // Add ordering
    if (options.orderBy) {
      const [field, direction] = options.orderBy.split(' ');
      queryConstraints.push(orderBy(field, direction));
    }

    // Add limit
    if (options.limit) {
      queryConstraints.push(limit(options.limit));
    }

    const q = query(collection(db, collectionName), ...queryConstraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
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

// Register default collections
firebaseService.registerCollection('users', {
  userIdField: 'authenticationID',
  defaultQueries: [orderBy('createdAt', 'desc')]
});

firebaseService.registerCollection('teams', {
  userIdField: 'userId',
  useTeamId: true
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

firebaseService.registerCollection('conversations', {
  userIdField: 'authenticationID',
  defaultQueries: [orderBy('timestamp', 'desc')]
});

// Register resources collection
firebaseService.registerCollection('resources', {
  userIdField: 'authenticationID',
  useTeamId: true
});

// Register resourcesData collection
firebaseService.registerCollection('resourcesData', {
  userIdField: 'authenticationID',
  useTeamId: true,
  defaultQueries: [orderBy('timestamp', 'desc')]
});

export default firebaseService;