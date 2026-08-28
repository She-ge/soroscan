"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/terminal/Table";
import { Card } from "@/components/terminal/Card";
import { ROLE_PERMISSIONS } from "@/lib/organization";

function Cell({ allowed }: { allowed: boolean }) {
  return (
    <TableCell className="text-center">
      <span
        className={allowed ? "text-terminal-green" : "text-terminal-gray"}
        aria-label={allowed ? "Allowed" : "Not allowed"}
      >
        {allowed ? "✓" : "—"}
      </span>
    </TableCell>
  );
}

export function RolePermissionMatrix() {
  return (
    <Card title="ROLE_PERMISSION_MATRIX" className="animate-terminal-fade-in">
      <p className="mb-4 text-xs text-terminal-gray">
        Read-only reference for organization roles. Owners retain exclusive control
        over ownership transfer.
      </p>
      <div className="overflow-x-auto border border-terminal-green/30">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Capability</TableHead>
              <TableHead className="text-center">Owner</TableHead>
              <TableHead className="text-center">Admin</TableHead>
              <TableHead className="text-center">Operator</TableHead>
              <TableHead className="text-center">Viewer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROLE_PERMISSIONS.map((row) => (
              <TableRow key={row.capability}>
                <TableCell className="text-terminal-green">{row.capability}</TableCell>
                <Cell allowed={row.owner} />
                <Cell allowed={row.admin} />
                <Cell allowed={row.operator} />
                <Cell allowed={row.viewer} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
