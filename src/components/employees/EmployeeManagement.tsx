import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserPlus,
  Search,
  Filter,
  Edit2,
  UserX,
  UserCheck,
  Building2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Download,
  AlertCircle,
  X,
  CheckCircle,
  Upload,
  Camera,
  Image as ImageIcon,
  Eye,
  EyeOff,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Employee } from '../../types';
import { compressImageToWebP } from '../../utils/imageCompression';

export const EmployeeManagement: React.FC = () => {
  const {
    currentUser,
    filteredEmployees,
    offices,
    selectedOfficeId,
    addEmployee,
    updateEmployee,
    isSuperAdmin,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [isViewModalEditing, setIsViewModalEditing] = useState(false);

  // Add/Edit Form State (aligned with public."Employee" schema)
  const [formData, setFormData] = useState({
    employee_code: '',
    full_name: '',
    designation: '',
    email: '',
    emp_phone: '',
    office_id: offices[0]?.id || '',
    emp_DOB: '',
    emp_DOJ: '',
    emp_locality: '',
    emp_city: '',
    emp_state: '',
    emp_pin: '',
    emp_photo_url: '',
    password: '',
    confirm_password: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOfficeDropdownOpen, setIsOfficeDropdownOpen] = useState(false);
  const officeDropdownRef = useRef<HTMLDivElement>(null);

  const availableOffices = useMemo(() => {
    const userAny = currentUser as any;
    if (isSuperAdmin) {
      return offices;
    }

    const assignedIds: string[] = Array.isArray(currentUser?.assigned_office_ids)
      ? currentUser!.assigned_office_ids
      : [];
    const fallbackPrimaryId =
      userAny?.emp_official_id || userAny?.office_id || '';
    const allowedIds =
      assignedIds.length > 0
        ? assignedIds
        : fallbackPrimaryId
          ? [fallbackPrimaryId]
          : [];

    if (allowedIds.length === 0) {
      return offices;
    }

    const matched = offices.filter((o) => allowedIds.includes(o.id));
    if (matched.length > 0) {
      return matched;
    }

    // Fallback if GET /offices is empty/restricted for admin: construct from user profile
    return allowedIds.map((id, idx) => ({
      id,
      office_name:
        (idx === 0 && (userAny?.assigned_office_name || userAny?.office_name)) ||
        `Assigned Office`,
      office_code:
        (idx === 0 && (userAny?.assigned_office_code || userAny?.office_code)) ||
        id,
    }));
  }, [offices, currentUser, isSuperAdmin]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (officeDropdownRef.current && !officeDropdownRef.current.contains(e.target as Node)) {
        setIsOfficeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [formError, setFormError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoStats, setPhotoStats] = useState<{ originalBytes: number; compressedBytes: number } | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
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

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoStats(null);
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
      setPhotoPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      const res = await compressImageToWebP(file, { maxDimension: 1024, quality: 0.72 });
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      setPhotoFile(res.file);
      setPhotoPreviewUrl(res.previewUrl);
      setPhotoStats({ originalBytes: res.originalBytes, compressedBytes: res.compressedBytes });
    } catch {
      setFormError('Failed to compress selected image to WebP.');
    }
  };

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
    } catch {
      setFormError('Unable to access camera. Please allow camera permission.');
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
      const res = await compressImageToWebP(video, { maxDimension: 1024, quality: 0.72 });
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      setPhotoFile(res.file);
      setPhotoPreviewUrl(res.previewUrl);
      setPhotoStats({ originalBytes: res.originalBytes, compressedBytes: res.compressedBytes });
      closeCameraModal();
    } catch {
      setCameraError('Failed to compress captured photo to WebP.');
    }
  };

  // Filtered employees list
  const displayEmployees = useMemo(() => {
    return filteredEmployees.filter((emp) => {
      const matchesSearch =
        (emp.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.employee_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((emp as any).emp_desig || emp.designation || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.mobile_number || '').includes(searchTerm);

      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return emp.status === 'active';
      return emp.status !== 'active';
    });
  }, [filteredEmployees, searchTerm, statusFilter]);

  const openAddModal = () => {
    setViewingEmployee(null);
    setIsViewModalEditing(false);
    setFormData({
      employee_code: '',
      full_name: '',
      designation: '',
      email: '',
      emp_phone: '',
      office_id:
        availableOffices.find((o) => o.id === selectedOfficeId)?.id ||
        availableOffices[0]?.id ||
        '',
      emp_DOB: '',
      emp_DOJ: '',
      emp_locality: '',
      emp_city: '',
      emp_state: '',
      emp_pin: '',
      emp_photo_url: '',
      password: '',
      confirm_password: '',
      status: 'active',
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsOfficeDropdownOpen(false);
    clearPhoto();
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openViewModal = (emp: Employee) => {
    const empAny = emp as any;
    const empOfficeId = empAny.emp_official_id || emp.office_id || '';
    const resolvedOfficeId = availableOffices.some((o) => o.id === empOfficeId)
      ? empOfficeId
      : availableOffices[0]?.id || empOfficeId;
    setViewingEmployee(emp);
    setIsViewModalEditing(false);
    setFormData({
      employee_code: emp.employee_code || '',
      full_name: emp.full_name || empAny.emp_name || '',
      designation: empAny.emp_desig || emp.designation || '',
      email: emp.email || empAny.emp_email || '',
      emp_phone: empAny.emp_phone || emp.mobile_number || '',
      office_id: resolvedOfficeId,
      emp_DOB: empAny.emp_DOB || emp.date_of_birth || '',
      emp_DOJ: empAny.emp_DOJ || '',
      emp_locality: empAny.emp_locality || '',
      emp_city: empAny.emp_city || '',
      emp_state: empAny.emp_state || '',
      emp_pin: empAny.emp_pin ? String(empAny.emp_pin) : '',
      emp_photo_url: empAny.emp_photo_url || empAny.photo_url || '',
      password: '',
      confirm_password: '',
      status: emp.status === 'active' ? 'active' : 'inactive',
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsOfficeDropdownOpen(false);
    clearPhoto();
    setFormError(null);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
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
    if (!formData.designation.trim()) {
      setFormError('Employee Designation (emp_desig) is mandatory.');
      return;
    }

    const trimmedCode = formData.employee_code.trim().toUpperCase();
    if (!trimmedCode || trimmedCode.length < 1 || trimmedCode.length > 100) {
      setFormError('Employee Code is mandatory (1–100 characters, uppercase).');
      return;
    }
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
    if (!viewingEmployee) {
      if (!formData.password || formData.password.length < 6) {
        setFormError('Password must be at least 6 characters.');
        return;
      }
      if (formData.password !== formData.confirm_password) {
        setFormError('Password and Confirm Password do not match.');
        return;
      }
    }
    if (!formData.office_id) {
      setFormError('Assigned Office is mandatory.');
      return;
    }

    const pinValue = formData.emp_pin.trim() ? parseInt(formData.emp_pin.trim(), 10) : null;
    setIsSaving(true);
    if (viewingEmployee) {
      const updatePayload: any = {
        emp_name: formData.full_name.trim(),
        full_name: formData.full_name.trim(),
        emp_email: formData.email.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        employee_code: trimmedCode,
        office_id: formData.office_id,
        emp_official_id: formData.office_id,
        emp_desig: formData.designation.trim(),
        designation: formData.designation.trim(),
        emp_phone: formData.emp_phone.trim() || null,
        mobile_number: formData.emp_phone.trim() || null,
        emp_locality: formData.emp_locality.trim() || null,
        emp_city: formData.emp_city.trim() || null,
        emp_state: formData.emp_state.trim() || null,
        emp_pin: pinValue,
        emp_DOB: formData.emp_DOB || null,
        date_of_birth: formData.emp_DOB || null,
        emp_DOJ: formData.emp_DOJ || null,
        emp_photo_url: formData.emp_photo_url.trim() || null,
        user_status: formData.status,
        status: formData.status,
        role: 'employee',
        ...(photoFile ? { photoFile } : {}),
      };
      const ok = await updateEmployee(viewingEmployee.id, updatePayload);
      setIsSaving(false);
      if (ok) {
        setViewingEmployee({
          ...viewingEmployee,
          ...updatePayload,
          ...(photoPreviewUrl ? { emp_photo_url: photoPreviewUrl } : {}),
        });
        clearPhoto();
        setIsViewModalEditing(false);
      }
    } else {
      const ok = await addEmployee({
        employee_code: trimmedCode,
        full_name: formData.full_name.trim(),
        emp_desig: formData.designation.trim(),
        designation: formData.designation.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile_number: formData.emp_phone.trim(),
        emp_phone: formData.emp_phone.trim() || undefined,
        office_id: formData.office_id,
        emp_official_id: formData.office_id,
        date_of_birth: formData.emp_DOB || undefined,
        emp_DOB: formData.emp_DOB || null,
        emp_DOJ: formData.emp_DOJ || null,
        emp_locality: formData.emp_locality.trim() || undefined,
        emp_city: formData.emp_city.trim() || undefined,
        emp_state: formData.emp_state.trim() || undefined,
        emp_pin: pinValue,
        emp_photo_url: formData.emp_photo_url.trim() || null,
        password: formData.password,
        status: 'active',
        role: 'employee',
        photoFile,
      } as any);
      setIsSaving(false);
      if (ok) {
        clearPhoto();
        setIsAddModalOpen(false);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Employee Code',
      'Full Name',
      'Designation',
      'Email',
      'Mobile Number',
      'Assigned Office',
      'Date of Birth',
      'Status',
    ];
    const rows = displayEmployees.map((e) => {
      const off = offices.find((o) => o.id === e.office_id);
      return [
        `"${e.employee_code}"`,
        `"${e.full_name}"`,
        `"${(e as any).emp_desig || e.designation || ''}"`,
        `"${e.email}"`,
        `"${e.mobile_number}"`,
        `"${off?.office_name || 'N/A'}"`,
        `"${e.date_of_birth || ''}"`,
        `"${e.status}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tripura_Jal_Board_Employees_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Employee Directory & Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Authorized administrative desk. Employees cannot register themselves; new accounts are provisioned here.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition shadow-md shadow-blue-900/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code, name, designation, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            {(['all', 'active', 'suspended'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                  statusFilter === st
                    ? 'bg-navy-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Employee Code</th>
                <th className="py-3 px-4">Full Name & Role</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Assigned Office</th>
                <th className="py-3 px-4">Date of Birth</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No employee records found. Click "Add New Employee" above to enroll personnel.
                  </td>
                </tr>
              ) : (
                displayEmployees.map((emp) => {
                const office = offices.find((o) => o.id === emp.office_id);
                const isActive = emp.status === 'active';

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {emp.employee_code}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-xs overflow-hidden">
                          {(emp as any).emp_photo_url || (emp as any).photo_url ? (
                            <img
                              src={(emp as any).emp_photo_url || (emp as any).photo_url}
                              alt={emp.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            emp.full_name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{emp.full_name}</p>
                          <p className="text-[11px] text-slate-500">
                            {(emp as any).emp_desig || emp.designation || '—'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{emp.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{emp.mobile_number}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-[11px] text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">
                          {office?.office_name ||
                            (currentUser as any)?.assigned_office_name ||
                            (currentUser as any)?.office_name ||
                            'Assigned Office'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {emp.date_of_birth || 'Not specified'}
                    </td>

                    <td className="py-3.5 px-4">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <UserX className="w-3 h-3 text-rose-600" />
                          Suspended
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openViewModal(emp)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        title="View Employee Details"
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

      {/* Add / View / Edit Employee Modal */}
      {(isAddModalOpen || viewingEmployee) && (
        <div className="fixed inset-0 z-50 !mt-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-navy-900 to-navy-800 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-600/30">
                  <UserPlus className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">
                      {viewingEmployee
                        ? isViewModalEditing
                          ? 'Edit Employee Profile'
                          : viewingEmployee.full_name
                        : 'Enroll New Employee'}
                    </h3>
                    {viewingEmployee && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          viewingEmployee.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                            : 'bg-rose-500/20 text-rose-200 border border-rose-400/40'
                        }`}
                      >
                        {viewingEmployee.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    {viewingEmployee ? viewingEmployee.email : 'Official Staff Directory'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setViewingEmployee(null);
                  setIsViewModalEditing(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewingEmployee && !isViewModalEditing ? (
              <div className="p-6 space-y-4 text-xs overflow-y-auto">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-blue-100 border border-slate-200 flex items-center justify-center font-extrabold text-xl text-blue-700 overflow-hidden flex-shrink-0">
                    {(viewingEmployee as any).emp_photo_url || (viewingEmployee as any).photo_url ? (
                      <img
                        src={(viewingEmployee as any).emp_photo_url || (viewingEmployee as any).photo_url}
                        alt={viewingEmployee.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      viewingEmployee.full_name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Employee Profile Photo
                    </span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5 truncate">
                      {viewingEmployee.full_name}
                    </p>
                    <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                      {viewingEmployee.employee_code || 'No Employee Code'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Full Name</span>
                    <p className="font-bold text-slate-900 mt-0.5">{viewingEmployee.full_name}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Employee Code</span>
                    <p className="font-mono font-bold text-slate-900 mt-0.5">
                      {viewingEmployee.employee_code || '—'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 sm:col-span-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Employee Designation
                    </span>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {(viewingEmployee as any).emp_desig || viewingEmployee.designation || '—'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email Address
                    </span>
                    <p className="font-mono font-semibold text-slate-800 mt-0.5">
                      {viewingEmployee.email}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Phone Number
                    </span>
                    <p className="font-mono font-semibold text-slate-800 mt-0.5">
                      {(viewingEmployee as any).emp_phone || viewingEmployee.mobile_number || '—'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date of Join (DOJ)
                    </span>
                    <p className="font-mono font-semibold text-slate-800 mt-0.5">
                      {(viewingEmployee as any).emp_DOJ ||
                        new Date(viewingEmployee.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date of Birth (DOB)
                    </span>
                    <p className="font-mono font-semibold text-slate-800 mt-0.5">
                      {(viewingEmployee as any).emp_DOB || viewingEmployee.date_of_birth || '—'}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Address &amp; Assigned Office
                  </span>
                  <p className="text-slate-700">
                    {[
                      (viewingEmployee as any).emp_locality,
                      (viewingEmployee as any).emp_city,
                      (viewingEmployee as any).emp_state,
                      (viewingEmployee as any).emp_pin,
                    ]
                      .filter(Boolean)
                      .join(', ') ||
                      viewingEmployee.residential_address ||
                      'No address provided'}
                  </p>
                  <p className="font-semibold text-blue-700 pt-1">
                    Office:{' '}
                    {(() => {
                      const off = availableOffices.find(
                        (o) =>
                          o.id === ((viewingEmployee as any).emp_official_id || viewingEmployee.office_id)
                      );
                      return off
                        ? off.office_code
                          ? `${off.office_code} — ${off.office_name}`
                          : off.office_name
                        : 'Assigned Office';
                    })()}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setViewingEmployee(null);
                      setIsViewModalEditing(false);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 border border-slate-300 hover:bg-slate-100 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsViewModalEditing(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Details</span>
                  </button>
                </div>
              </div>
            ) : (
            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4 text-xs overflow-y-auto">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{formError}</span>
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
                    placeholder="e.g. Subir Chakraborty"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                    placeholder="subir.c@example.gov.in"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Employee Designation *
                </label>
                <input
                  type="text"
                  required
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g. Junior Engineer / Field Officer"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    placeholder="e.g. TJB-EMP-001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                    placeholder="e.g. Radhanagar, Sadar"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                  Employee Photo (File or Camera)
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
                        alt="Employee preview"
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
                        {photoStats
                          ? `${(photoStats.originalBytes / 1024).toFixed(1)} KB -> ${(photoStats.compressedBytes / 1024).toFixed(1)} KB WebP`
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
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Choose File</span>
                    </button>
                    <button
                      type="button"
                      onClick={openCameraModal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
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

              {!viewingEmployee && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                        onChange={(e) =>
                          setFormData({ ...formData, confirm_password: e.target.value })
                        }
                        placeholder="Re-enter password"
                        className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
              )}

              <div ref={officeDropdownRef} className="relative">
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Assigned Registered Office *
                </label>
                <button
                  type="button"
                  onClick={() => setIsOfficeDropdownOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-2 pl-3 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 hover:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-500 focus:outline-none transition cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    {(() => {
                      const selectedOff = availableOffices.find((o) => o.id === formData.office_id);
                      if (!selectedOff) {
                        return <span className="text-slate-400 font-normal">-- Select Assigned Office --</span>;
                      }
                      return (
                        <span className="truncate font-mono text-xs text-slate-900">
                          {selectedOff.office_code
                            ? `${selectedOff.office_code} — ${selectedOff.office_name}`
                            : selectedOff.office_name}
                        </span>
                      );
                    })()}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${
                      isOfficeDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOfficeDropdownOpen && (
                  <div className="mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-44 overflow-y-auto p-1.5 space-y-1 z-20">
                    {availableOffices.length === 0 ? (
                      <p className="text-[11px] text-slate-500 p-2">No assigned offices found.</p>
                    ) : (
                      availableOffices.map((off) => {
                        const isSelected = formData.office_id === off.id;
                        return (
                          <button
                            key={off.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, office_id: off.id });
                              setIsOfficeDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left cursor-pointer transition ${
                              isSelected
                                ? 'bg-blue-50 text-blue-900 font-bold'
                                : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Building2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                              <span className="font-mono text-xs truncate">
                                {off.office_code
                                  ? `${off.office_code} — ${off.office_name}`
                                  : off.office_name}
                              </span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {viewingEmployee && (
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Account Status
                  </label>
                  <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">
                        {formData.status === 'active' ? 'Active Account' : 'Suspended Account'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Toggle to {formData.status === 'active' ? 'suspend' : 'activate'} — applied when you click Save Changes.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.status === 'active'}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          status: formData.status === 'active' ? 'inactive' : 'active',
                        })
                      }
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 ${
                        formData.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          formData.status === 'active' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (viewingEmployee) {
                      setIsViewModalEditing(false);
                    } else {
                      setIsAddModalOpen(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  {viewingEmployee ? 'Back to View' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : viewingEmployee ? 'Save Changes' : 'Enroll Employee'}
                </button>
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
                <Camera className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-sm">Capture Employee Photo</h3>
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Capture WebP Photo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

