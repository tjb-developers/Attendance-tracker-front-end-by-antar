import React, { useState, useRef, useEffect } from 'react';
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
  Eye,
  EyeOff,
  ChevronDown,
  Camera,
  Upload,
  Image as ImageIcon,
  Users,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';
import { AdminUser } from '../../types';
import { compressImageToWebP } from '../../utils/imageCompression';

export const AdminManagement: React.FC = () => {
  const { admins, offices, employees, addAdmin, updateAdmin, toggleAdminStatus, isSuperAdmin } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingAdmin, setViewingAdmin] = useState<AdminUser | null>(null);
  const [isViewModalEditing, setIsViewModalEditing] = useState(false);

  const getOfficeEmployeeCount = (officeId: string) =>
    employees.filter(
      (e) => e.office_id === officeId || (e as any).emp_official_id === officeId
    ).length;

  const [formData, setFormData] = useState<{
    full_name: string;
    email: string;
    employee_code: string;
    emp_phone: string;
    emp_locality: string;
    emp_city: string;
    emp_state: string;
    emp_pin: string;
    emp_DOB: string;
    emp_DOJ: string;
    emp_photo_url: string;
    password: string;
    confirm_password: string;
    role: 'admin';
    assigned_office_ids: string[];
  }>({
    full_name: '',
    email: '',
    employee_code: '',
    emp_phone: '',
    emp_locality: '',
    emp_city: '',
    emp_state: '',
    emp_pin: '',
    emp_DOB: '',
    emp_DOJ: '',
    emp_photo_url: '',
    password: '',
    confirm_password: '',
    role: 'admin',
    assigned_office_ids: [],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isOfficeDropdownOpen, setIsOfficeDropdownOpen] = useState(false);
  const officeDropdownRef = useRef<HTMLDivElement>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (officeDropdownRef.current && !officeDropdownRef.current.contains(event.target as Node)) {
        setIsOfficeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOfficeAssignment = (officeId: string) => {
    setFormData((prev) => {
      const exists = prev.assigned_office_ids.includes(officeId);
      return {
        ...prev,
        assigned_office_ids: exists
          ? prev.assigned_office_ids.filter((id) => id !== officeId)
          : [...prev.assigned_office_ids, officeId],
      };
    });
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopCameraStream();
  }, []);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  const openCameraModal = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setFormError('Camera access is not supported in this browser. Please use Choose File instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err: any) {
      setFormError(
        err?.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser.'
          : 'Unable to access camera. Please ensure a camera is connected and not in use by another app.'
      );
    }
  };

  const closeCameraModal = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCameraError(null);
  };

  const captureCameraPhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const result = await compressImageToWebP(video, { maxDimension: 1024, quality: 0.72 });
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      setPhotoFile(result.file);
      setPhotoPreviewUrl(result.previewUrl);
      closeCameraModal();
    } catch {
      setCameraError('Failed to compress captured photo to WebP.');
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file.');
      return;
    }
    try {
      setFormError(null);
      const result = await compressImageToWebP(file, { maxDimension: 1024, quality: 0.72 });
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      setPhotoFile(result.file);
      setPhotoPreviewUrl(result.previewUrl);
    } catch {
      setFormError('Failed to compress selected image.');
    }
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
      setPhotoPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
      employee_code: '',
      emp_phone: '',
      emp_locality: '',
      emp_city: '',
      emp_state: '',
      emp_pin: '',
      emp_DOB: '',
      emp_DOJ: '',
      emp_photo_url: '',
      password: '',
      confirm_password: '',
      role: 'admin',
      assigned_office_ids: [],
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsOfficeDropdownOpen(false);
    clearPhoto();
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openViewOrEditModal = (admin: AdminUser, editMode: boolean) => {
    setViewingAdmin(admin);
    setIsViewModalEditing(editMode);
    setFormData({
      full_name: admin.full_name,
      email: admin.email,
      employee_code: (admin as any).employee_code || '',
      emp_phone: (admin as any).emp_phone || '',
      emp_locality: (admin as any).emp_locality || '',
      emp_city: (admin as any).emp_city || '',
      emp_state: (admin as any).emp_state || '',
      emp_pin: (admin as any).emp_pin ? String((admin as any).emp_pin) : '',
      emp_DOB: (admin as any).emp_DOB || '',
      emp_DOJ: (admin as any).emp_DOJ || '',
      emp_photo_url: (admin as any).emp_photo_url || '',
      password: '',
      confirm_password: '',
      role: 'admin',
      assigned_office_ids: admin.assigned_office_ids || [],
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsOfficeDropdownOpen(false);
    clearPhoto();
    setFormError(null);
  };

  const handleToggleStatusInModal = async () => {
    if (!viewingAdmin) return;
    const ok = await toggleAdminStatus(viewingAdmin.id);
    if (ok) {
      const nextStatus = viewingAdmin.status === 'active' ? 'inactive' : 'active';
      setViewingAdmin({ ...viewingAdmin, status: nextStatus });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.full_name.trim()) {
      setFormError('Full Name (emp_name) is mandatory.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email Address (emp_email) is mandatory.');
      return;
    }

    const trimmedCode = formData.employee_code.trim().toUpperCase();
    if (formData.emp_phone.trim() && !/^\d{10}$/.test(formData.emp_phone.trim())) {
      setFormError('Phone number must be exactly a 10-digit number.');
      return;
    }
    if (formData.emp_pin.trim()) {
      const pinNum = parseInt(formData.emp_pin.trim(), 10);
      if (!/^\d{6}$/.test(formData.emp_pin.trim()) || isNaN(pinNum) || pinNum < 100000 || pinNum > 999999) {
        setFormError('Area PIN must be a valid 6-digit number between 100000 and 999999.');
        return;
      }
    }

    if (!viewingAdmin) {
      if (!trimmedCode || trimmedCode.length < 1 || trimmedCode.length > 100) {
        setFormError('Employee Code is mandatory (1–100 characters, uppercase).');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setFormError('Password must be at least 6 characters.');
        return;
      }
      if (formData.password !== formData.confirm_password) {
        setFormError('Password and Confirm Password do not match.');
        return;
      }
    }

    if (formData.assigned_office_ids.length === 0 || !formData.assigned_office_ids[0]) {
      setFormError('Please select at least one registered office from the dropdown.');
      return;
    }

    setIsSaving(true);
    const pinValue = formData.emp_pin.trim() ? parseInt(formData.emp_pin.trim(), 10) : null;
    if (viewingAdmin) {
      const updatePayload: any = {
        full_name: formData.full_name.trim(),
        emp_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        emp_email: formData.email.trim().toLowerCase(),
        role: 'admin',
        assigned_office_ids: formData.assigned_office_ids,
        office_id: formData.assigned_office_ids[0],
        emp_official_id: formData.assigned_office_ids[0],
        emp_phone: formData.emp_phone.trim() || null,
        emp_locality: formData.emp_locality.trim() || null,
        emp_city: formData.emp_city.trim() || null,
        emp_state: formData.emp_state.trim() || null,
        emp_pin: pinValue,
        emp_DOB: formData.emp_DOB || null,
        emp_DOJ: formData.emp_DOJ || null,
        ...(photoFile ? { photoFile } : {}),
      };
      const ok = await updateAdmin(viewingAdmin.id, updatePayload);
      setIsSaving(false);
      if (ok) {
        setViewingAdmin({
          ...viewingAdmin,
          ...updatePayload,
          ...(photoPreviewUrl ? { emp_photo_url: photoPreviewUrl } : {}),
        });
        setIsViewModalEditing(false);
      }
    } else {
      const ok = await addAdmin({
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: 'admin',
        assigned_office_ids: formData.assigned_office_ids,
        office_id: formData.assigned_office_ids[0],
        emp_official_id: formData.assigned_office_ids[0],
        employee_code: trimmedCode,
        emp_phone: formData.emp_phone.trim() || undefined,
        emp_locality: formData.emp_locality.trim() || undefined,
        emp_city: formData.emp_city.trim() || undefined,
        emp_state: formData.emp_state.trim() || undefined,
        emp_pin: pinValue,
        emp_DOB: formData.emp_DOB || null,
        emp_DOJ: formData.emp_DOJ || null,
        emp_photo_url: formData.emp_photo_url.trim() || null,
        photoFile,
        password: formData.password,
        status: 'active',
      });
      setIsSaving(false);
      if (ok) {
        clearPhoto();
        setIsAddModalOpen(false);
      }
    }
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
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md shadow-indigo-900/20 self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Admin</span>
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
                <th className="py-3 px-4">Assigned Offices &amp; Staff Count</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Date of Join</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    No administrators enrolled yet. Use the &quot;Add New Admin&quot; button above.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                const isSuper = admin.role === 'super_admin';
                const isActive = admin.status === 'active';
                const adminAny = admin as any;
                const dojText = adminAny.emp_DOJ
                  ? new Date(`${adminAny.emp_DOJ}T00:00:00`).toLocaleDateString()
                  : new Date(admin.created_at).toLocaleDateString();

                return (
                  <tr key={admin.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs flex-shrink-0 overflow-hidden ${
                            isSuper
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {adminAny.emp_photo_url ? (
                            <img
                              src={adminAny.emp_photo_url}
                              alt={admin.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            admin.full_name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{admin.full_name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{admin.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {isSuper || admin.assigned_office_ids.length === 0 ? (
                        <span className="font-semibold text-indigo-800 text-xs">
                          Global (All Offices &bull; {employees.length} staff)
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {admin.assigned_office_ids.map((id) => {
                            const off = offices.find((o) => o.id === id);
                            const empCount = getOfficeEmployeeCount(id);
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-semibold"
                              >
                                <Building2 className="w-3 h-3 text-indigo-600" />
                                <span>{off?.office_code || off?.office_name || 'Office'}</span>
                                <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold">
                                  {empCount} staff
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Suspended
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {dojText}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openViewOrEditModal(admin, false)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        title="View Admin Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Admin Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 !mt-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-950 to-indigo-900 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-300" />
                <h3 className="font-bold text-base">Add New Admin</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs overflow-y-auto">
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
                    placeholder="admin.office@example.gov.in"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:col-span-2">
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Employee Code *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={100}
                        value={formData.employee_code}
                        onChange={(e) =>
                          setFormData({ ...formData, employee_code: e.target.value.toUpperCase() })
                        }
                        placeholder="e.g. TJB-ADM-001"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Phone Number (10 Digits)
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={formData.emp_phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emp_phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                          })
                        }
                        placeholder="9876543210"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Date of Birth (DOB)
                      </label>
                      <input
                        type="date"
                        value={formData.emp_DOB}
                        onChange={(e) => setFormData({ ...formData, emp_DOB: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Date of Joining (DOJ)
                      </label>
                      <input
                        type="date"
                        value={formData.emp_DOJ}
                        onChange={(e) => setFormData({ ...formData, emp_DOJ: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Locality
                      </label>
                      <input
                        type="text"
                        value={formData.emp_locality}
                        onChange={(e) => setFormData({ ...formData, emp_locality: e.target.value })}
                        placeholder="e.g. Sakuntala Road, Sadar"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.emp_city}
                        onChange={(e) => setFormData({ ...formData, emp_city: e.target.value })}
                        placeholder="e.g. Agartala"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={formData.emp_state}
                        onChange={(e) => setFormData({ ...formData, emp_state: e.target.value })}
                        placeholder="e.g. Tripura"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Area PIN (6 Digits)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={formData.emp_pin}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emp_pin: e.target.value.replace(/\D/g, '').slice(0, 6),
                          })
                        }
                        placeholder="e.g. 799001"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                      Admin Photo (File or Camera)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />

                    <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {photoPreviewUrl ? (
                          <img
                            src={photoPreviewUrl}
                            alt="Admin preview"
                            className="w-12 h-12 rounded-xl object-cover border border-slate-300 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-200/70 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 flex-shrink-0">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {photoFile ? photoFile.name : 'No photo selected'}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {photoFile
                              ? `${(photoFile.size / 1024).toFixed(1)} KB • Ready to upload`
                              : 'JPG, PNG or WEBP up to 5 MB'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Choose File</span>
                        </button>
                        <button
                          type="button"
                          onClick={openCameraModal}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Camera</span>
                        </button>
                        {photoFile && (
                          <button
                            type="button"
                            onClick={clearPhoto}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Remove photo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:col-span-2">
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Minimum 6 characters"
                          className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 px-2.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={formData.confirm_password}
                          onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                          placeholder="Re-enter password"
                          className={`w-full px-3 py-2 pr-9 bg-slate-50 border rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none ${
                            formData.confirm_password && formData.confirm_password !== formData.password
                              ? 'border-rose-400 bg-rose-50/30'
                              : 'border-slate-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 px-2.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Authority Tier
                </label>
                <div className="p-3 rounded-xl border bg-blue-50/80 border-blue-200 text-blue-950 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Office Admin</span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-medium">
                    Restricted strictly to assigned office
                  </span>
                </div>
              </div>

              <div ref={officeDropdownRef} className="relative">
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Assign Registered Offices (Multi-Select) *
                </label>
                <button
                  type="button"
                  onClick={() => setIsOfficeDropdownOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-2 pl-3 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 hover:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 focus:outline-none transition cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <Building2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    {formData.assigned_office_ids.length === 0 ? (
                      <span className="text-slate-400 font-normal">-- Select Office Codes --</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {formData.assigned_office_ids.map((id) => {
                          const off = offices.find((o) => o.id === id);
                          return (
                            <span
                              key={id}
                              className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold"
                            >
                              {off?.office_code || id}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${
                      isOfficeDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOfficeDropdownOpen && (
                  <div className="mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-44 overflow-y-auto p-1.5 space-y-1 z-20">
                    {offices.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-2">
                        No registered offices found.
                      </p>
                    ) : (
                      offices.map((off) => {
                        const isChecked = formData.assigned_office_ids.includes(off.id);
                        return (
                          <label
                            key={off.id}
                            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition ${
                              isChecked ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleOfficeAssignment(off.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className="font-mono font-bold text-xs">
                              {off.office_code || off.id}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Add Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified View / Edit Admin Details Popup Modal */}
      {viewingAdmin && (
        <div
          className="fixed inset-0 z-50 !mt-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setViewingAdmin(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-extrabold text-sm overflow-hidden">
                  {(viewingAdmin as any).emp_photo_url ? (
                    <img
                      src={(viewingAdmin as any).emp_photo_url}
                      alt={viewingAdmin.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    viewingAdmin.full_name.charAt(0)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">
                      {isViewModalEditing ? 'Edit Admin Details' : viewingAdmin.full_name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        viewingAdmin.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                          : 'bg-rose-500/20 text-rose-200 border border-rose-400/40'
                      }`}
                    >
                      {viewingAdmin.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-200 font-mono">{viewingAdmin.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingAdmin(null)}
                className="text-slate-300 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            {!isViewModalEditing ? (
              <div className="p-6 space-y-4 text-xs overflow-y-auto">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-100 border border-slate-200 flex items-center justify-center font-extrabold text-xl text-indigo-700 overflow-hidden flex-shrink-0">
                    {(viewingAdmin as any).emp_photo_url ? (
                      <img
                        src={(viewingAdmin as any).emp_photo_url}
                        alt={viewingAdmin.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      viewingAdmin.full_name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Admin Profile Photo</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5 truncate">{viewingAdmin.full_name}</p>
                    <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                      {(viewingAdmin as any).employee_code || 'No Employee Code'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Admin Name</span>
                    <p className="font-bold text-slate-900 mt-0.5">{viewingAdmin.full_name}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Employee Code</span>
                    <p className="font-mono font-bold text-slate-900 mt-0.5">
                      {(viewingAdmin as any).employee_code || '—'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email Address
                    </span>
                    <p className="font-mono font-semibold text-slate-800 mt-0.5">{viewingAdmin.email}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Phone Number
                    </span>
                    <p className="font-mono font-semibold text-slate-800 mt-0.5">
                      {(viewingAdmin as any).emp_phone || '—'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date of Join (DOJ)
                    </span>
                    <p className="font-mono font-semibold text-slate-800 mt-0.5">
                      {(viewingAdmin as any).emp_DOJ ||
                        new Date(viewingAdmin.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date of Birth (DOB)
                    </span>
                    <p className="font-mono font-semibold text-slate-800 mt-0.5">
                      {(viewingAdmin as any).emp_DOB || '—'}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Address
                  </span>
                  <p className="text-slate-700 font-medium">
                    {[
                      (viewingAdmin as any).emp_locality,
                      (viewingAdmin as any).emp_city,
                      (viewingAdmin as any).emp_state,
                      (viewingAdmin as any).emp_pin,
                    ]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </p>
                </div>

                <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200/80 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-indigo-700 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Assigned Offices &amp; Employee Count
                  </span>
                  {viewingAdmin.assigned_office_ids.length === 0 ? (
                    <p className="text-slate-600 font-medium">No specific offices assigned.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {viewingAdmin.assigned_office_ids.map((id) => {
                        const off = offices.find((o) => o.id === id);
                        const empCount = getOfficeEmployeeCount(id);
                        return (
                          <div
                            key={id}
                            className="p-2.5 bg-white rounded-lg border border-indigo-100 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">
                                {off?.office_name || 'Assigned Office'}
                              </p>
                              {off?.office_code && (
                                <span className="text-[10px] font-mono text-indigo-700 font-bold">
                                  {off.office_code}
                                </span>
                              )}
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold flex-shrink-0">
                              <Users className="w-3 h-3" />
                              {empCount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer Actions in View Mode */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleToggleStatusInModal}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition cursor-pointer ${
                      viewingAdmin.status === 'active'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {viewingAdmin.status === 'active' ? (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        <span>Suspend Admin</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Activate Admin</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingAdmin(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 border border-slate-300 hover:bg-slate-100 cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsViewModalEditing(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="p-6 space-y-4 text-xs overflow-y-auto">
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Phone Number (10 Digits)
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={formData.emp_phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emp_phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                        })
                      }
                      placeholder="9876543210"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Area PIN (6 Digits)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={formData.emp_pin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emp_pin: e.target.value.replace(/\D/g, '').slice(0, 6),
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Date of Birth (DOB)
                    </label>
                    <input
                      type="date"
                      value={formData.emp_DOB}
                      onChange={(e) => setFormData({ ...formData, emp_DOB: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Date of Joining (DOJ)
                    </label>
                    <input
                      type="date"
                      value={formData.emp_DOJ}
                      onChange={(e) => setFormData({ ...formData, emp_DOJ: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Locality
                    </label>
                    <input
                      type="text"
                      value={formData.emp_locality}
                      onChange={(e) => setFormData({ ...formData, emp_locality: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.emp_city}
                      onChange={(e) => setFormData({ ...formData, emp_city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.emp_state}
                      onChange={(e) => setFormData({ ...formData, emp_state: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Admin Photo (File or Camera)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />

                  <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {photoPreviewUrl || formData.emp_photo_url ? (
                        <img
                          src={photoPreviewUrl || formData.emp_photo_url}
                          alt="Admin preview"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-300 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-200/70 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 flex-shrink-0">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {photoFile
                            ? photoFile.name
                            : formData.emp_photo_url
                              ? 'Current profile photo'
                              : 'No photo selected'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {photoFile
                            ? `${(photoFile.size / 1024).toFixed(1)} KB • Ready to upload`
                            : 'JPG, PNG or WEBP up to 5 MB'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Choose File</span>
                      </button>
                      <button
                        type="button"
                        onClick={openCameraModal}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Camera</span>
                      </button>
                      {photoFile && (
                        <button
                          type="button"
                          onClick={clearPhoto}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Remove selected photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Multi-select Office Code Dropdown with Checkboxes */}
                <div ref={officeDropdownRef} className="relative">
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Assign Registered Offices (Multi-Select) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsOfficeDropdownOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-2 pl-3 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 hover:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-500 focus:outline-none transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <Building2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      {formData.assigned_office_ids.length === 0 ? (
                        <span className="text-slate-400 font-normal">-- Select Office Codes --</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {formData.assigned_office_ids.map((id) => {
                            const off = offices.find((o) => o.id === id);
                            return (
                              <span
                                key={id}
                                className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold"
                              >
                                {off?.office_code || id}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${
                        isOfficeDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOfficeDropdownOpen && (
                    <div className="mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-44 overflow-y-auto p-1.5 space-y-1 z-20">
                      {offices.map((off) => {
                        const isChecked = formData.assigned_office_ids.includes(off.id);
                        return (
                          <label
                            key={off.id}
                            className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition ${
                              isChecked ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleOfficeAssignment(off.id)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span className="font-mono font-bold text-xs">
                                {off.office_code || off.id}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">
                              {getOfficeEmployeeCount(off.id)} staff
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleToggleStatusInModal}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition cursor-pointer ${
                      viewingAdmin.status === 'active'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {viewingAdmin.status === 'active' ? (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        <span>Suspend Admin</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Activate Admin</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsViewModalEditing(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 border border-slate-300 hover:bg-slate-100 cursor-pointer"
                    >
                      Back to View
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-60 cursor-pointer"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Live Camera Capture Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[60] !mt-0 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-fade-in">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm">Capture Admin Photo</h3>
              </div>
              <button
                type="button"
                onClick={closeCameraModal}
                className="text-slate-300 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {cameraError ? (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {cameraError}
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-200">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCameraModal}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={captureCameraPhoto}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Capture Photo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

