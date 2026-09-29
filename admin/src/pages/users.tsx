import React, { useState } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "developer" | "viewer";
  status: "active" | "inactive" | "suspended";
  createdAt: string;
}

const INITIAL_USERS: User[] = [
  {
    id: "usr_1",
    name: "Alex Montgomery",
    email: "alexander.christopher.montgomery.jr@extremely-long-subdomain.enterprise-domain.com",
    role: "admin",
    status: "active",
    createdAt: "2026-01-15",
  },
  {
    id: "usr_2",
    name: "Jane Doe",
    email: "jane.doe@soroscan.io",
    role: "developer",
    status: "active",
    createdAt: "2026-02-10",
  },
  {
    id: "usr_3",
    name: "Bartholomew Featherstonehaugh",
    email: "bartholomew.featherstonehaugh.v@very-long-corporate-email-address-provider.org",
    role: "viewer",
    status: "inactive",
    createdAt: "2026-03-01",
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  const handleDeleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage system users, roles, and administrative access.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                  Created At
                </th>
                <th scope="col" className="px-6 py-3 font-medium text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {user.name}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="max-w-[180px] truncate block text-gray-600 dark:text-gray-300"
                      title={user.email}
                      data-testid={`user-email-${user.id}`}
                    >
                      {user.email}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">
                    {user.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : user.status === "suspended"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {user.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <button
                      type="button"
                      className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user.id)}
                      className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
