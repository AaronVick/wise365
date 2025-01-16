// pages/admin/auditLogs.js

import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, Download, Calendar as CalendarIcon } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    eventType: 'all',
    tenantId: '',
    startDate: null,
  });

  const eventTypes = [
    'all',
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
    'billing.payment.processed',
  ];

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      let auditQuery = collection(db, 'auditLogs');
      const conditions = [];

      if (filters.eventType !== 'all') {
        conditions.push(where('eventType', '==', filters.eventType));
      }
      if (filters.tenantId) {
        conditions.push(where('tenantId', '==', filters.tenantId));
      }
      if (filters.startDate) {
        conditions.push(where('timestamp', '>=', new Date(filters.startDate)));
      }

      auditQuery = query(auditQuery, ...conditions, orderBy('timestamp', 'desc'), limit(100));
      const querySnapshot = await getDocs(auditQuery);

      const logsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      }));

      setLogs(logsData);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to load audit logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const downloadLogs = () => {
    const csvContent = logs.map((log) => [
      log.timestamp?.toISOString() || 'N/A',
      log.eventType || 'N/A',
      log.tenantId || 'N/A',
      log.userId || 'N/A',
      log.details || 'N/A',
    ].join(','));

    const csv = [
      'Timestamp,Event Type,Tenant ID,User ID,Details',
      ...csvContent,
    ].join('\n');

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

  const clearFilters = () => {
    setFilters({
      eventType: 'all',
      tenantId: '',
      startDate: null,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Audit Logs</CardTitle>
          <Button onClick={downloadLogs} className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Select
            value={filters.eventType}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, eventType: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((type) => (
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
              onChange={(e) => setFilters((prev) => ({ ...prev, tenantId: e.target.value }))}
            />
          </div>

          <Input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => setFilters((prev) => ({
              ...prev,
              startDate: e.target.value || null,
            }))}
          />

          <Button variant="secondary" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <ScrollArea className="h-[600px] w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.timestamp?.toLocaleString() || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {log.eventType}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.userId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>

        {loading && <div className="text-center mt-4">Loading...</div>}
      </CardContent>
    </Card>
  );
};

export default AuditLogs;
