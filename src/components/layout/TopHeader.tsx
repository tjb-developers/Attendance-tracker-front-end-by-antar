import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Lock,
  RefreshCw,
  User,
  Menu,
  X,
  Edit2,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Camera,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { compressImageToWebP } from '../../utils/imageCompression';

interface TopHeaderProps {
  onToggleMobileSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleMobileSidebar }) => {
  const {
    currentUser,
    isSuperAdmin,
    offices,
    selectedOfficeId,
    setSelectedOfficeId,
    lastUpdated,
    refreshData,
    isLoading,
    updateProfile,
  } = useApp();

  const userAny = currentUser as any;
  const primaryAssignedOfficeId =
    selectedOfficeId !== 'all'
      ? selectedOfficeId
      : currentUser?.assigned_office_ids?.[0] || '';
  const selectedOffice = offices.find((o) => o.id === primaryAssignedOfficeId);
  const resolvedAssignedOfficeLabel =
    selectedOffice?.office_name ||
    userAny?.assigned_office_name ||
    userAny?.office_name ||
    userAny?.assigned_office_code ||
    userAny?.office_code ||
    (primaryAssignedOfficeId ? primaryAssignedOfficeId : 'Assigned Office');

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [pin, setPin] = useState('');
  const [dob, setDob] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      setProfileError('Camera access is not supported in this browser. Please use Choose File instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err: any) {
      setProfileError(
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
      setProfileError('Please select a valid image file.');
      return;
    }
    try {
      setProfileError(null);
      const result = await compressImageToWebP(file, { maxDimension: 1024, quality: 0.72 });
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      setPhotoFile(result.file);
      setPhotoPreviewUrl(result.previewUrl);
    } catch {
      setProfileError('Failed to compress selected image.');
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

  const openProfileModal = () => {
    setFullName(currentUser?.full_name || '');
    setPhone(userAny?.emp_phone || userAny?.mobile_number || '');
    setLocality(userAny?.emp_locality || '');
    setCity(userAny?.emp_city || '');
    setStateVal(userAny?.emp_state || '');
    setPin(userAny?.emp_pin ? String(userAny.emp_pin) : '');
    setDob(userAny?.emp_DOB || userAny?.date_of_birth || '');
    clearPhoto();
    setIsEditing(false);
    setProfileSaved(false);
    setProfileError(null);
    setIsProfileOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (!fullName.trim()) {
      setProfileError('Full Name is required.');
      return;
    }
    if (phone.trim() && !/^\d{10}$/.test(phone.trim())) {
      setProfileError('Phone number must be exactly a 10-digit number.');
      return;
    }
    if (pin.trim()) {
      const pNum = parseInt(pin.trim(), 10);
      if (!/^\d{6}$/.test(pin.trim()) || isNaN(pNum) || pNum < 100000 || pNum > 999999) {
        setProfileError('Area PIN must be a valid 6-digit number.');
        return;
      }
    }

    setIsSaving(true);
    const ok = await updateProfile({
      full_name: fullName.trim(),
      emp_phone: phone.trim() || undefined,
      emp_locality: locality.trim() || undefined,
      emp_city: city.trim() || undefined,
      emp_state: stateVal.trim() || undefined,
      emp_pin: pin.trim() ? parseInt(pin.trim(), 10) : null,
      emp_DOB: dob || null,
      photoFile,
      photoPreviewUrl,
    });
    setIsSaving(false);

    if (ok) {
      setIsEditing(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3500);
    }
  };

  const assignedOfficeNames =
    currentUser?.assigned_office_ids && currentUser.assigned_office_ids.length > 0
      ? currentUser.assigned_office_ids
          .map(
            (id) =>
              offices.find((o) => o.id === id)?.office_name ||
              userAny?.assigned_office_name ||
              userAny?.office_name ||
              id
          )
          .join(', ')
      : isSuperAdmin
        ? 'All Offices'
        : resolvedAssignedOfficeLabel;

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
        {/* Left side: Mobile menu toggle + Office Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition cursor-pointer"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Office Selection Filter */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 hidden sm:flex">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="hidden md:inline text-[11px] font-bold text-blue-700 tracking-tight">
                  Attendance Tracker by TJB
                </span>
                <span className="hidden md:inline text-slate-300">&bull;</span>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isSuperAdmin ? 'Office Jurisdiction' : 'Assigned Office'}
                </label>
              </div>

              {isSuperAdmin ? (
                <div className="relative">
                  <select
                    value={selectedOfficeId}
                    onChange={(e) => setSelectedOfficeId(e.target.value)}
                    className="text-xs sm:text-sm font-semibold text-slate-800 bg-transparent py-0.5 pr-6 cursor-pointer focus:outline-none hover:text-blue-600 transition"
                  >
                    <option value="all">Global (All Offices / Sub-divisions)</option>
                    {offices.map((off) => (
                      <option key={off.id} value={off.id}>
                        {off.office_name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800">
                  <span className="truncate max-w-[200px] sm:max-w-xs">
                    {resolvedAssignedOfficeLabel}
                  </span>
                  <span
                    title="Restricted strictly to your assigned office"
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800"
                  >
                    <Lock className="w-2.5 h-2.5" />
                    Assigned Office
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Live Sync, Clickable User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={refreshData}
            disabled={isLoading}
            title={`Last updated: ${lastUpdated.toLocaleTimeString()}. Click to refresh.`}
            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer disabled:opacity-60"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">Live Sync</span>
            <RefreshCw className={`w-3 h-3 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Clickable User Profile Button */}
          <button
            type="button"
            onClick={openProfileModal}
            title="View & Edit Profile"
            className="flex items-center gap-2.5 pl-2 pr-2 py-1 rounded-xl sm:border-l border-slate-200 hover:bg-slate-100/80 transition cursor-pointer group"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden ${
                isSuperAdmin
                  ? 'bg-gradient-to-tr from-indigo-700 to-navy-900 text-sky-300'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {userAny?.emp_photo_url || userAny?.photo_url ? (
                <img
                  src={userAny.emp_photo_url || userAny.photo_url}
                  alt={currentUser?.full_name || 'Profile'}
                  className="w-full h-full object-cover"
                />
              ) : currentUser?.full_name ? (
                currentUser.full_name.slice(0, 2).toUpperCase()
              ) : (
                'AD'
              )}
            </div>

            <div className="hidden lg:flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition">
                  {currentUser?.full_name || 'Administrator'}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-blue-100 text-blue-800">
                  Admin
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono truncate max-w-[180px]">
                {currentUser?.email}
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Profile Popup Modal */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setIsProfileOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-sm shadow-sm overflow-hidden">
                  {userAny?.emp_photo_url || userAny?.photo_url ? (
                    <img
                      src={userAny.emp_photo_url || userAny.photo_url}
                      alt={currentUser?.full_name || 'Profile'}
                      className="w-full h-full object-cover"
                    />
                  ) : currentUser?.full_name ? (
                    currentUser.full_name.slice(0, 2).toUpperCase()
                  ) : (
                    'AD'
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {isEditing ? 'Edit Profile Details' : 'My Profile'}
                  </h3>
                  <p className="text-[11px] text-sky-300 font-mono">{currentUser?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="p-1 text-slate-300 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {profileSaved && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              {profileError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold">
                  {profileError}
                </div>
              )}

              {!isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <User className="w-3 h-3" /> Full Name
                      </span>
                      <p className="font-bold text-slate-900 mt-0.5">{currentUser?.full_name || '—'}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email Address
                      </span>
                      <p className="font-mono font-semibold text-slate-800 mt-0.5 truncate">
                        {currentUser?.email || '—'}
                      </p>
                    </div>

                    {!isSuperAdmin && (
                      <>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> Phone Number
                          </span>
                          <p className="font-mono font-semibold text-slate-800 mt-0.5">
                            {userAny?.emp_phone || userAny?.mobile_number || '—'}
                          </p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Date of Birth
                          </span>
                          <p className="font-mono font-semibold text-slate-800 mt-0.5">
                            {userAny?.emp_DOB || userAny?.date_of_birth || '—'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {!isSuperAdmin && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Address &amp; Office
                      </span>
                      <p className="text-slate-700">
                        <span className="font-semibold text-slate-500">Office:</span> {assignedOfficeNames}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-semibold text-slate-500">Location:</span>{' '}
                        {[userAny?.emp_locality, userAny?.emp_city, userAny?.emp_state, userAny?.emp_pin]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsProfileOpen(false)}
                      className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Close
                    </button>
                    {!isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Details</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
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
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="799001"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Locality
                      </label>
                      <input
                        type="text"
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={stateVal}
                        onChange={(e) => setStateVal(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                        Profile Photo (File or Camera)
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
                          {photoPreviewUrl || userAny?.emp_photo_url || userAny?.photo_url ? (
                            <img
                              src={photoPreviewUrl || userAny?.emp_photo_url || userAny?.photo_url}
                              alt="Profile preview"
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
                                : userAny?.emp_photo_url || userAny?.photo_url
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
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition disabled:opacity-60 cursor-pointer"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Capture Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[60] !mt-0 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-fade-in">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">Capture Profile Photo</h3>
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
                  <span>Capture Photo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
