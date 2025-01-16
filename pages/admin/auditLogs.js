// pages/admin/auditLogs.js

import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Search, Download, Calendar as CalendarIcon } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    eventType: 'all',
    tenantId: '',
    startDate: null,
    endDate: null,
  });

  // Event types for filtering
  const eventTypes = [
    'user.login',
    'user.logout',
    'user.created',
    'user.updated',
    'team.created',
    'team.updated',
    'tenant.settings.updated',
    'agent.created',
    'agent.updated',
    'agent.deleted',
    'billing.subscription.updated',
    'billing.payment.processed'
  ];

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      // Build query based on filters
      let auditQuery = collection(db, 'auditLogs');
      
      // Add query conditions based on filters
      if (filters.eventType !== 'all') {
        auditQuery = query(auditQuery, where('eventType', '==', filters.eventType));
      }
      
      if (filters.tenantId) {
        auditQuery = query(auditQuery, where('tenantId', '==', filters.tenantId));
      }
      
      if (filters.startDate) {
        auditQuery = query(auditQuery, where('timestamp', '>=', filters.startDate));
      }
      
      // Always order by timestamp descending and limit to 100 records
      auditQuery = query(auditQuery, orderBy('timestamp', 'desc'), limit(100));
      
      const querySnapshot = await getDocs(auditQuery);
      const logsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadLogs = () => {
    // Convert logs to CSV
    const csvContent = logs.map(log => {
      return [
        log.timestamp.toISOString(),
        log.eventType,
        log.tenantId,
        log.userId,
        log.details
      ].join(',');
    });

    const csv = [
      'Timestamp,Event Type,Tenant ID,User ID,Details',
      ...csvContent
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Audit Logs</CardTitle>
          <Button onClick={downloadLogs} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Select
            value={filters.eventType}
            onValueChange={(value) => setFilters(prev => ({ ...prev, eventType: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {eventTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search Tenant ID"
              className="pl-9"
              value={filters.tenantId}
              onChange={(e) => setFilters(prev => ({ ...prev, tenantId: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <Input
              type="date"
              value={filters.startDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                startDate: e.target.value ? new Date(e.target.value) : null 
              }))}
            />
          </div>

          <Button 
            variant="secondary"
            onClick={() => setFilters({
              eventType: 'all',
              tenantId: '',
              startDate: null,
              endDate: null,
            })}
          >
            Clear Filters
          </Button>
        </div>

        {/* Logs Table */}
        <ScrollArea className="h-[600px] w-full">
          <div className="min-w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.timestamp.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {log.eventType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.userId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AuditLogs;