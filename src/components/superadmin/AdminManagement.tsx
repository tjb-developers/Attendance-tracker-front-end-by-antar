import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  UserPlus,
  Edit2,
  UserX,
  UserCheck,
  Building2,
  Mail,
  Shield,
  X,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { AdminUser } from '../../types';

export const AdminManagement: React.FC = () => {
  const { admins, offices, addAdmin, updateAdmin, toggleAdminStatus, isSuperAdmin } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

  const [formData, setFormData] = useState<{
    full_name: string;
    email: string;
    role: 'super_admin' | 'admin';
    assigned_office_ids: string[];
  }>({
    full_name: '',
    email: '',
    role: 'admin',
    assigned_office_ids: [offices[0]?.id || ''],
  });

  const [formError, setFormError] = useState<string | null>(null);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Restricted Super Admin Area</h3>
        <p className="text-xs text-slate-500 mt-1">
          Only Super Administrators possess authorization to manage administrative user privileges.
        </p>
      </div>
    );
  }

  const openAddModal = () => {
    setFormData({
      full_name: '',
      email: '',
      role: 'admin',
      assigned_office_ids: [offices[0]?.id || ''],
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setFormData({
      full_name: admin.full_name,
      email: admin.email,
      role: admin.role === 'super_admin' ? 'super_admin' : 'admin',
      assigned_office_ids: admin.assigned_office_ids,
    });
    setFormError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.full_name.trim()) {
      setFormError('Full Name is mandatory.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email Address is mandatory.');
      return;
    }

    if (editingAdmin) {
      updateAdmin(editingAdmin.id, formData);
      setEditingAdmin(null);
    } else {
      addAdmin({
        ...formData,
        status: 'active',
      });
      setIsAddModalOpen(false);
    }
  };

  const toggleOfficeAssignment = (officeId: string) => {
    setFormData((prev) => {
      const exists = prev.assigned_office_ids.includes(officeId);
      if (exists) {
        return {
          ...prev,
          assigned_office_ids: prev.assigned_office_ids.filter((id) => id !== officeId),
        };
      } else {
        return {
          ...prev,
          assigned_office_ids: [...prev.assigned_office_ids, officeId],
        };
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Administrator Management & Office Delegation
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-900">
              Super Admin Only
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Create, manage, and delegate office oversight permissions to regional administrators.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md shadow-indigo-900/20 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New Admin</span>
        </button>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            System Administrators ({admins.length})
          </h3>
          <span className="text-xs text-slate-500">RBAC Enforced</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Authority Tier</th>
                <th className="py-3 px-4">Assigned Offices / Jurisdiction</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Enrolled Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No administrators enrolled yet. Use the "Provision New Admin" button above.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                const isSuper = admin.role === 'super_admin';
                const isActive = admin.status === 'active';

                return (
                  <tr key={admin.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs flex-shrink-0 ${
                            isSuper
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {admin.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{admin.full_name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{admin.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {isSuper ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <ShieldCheck className="w-3 h-3 text-indigo-600" />
                          Super Admin (Global Authority)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Building2 className="w-3 h-3 text-blue-600" />
                          Office Admin
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {isSuper || admin.assigned_office_ids.length === 0 ? (
                        <span className="font-semibold text-indigo-800 text-xs">
                          Global (All Offices & Branches)
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {admin.assigned_office_ids.map((id) => {
                            const off = offices.find((o) => o.id === id);
                            return (
                              <span
                                key={id}
                                className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium"
                              >
                                {off?.office_name || 'Tripura Jal Board'}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Deactivated
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(admin)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Admin Privileges"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => toggleAdminStatus(admin.id)}
                          className={`p-1.5 rounded-lg transition ${
                            isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={isActive ? 'Deactivate Admin' : 'Activate Admin'}
                        >
                          {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {(isAddModalOpen || editingAdmin) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-fade-in">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-950 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-300" />
                <h3 className="font-bold text-base">
                  {editingAdmin ? 'Update Administrator Privileges' : 'Provision Administrative Account'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingAdmin(null);
                }}
                className="text-slate-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Smt. Ananya Roy"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin.agartala@tripurajalboard.gov.in"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Authority Tier *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition ${
                      formData.role === 'admin'
                        ? 'bg-blue-50/80 border-blue-500 text-blue-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <input
                        type="radio"
                        name="role"
                        checked={formData.role === 'admin'}
                        onChange={() => setFormData({ ...formData, role: 'admin' })}
                        className="text-blue-600"
                      />
                      <span>Office Admin</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Restricted strictly to assigned office/branch
                    </span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition ${
                      formData.role === 'super_admin'
                        ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <input
                        type="radio"
                        name="role"
                        checked={formData.role === 'super_admin'}
                        onChange={() => setFormData({ ...formData, role: 'super_admin' })}
                        className="text-indigo-600"
                      />
                      <span>Super Admin</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Global unrestricted authority across all offices
                    </span>
                  </label>
                </div>
              </div>

              {formData.role === 'admin' && (
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Assign Office Jurisdiction *
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Select one or more offices under this administrator's oversight:
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2.5">
                    {offices.map((off) => {
                      const isChecked = formData.assigned_office_ids.includes(off.id);
                      return (
                        <label
                          key={off.id}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleOfficeAssignment(off.id)}
                            className="rounded text-blue-600"
                          />
                          <span className="font-medium text-slate-800">{off.office_name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingAdmin(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  {editingAdmin ? 'Save Changes' : 'Provision Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

