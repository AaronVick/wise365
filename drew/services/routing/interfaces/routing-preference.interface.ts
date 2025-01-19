// src/services/routing/interfaces/routing-preference.interface.ts
/**
 * Routing Preference Service Interface
 * 
 * Manages tenant-specific routing preferences allowing customization of routing
 * behavior per tenant. Handles creation, updates, and lookups of tenant preferences.
 * 
 * @packageDocumentation
 */

export interface IRoutingPreferenceService {
  create(tenantId: string, preference: Omit<RoutingManagement.RoutingPreference, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<RoutingManagement.RoutingPreference>
  update(id: string, preference: Partial<RoutingManagement.RoutingPreference>): Promise<RoutingManagement.RoutingPreference>
  delete(id: string): Promise<void>
  findByTenantId(tenantId: string): Promise<RoutingManagement.RoutingPreference[]>
  findByTenantAndTaskType(tenantId: string, taskType: RoutingManagement.TaskType): Promise<RoutingManagement.RoutingPreference | null>
}