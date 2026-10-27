import React from 'react';
import { FileText, Shield } from 'lucide-react';
import { connectToDatabase } from '@/lib/db/connection';
import { AuditLog } from '@/models/AuditLog';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function SuperAdminAuditLogsPage() {
  await connectToDatabase();

  const logs = await AuditLog.find({})
    .populate('actorUserId', 'name email role')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Audit Trail</h1>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically recorded actions, hotel application approvals, room allocations, and state changes.
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No audit records logged yet</h3>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 font-bold">
                <tr>
                  <th className="py-3 px-5">Timestamp (UTC)</th>
                  <th className="py-3 px-5">Action Event</th>
                  <th className="py-3 px-5">Target Resource</th>
                  <th className="py-3 px-5">Actor / Role</th>
                  <th className="py-3 px-5">Context Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {logs.map((log) => (
                  <tr key={log._id.toString()} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-5 text-slate-400 font-mono">
                      {new Date(log.createdAt).toISOString()}
                    </td>

                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      {log.action}
                    </td>

                    <td className="py-3.5 px-5 text-indigo-600">
                      {log.targetType}: {log.targetId}
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-800">
                        {(log.actorUserId as unknown as { name?: string })?.name || 'System'}
                      </div>
                      <Badge variant="secondary" className="mt-0.5 text-[10px]">
                        {log.actorRole}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
