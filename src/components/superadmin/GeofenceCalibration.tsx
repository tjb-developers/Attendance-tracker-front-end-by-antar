import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  MapPin,
  Compass,
  Clock,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  LocateFixed,
  Info,
  Shield,
} from 'lucide-react';
import { Office } from '../../types';

export const GeofenceCalibration: React.FC = () => {
  const { offices, updateOfficeCalibration, addOffice, deleteOffice, isSuperAdmin } = useApp();

  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(offices[0]?.id || '');
  const activeOffice = offices.find((o) => o.id === selectedOfficeId) || offices[0];

  // Active office form state (Separate fields)
  const [officeName, setOfficeName] = useState(activeOffice?.office_name || '');
  const [officeCode, setOfficeCode] = useState(activeOffice?.office_code || '');
  const [officeLocality, setOfficeLocality] = useState(activeOffice?.locality || activeOffice?.office_locality || '');
  const [officeCity, setOfficeCity] = useState(activeOffice?.city || activeOffice?.office_city || '');
  const [officeState, setOfficeState] = useState(activeOffice?.state || activeOffice?.office_state || '');
  const [officePin, setOfficePin] = useState(activeOffice?.pin || activeOffice?.office_pin || '');
  const [latitude, setLatitude] = useState(activeOffice?.latitude || 0);
  const [longitude, setLongitude] = useState(activeOffice?.longitude || 0);
  const [radiusMeters, setRadiusMeters] = useState(activeOffice?.radius_meters || activeOffice?.geofence_radius || 100);
  const [officeStartTime, setOfficeStartTime] = useState(activeOffice?.office_start_time || activeOffice?.shift_start_time || '10:00 AM');
  const [officeEndTime, setOfficeEndTime] = useState(activeOffice?.office_end_time || activeOffice?.shift_end_time || '05:30 PM');
  const [breakAllowance, setBreakAllowance] = useState(activeOffice?.break_allowance || activeOffice?.standard_break_allowance_minutes || 60);
  const [gracePeriod, setGracePeriod] = useState(activeOffice?.grace_period || activeOffice?.break_grace_period_minutes || 15);

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add Office Modal State (Separate fields)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newOfficeName, setNewOfficeName] = useState('');
  const [newOfficeCode, setNewOfficeCode] = useState('');
  const [newOfficeLocality, setNewOfficeLocality] = useState('');
  const [newOfficeCity, setNewOfficeCity] = useState('');
  const [newOfficeState, setNewOfficeState] = useState('');
  const [newOfficePin, setNewOfficePin] = useState('');
  const [newLatitude, setNewLatitude] = useState<string>('');
  const [newLongitude, setNewLongitude] = useState<string>('');
  const [newRadiusMeters, setNewRadiusMeters] = useState<number>(100);
  const [newOfficeStartTime, setNewOfficeStartTime] = useState('10:00 AM');
  const [newOfficeEndTime, setNewOfficeEndTime] = useState('05:30 PM');
  const [newBreakAllowance, setNewBreakAllowance] = useState(60);
  const [newGracePeriod, setNewGracePeriod] = useState(15);
  const [isCreatingOffice, setIsCreatingOffice] = useState(false);

  // GPS Geolocation States
  const [isLocatingModal, setIsLocatingModal] = useState(false);
  const [gpsModalStatus, setGpsModalStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isLocatingMain, setIsLocatingMain] = useState(false);
  const [gpsMainStatus, setGpsMainStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchCurrentLocation = (
    onSuccess: (lat: number, lng: number, accuracy: number) => void,
    setStatus: (val: { type: 'success' | 'error'; message: string } | null) => void,
    setLoading: (val: boolean) => void
  ) => {
    if (!navigator.geolocation) {
      setStatus({ type: 'error', message: 'Geolocation is not supported by your browser.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoading(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const acc = Math.round(position.coords.accuracy);

        onSuccess(lat, lng, acc);
        setStatus({
          type: 'success',
          message: `Location captured: Lat ${lat}, Lng ${lng} (Accuracy: ±${acc}m)`,
        });
      },
      (error) => {
        setLoading(false);
        let msg = 'Failed to retrieve location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location permission was denied. Please allow location access in your browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'GPS signal or location information is currently unavailable.';
            break;
          case error.TIMEOUT:
            msg = 'Location request timed out. Please try again.';
            break;
        }
        setStatus({ type: 'error', message: msg });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleFetchCurrentLocationForModal = () => {
    fetchCurrentLocation(
      (lat, lng) => {
        setNewLatitude(String(lat));
        setNewLongitude(String(lng));
      },
      setGpsModalStatus,
      setIsLocatingModal
    );
  };

  const handleFetchCurrentLocationForMain = () => {
    fetchCurrentLocation(
      (lat, lng) => {
        setLatitude(lat);
        setLongitude(lng);
      },
      setGpsMainStatus,
      setIsLocatingMain
    );
  };

  // Sync state whenever offices change
  useEffect(() => {
    if (offices.length > 0) {
      const current = offices.find((o) => o.id === selectedOfficeId) || offices[0];
      setSelectedOfficeId(current.id);
      setOfficeName(current.office_name);
      setOfficeCode(current.office_code || '');
      setOfficeLocality(current.locality || current.office_locality || '');
      setOfficeCity(current.city || current.office_city || '');
      setOfficeState(current.state || current.office_state || '');
      setOfficePin(current.pin || current.office_pin || '');
      setLatitude(current.latitude);
      setLongitude(current.longitude);
      setRadiusMeters(current.radius_meters || current.geofence_radius || 100);
      setOfficeStartTime(current.office_start_time || current.shift_start_time || '10:00 AM');
      setOfficeEndTime(current.office_end_time || current.shift_end_time || '05:30 PM');
      setBreakAllowance(current.break_allowance || current.standard_break_allowance_minutes || 60);
      setGracePeriod(current.grace_period || current.break_grace_period_minutes || 15);
    }
  }, [offices]);

  const handleOfficeSelect = (id: string) => {
    setSelectedOfficeId(id);
    const off = offices.find((o) => o.id === id);
    if (off) {
      setOfficeName(off.office_name);
      setOfficeCode(off.office_code || '');
      setOfficeLocality(off.locality || off.office_locality || '');
      setOfficeCity(off.city || off.office_city || '');
      setOfficeState(off.state || off.office_state || '');
      setOfficePin(off.pin || off.office_pin || '');
      setLatitude(off.latitude);
      setLongitude(off.longitude);
      setRadiusMeters(off.radius_meters || off.geofence_radius || 100);
      setOfficeStartTime(off.office_start_time || off.shift_start_time || '10:00 AM');
      setOfficeEndTime(off.office_end_time || off.shift_end_time || '05:30 PM');
      setBreakAllowance(off.break_allowance || off.standard_break_allowance_minutes || 60);
      setGracePeriod(off.grace_period || off.break_grace_period_minutes || 15);
      setSaveSuccess(false);
    }
  };

  const handleSaveCalibration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOffice) return;

    const formattedAddress = [officeLocality, officeCity, officeState, officePin].filter(Boolean).join(', ') || activeOffice.address;

    await updateOfficeCalibration(activeOffice.id, {
      office_name: officeName.trim(),
      office_code: officeCode.trim().toUpperCase(),
      address: formattedAddress,
      locality: officeLocality.trim(),
      office_locality: officeLocality.trim(),
      city: officeCity.trim(),
      office_city: officeCity.trim(),
      state: officeState.trim(),
      office_state: officeState.trim(),
      pin: officePin.trim(),
      office_pin: officePin.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius_meters: Number(radiusMeters),
      geofence_radius: Number(radiusMeters),
      office_start_time: officeStartTime.trim(),
      shift_start_time: officeStartTime.trim(),
      office_end_time: officeEndTime.trim(),
      shift_end_time: officeEndTime.trim(),
      standard_break_allowance_minutes: Number(breakAllowance),
      break_allowance: Number(breakAllowance),
      break_grace_period_minutes: Number(gracePeriod),
      grace_period: Number(gracePeriod),
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleCreateOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficeName.trim()) {
      alert('Office Name is mandatory.');
      return;
    }
    if (!newOfficeCode.trim()) {
      alert('Office Code is mandatory (e.g. TJB for Tripura Jal Board).');
      return;
    }
    if (!newOfficeLocality.trim()) {
      alert('Office Locality is mandatory.');
      return;
    }
    if (!newOfficeCity.trim()) {
      alert('Office City is mandatory.');
      return;
    }
    if (!newOfficeState.trim()) {
      alert('Office State is mandatory.');
      return;
    }
    if (!newOfficePin.trim()) {
      alert('Office Area PIN is mandatory.');
      return;
    }

    const lat = parseFloat(newLatitude);
    const lng = parseFloat(newLongitude);
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid numerical latitude and longitude coordinates.');
      return;
    }

    const formattedAddress = `${newOfficeLocality.trim()}, ${newOfficeCity.trim()}, ${newOfficeState.trim()} - ${newOfficePin.trim()}`;

    setIsCreatingOffice(true);
    const success = await addOffice({
      office_name: newOfficeName.trim(),
      office_code: newOfficeCode.trim().toUpperCase(),
      address: formattedAddress,
      locality: newOfficeLocality.trim(),
      office_locality: newOfficeLocality.trim(),
      city: newOfficeCity.trim(),
      office_city: newOfficeCity.trim(),
      state: newOfficeState.trim(),
      office_state: newOfficeState.trim(),
      pin: newOfficePin.trim(),
      office_pin: newOfficePin.trim(),
      latitude: lat,
      longitude: lng,
      radius_meters: Number(newRadiusMeters) || 100,
      geofence_radius: Number(newRadiusMeters) || 100,
      time_zone: 'Asia/Kolkata',
      working_days: [1, 2, 3, 4, 5, 6],
      standard_break_allowance_minutes: Number(newBreakAllowance) || 60,
      break_allowance: Number(newBreakAllowance) || 60,
      break_grace_period_minutes: Number(newGracePeriod) || 15,
      grace_period: Number(newGracePeriod) || 15,
      shift_start_time: newOfficeStartTime.trim() || '10:00 AM',
      office_start_time: newOfficeStartTime.trim() || '10:00 AM',
      shift_end_time: newOfficeEndTime.trim() || '05:30 PM',
      office_end_time: newOfficeEndTime.trim() || '05:30 PM',
    });
    setIsCreatingOffice(false);

    if (success) {
      setIsAddModalOpen(false);
      setNewOfficeName('');
      setNewOfficeCode('');
      setNewOfficeLocality('');
      setNewOfficeCity('');
      setNewOfficeState('');
      setNewOfficePin('');
      setNewLatitude('');
      setNewLongitude('');
      setNewRadiusMeters(100);
      setNewOfficeStartTime('10:00 AM');
      setNewOfficeEndTime('05:30 PM');
      setNewBreakAllowance(60);
      setNewGracePeriod(15);
      alert(`Office "${newOfficeName}" registered successfully!`);
    }
  };

  const handleDeleteOffice = async (id: string, name: string) => {
    if (offices.length <= 1) {
      alert('Cannot delete the primary office. At least one office must exist in the system.');
      return;
    }
    if (confirm(`Are you sure you want to remove "${name}" from the system?`)) {
      await deleteOffice(id);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Restricted Super Admin Area</h3>
        <p className="text-xs text-slate-500 mt-1">
          Only Super Administrators hold system authority to create offices and calibrate GPS geofences.
        </p>
      </div>
    );
  }

  const excessBreakThreshold = Number(breakAllowance) + Number(gracePeriod);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Office & Geofence Calibration Desk
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-900">
              Super Admin Authority
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Register multiple office divisions, configure distinct locality addresses, geofence radius boundaries, and working timings.
          </p>
        </div>

        {/* Action: Add Office Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Office / Division</span>
        </button>
      </div>

      {/* Multi-Office Overview Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Registered Office Jurisdictions ({offices.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Select an office below to calibrate its coordinates & policy rules
          </span>
        </div>

        {offices.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No Offices Registered Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Register your organization's primary office or branch divisions to calibrate GPS geofence boundaries and policy timings.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Office</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {offices.map((off) => {
              const isSelected = off.id === selectedOfficeId;
              const displayLoc = off.locality || off.office_locality || '';
              const displayCity = off.city || off.office_city || '';
              const displayAddress = [displayLoc, displayCity].filter(Boolean).join(', ') || off.address;

              return (
                <div
                  key={off.id}
                  onClick={() => handleOfficeSelect(off.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {off.office_name}
                        </h4>
                        {off.office_code && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono bg-blue-100 text-blue-800 border border-blue-200 flex-shrink-0">
                            {off.office_code}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {displayAddress}
                      </p>
                    </div>
                    {isSelected ? (
                      <span className="p-1 rounded-full bg-indigo-600 text-white flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOffice(off.id, off.office_name);
                        }}
                        title="Delete office"
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[10px] font-mono text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-indigo-500" />
                      {off.latitude.toFixed(4)}, {off.longitude.toFixed(4)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                      {off.radius_meters || off.geofence_radius || 100}m Radius
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            Office calibration updated successfully! Mobile application geofence and break thresholds are now calibrated for {officeName}.
          </span>
        </div>
      )}

      {/* Main Calibration Form for Selected Office */}
      {!activeOffice ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">No Office Selected</h4>
          <p className="text-xs text-slate-500 mt-1">
            Please register or select an office above to calibrate its geofence and attendance rules.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSaveCalibration} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: Office Details & GPS Geofence */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Geofence & Location Details</h3>
                <p className="text-[11px] text-slate-500">Office address breakdown & GPS coordinates</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Office Official Name *
                </label>
                <input
                  type="text"
                  required
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  placeholder="e.g. Tripura Jal Board - Headquarters"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Office Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={officeCode}
                  onChange={(e) => setOfficeCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TJB"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold uppercase font-mono tracking-wider focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Short form of the office like Tripura Jal Board as <strong>TJB</strong>
                </span>
              </div>
            </div>

            {/* Separate Address Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Office Locality *
                </label>
                <input
                  type="text"
                  required
                  value={officeLocality}
                  onChange={(e) => setOfficeLocality(e.target.value)}
                  placeholder="e.g. Sakuntala Road / Sector 5"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Office City *
                </label>
                <input
                  type="text"
                  required
                  value={officeCity}
                  onChange={(e) => setOfficeCity(e.target.value)}
                  placeholder="e.g. Agartala"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Office State *
                </label>
                <input
                  type="text"
                  required
                  value={officeState}
                  onChange={(e) => setOfficeState(e.target.value)}
                  placeholder="e.g. Tripura"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Office Area PIN *
                </label>
                <input
                  type="text"
                  required
                  value={officePin}
                  onChange={(e) => setOfficePin(e.target.value)}
                  placeholder="e.g. 799001"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  Geofence Coordinates *
                </label>
                <button
                  type="button"
                  onClick={handleFetchCurrentLocationForMain}
                  disabled={isLocatingMain}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition cursor-pointer disabled:opacity-60"
                >
                  <LocateFixed className={`w-3.5 h-3.5 text-indigo-600 ${isLocatingMain ? 'animate-spin' : ''}`} />
                  <span>{isLocatingMain ? 'Detecting GPS...' : 'Fetch Current GPS on Premises'}</span>
                </button>
              </div>

              {gpsMainStatus && (
                <div
                  className={`mb-2 p-2 rounded-lg text-[11px] flex items-center gap-1.5 font-medium ${
                    gpsMainStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {gpsMainStatus.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  )}
                  <span>{gpsMainStatus.message}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium text-[10px] mb-1">
                    Latitude (°N) *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                    placeholder="23.831500"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium text-[10px] mb-1">
                    Longitude (°E) *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                    placeholder="91.286800"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  Geofence Radius (Meters) *
                </label>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {radiusMeters} m
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>50m (Strict)</span>
                <span>100m (Default)</span>
                <span>500m (Wide Campus)</span>
              </div>
            </div>

            {/* Geofence Status Box */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                <span>Geofence Enforcement Status: ACTIVE</span>
              </div>
              <p>
                Staff mobile devices farther than <strong>{radiusMeters} meters</strong> from ({latitude}, {longitude}) cannot check in or complete breaks.
              </p>
            </div>
          </div>

          {/* Section 2: Office Working Timings & Break Policy */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Office Timings & Break Policy</h3>
                <p className="text-[11px] text-slate-500">Dedicated start/end timings and excess break thresholds</p>
              </div>
            </div>

            {/* Separate Office Start Time & End Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Office Start Time *
                </label>
                <input
                  type="text"
                  required
                  value={officeStartTime}
                  onChange={(e) => setOfficeStartTime(e.target.value)}
                  placeholder="10:00 AM"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">e.g. 10:00 AM</span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Office End Time *
                </label>
                <input
                  type="text"
                  required
                  value={officeEndTime}
                  onChange={(e) => setOfficeEndTime(e.target.value)}
                  placeholder="05:30 PM"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">e.g. 05:30 PM</span>
              </div>
            </div>

            {/* Break Allowance & Grace Period */}
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
              <div>
                <label className="block text-slate-800 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Break Allowance (Minutes) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="15"
                    max="180"
                    required
                    value={breakAllowance}
                    onChange={(e) => setBreakAllowance(parseInt(e.target.value) || 60)}
                    className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 font-mono"
                  />
                  <span className="text-xs text-slate-600 font-medium">Minutes (Standard: 60 min)</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Allowed break duration displayed on employee mobile timer.
                </p>
              </div>

              <div>
                <label className="block text-slate-800 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Grace Period (Minutes) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    required
                    value={gracePeriod}
                    onChange={(e) => setGracePeriod(parseInt(e.target.value) || 15)}
                    className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 font-mono"
                  />
                  <span className="text-xs text-slate-600 font-medium">Minutes Buffer (Standard: 15 min)</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Buffer time before triggering excess break alert notifications.
                </p>
              </div>

              {/* Excess Break Calculation Pill */}
              <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">
                  Excess Break Alert Threshold:
                </span>
                <span className="text-xs font-mono font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  {excessBreakThreshold} minutes
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Automatic Alert Rule:</strong> Any employee whose total break duration exceeds <strong>{excessBreakThreshold} minutes</strong> will immediately trigger the high-priority banner on the Live Attendance Dashboard.
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-950/20 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save & Apply Calibration to {officeName}</span>
          </button>
        </div>
      </form>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW OFFICE / DIVISION                                          */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Add New Office / Branch Division
                  </h3>
                  <p className="text-xs text-slate-500">
                    Register a new office branch with separate locality, timings, and geofence boundary
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateOffice} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Office Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOfficeName}
                    onChange={(e) => setNewOfficeName(e.target.value)}
                    placeholder="e.g. Tripura Jal Board - Headquarters"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Office Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={newOfficeCode}
                    onChange={(e) => setNewOfficeCode(e.target.value.toUpperCase())}
                    placeholder="e.g. TJB"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold uppercase font-mono tracking-wider focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Short form like Tripura Jal Board as <strong>TJB</strong>
                  </span>
                </div>
              </div>

              {/* 4 Separate Address Fields: Locality, City, State, Area PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Office Locality *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOfficeLocality}
                    onChange={(e) => setNewOfficeLocality(e.target.value)}
                    placeholder="e.g. Sakuntala Road / Sector 4"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Office City *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOfficeCity}
                    onChange={(e) => setNewOfficeCity(e.target.value)}
                    placeholder="e.g. Agartala"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Office State *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOfficeState}
                    onChange={(e) => setNewOfficeState(e.target.value)}
                    placeholder="e.g. Tripura"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Office Area PIN *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOfficePin}
                    onChange={(e) => setNewOfficePin(e.target.value)}
                    placeholder="e.g. 799001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Coordinates Section with Fetch GPS Button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    Geofence GPS Coordinates *
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchCurrentLocationForModal}
                    disabled={isLocatingModal}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold transition cursor-pointer disabled:opacity-60"
                  >
                    <LocateFixed className={`w-3.5 h-3.5 text-blue-600 ${isLocatingModal ? 'animate-spin' : ''}`} />
                    <span>{isLocatingModal ? 'Locating...' : 'Fetch Current Lat / Long (On Premises)'}</span>
                  </button>
                </div>

                {gpsModalStatus && (
                  <div
                    className={`mb-2 p-2 rounded-lg text-[11px] flex items-center gap-1.5 font-medium ${
                      gpsModalStatus.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {gpsModalStatus.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                    )}
                    <span>{gpsModalStatus.message}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium text-[10px] mb-1">
                      Latitude (°N) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={newLatitude}
                      onChange={(e) => setNewLatitude(e.target.value)}
                      placeholder="e.g. 23.831500"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium text-[10px] mb-1">
                      Longitude (°E) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={newLongitude}
                      onChange={(e) => setNewLongitude(e.target.value)}
                      placeholder="e.g. 91.286800"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Separate Geofence Radius, Office Start Time, Office End Time (NO Shift Hours) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Geofence Radius (Meters) *
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="500"
                    required
                    value={newRadiusMeters}
                    onChange={(e) => setNewRadiusMeters(parseInt(e.target.value) || 100)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400">Default: 100m</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Office Start Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOfficeStartTime}
                    onChange={(e) => setNewOfficeStartTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400">e.g. 10:00 AM</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Office End Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOfficeEndTime}
                    onChange={(e) => setNewOfficeEndTime(e.target.value)}
                    placeholder="05:30 PM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400">e.g. 05:30 PM</span>
                </div>
              </div>

              {/* Separate Break Allowance & Grace Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Break Allowance (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    required
                    value={newBreakAllowance}
                    onChange={(e) => setNewBreakAllowance(parseInt(e.target.value) || 60)}
                    placeholder="60"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400">Standard allowance: 60m</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Grace Period (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    required
                    value={newGracePeriod}
                    onChange={(e) => setNewGracePeriod(parseInt(e.target.value) || 15)}
                    placeholder="15"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                  />
                  <span className="text-[10px] text-amber-700 font-medium">Alert threshold: {Number(newBreakAllowance) + Number(newGracePeriod)}m</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingOffice}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-60 cursor-pointer"
                >
                  {isCreatingOffice ? 'Creating Office...' : 'Save & Register Office'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
