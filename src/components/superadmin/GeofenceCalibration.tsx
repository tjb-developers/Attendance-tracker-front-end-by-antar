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
import { ClockTimePicker, parseTimeToParts, buildTimeOutputs } from '../common/ClockTimePicker';

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
  const [officeStartTimeIso, setOfficeStartTimeIso] = useState<string>('');
  const [officeEndTime, setOfficeEndTime] = useState(activeOffice?.office_end_time || activeOffice?.shift_end_time || '05:30 PM');
  const [officeEndTimeIso, setOfficeEndTimeIso] = useState<string>('');
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
  const [newOfficeStartTimeIso, setNewOfficeStartTimeIso] = useState<string>('');
  const [newOfficeEndTime, setNewOfficeEndTime] = useState('05:30 PM');
  const [newOfficeEndTimeIso, setNewOfficeEndTimeIso] = useState<string>('');
  const [newBreakAllowance, setNewBreakAllowance] = useState(60);
  const [newGracePeriod, setNewGracePeriod] = useState(15);
  const [isCreatingOffice, setIsCreatingOffice] = useState(false);

  // Field validation error states
  const [modalErrors, setModalErrors] = useState<Record<string, string>>({});
  const [mainErrors, setMainErrors] = useState<Record<string, string>>({});

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
      setOfficeStartTimeIso('');
      setOfficeEndTime(current.office_end_time || current.shift_end_time || '05:30 PM');
      setOfficeEndTimeIso('');
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
      setOfficeStartTimeIso('');
      setOfficeEndTime(off.office_end_time || off.shift_end_time || '05:30 PM');
      setOfficeEndTimeIso('');
      setBreakAllowance(off.break_allowance || off.standard_break_allowance_minutes || 60);
      setGracePeriod(off.grace_period || off.break_grace_period_minutes || 15);
      setSaveSuccess(false);
    }
  };

  // Comprehensive field validation helper
  const validateOfficeInputs = (data: {
    name: string;
    code: string;
    locality: string;
    city: string;
    state: string;
    pin: string;
    lat: string | number;
    lng: string | number;
    radius: string | number;
    startTime: string;
    endTime: string;
    breakMin: string | number;
    graceMin: string | number;
  }) => {
    const errs: Record<string, string> = {};

    if (!data.name.trim()) {
      errs.name = 'Office Official Name is required.';
    } else if (data.name.trim().length < 2) {
      errs.name = 'Office Name must be at least 2 characters.';
    }

    if (!data.code.trim()) {
      errs.code = 'Office Code is required (e.g. TJB).';
    } else if (data.code.trim().length < 2) {
      errs.code = 'Office Code should be at least 2 characters (e.g. TJB).';
    }

    if (!data.locality.trim()) {
      errs.locality = 'Office Locality is required.';
    } else if (data.locality.trim().length < 2) {
      errs.locality = 'Locality must be at least 2 characters.';
    }

    if (!data.city.trim()) {
      errs.city = 'Office City is required.';
    } else if (data.city.trim().length < 2) {
      errs.city = 'City must be at least 2 characters.';
    }

    if (!data.state.trim()) {
      errs.state = 'Office State is required.';
    } else if (data.state.trim().length < 2) {
      errs.state = 'State must be at least 2 characters.';
    }

    // Strict 6-digit PIN validation
    const pinStr = String(data.pin).trim();
    if (!pinStr) {
      errs.pin = 'Office Area PIN is required.';
    } else if (!/^\d{6}$/.test(pinStr)) {
      errs.pin = 'PIN must be exactly a 6-digit number (e.g. 799001).';
    }

    const latNum = typeof data.lat === 'number' ? data.lat : parseFloat(data.lat);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      errs.lat = 'Valid Latitude between -90.0 and 90.0 is required.';
    }

    const lngNum = typeof data.lng === 'number' ? data.lng : parseFloat(data.lng);
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      errs.lng = 'Valid Longitude between -180.0 and 180.0 is required.';
    }

    const radNum = typeof data.radius === 'number' ? data.radius : parseInt(String(data.radius), 10);
    if (isNaN(radNum) || radNum < 10 || radNum > 50000) {
      errs.radius = 'Geofence radius must be between 10m and 50,000m.';
    }

    if (!data.startTime.trim()) {
      errs.startTime = 'Office Start Time is required (e.g. 10:00 AM).';
    }

    if (!data.endTime.trim()) {
      errs.endTime = 'Office End Time is required (e.g. 05:30 PM).';
    }

    const bNum = typeof data.breakMin === 'number' ? data.breakMin : parseInt(String(data.breakMin), 10);
    if (isNaN(bNum) || bNum < 0 || bNum > 480) {
      errs.breakMin = 'Break allowance must be between 0 and 480 minutes.';
    }

    const gNum = typeof data.graceMin === 'number' ? data.graceMin : parseInt(String(data.graceMin), 10);
    if (isNaN(gNum) || gNum < 0 || gNum > 120) {
      errs.graceMin = 'Grace period must be between 0 and 120 minutes.';
    }

    return errs;
  };

  const handleSaveCalibration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOffice) return;

    const errors = validateOfficeInputs({
      name: officeName,
      code: officeCode,
      locality: officeLocality,
      city: officeCity,
      state: officeState,
      pin: String(officePin),
      lat: latitude,
      lng: longitude,
      radius: radiusMeters,
      startTime: officeStartTime,
      endTime: officeEndTime,
      breakMin: breakAllowance,
      graceMin: gracePeriod,
    });

    if (Object.keys(errors).length > 0) {
      setMainErrors(errors);
      const firstMsg = Object.values(errors)[0];
      alert(`Validation Error:\n• ${firstMsg}`);
      return;
    }
    setMainErrors({});

    const formattedAddress = [officeLocality, officeCity, officeState, String(officePin)].filter(Boolean).join(', ') || activeOffice.address;

    const startParts = parseTimeToParts(officeStartTime, 10, 0, 'AM');
    const computedStart = buildTimeOutputs(startParts.hour, startParts.minute, startParts.ampm);

    const endParts = parseTimeToParts(officeEndTime, 5, 30, 'PM');
    const computedEnd = buildTimeOutputs(endParts.hour, endParts.minute, endParts.ampm);

    await updateOfficeCalibration(activeOffice.id, {
      office_name: officeName.trim(),
      name: officeName.trim(),
      office_code: officeCode.trim().toUpperCase(),
      code: officeCode.trim().toUpperCase(),
      address: formattedAddress,
      locality: officeLocality.trim(),
      office_locality: officeLocality.trim(),
      city: officeCity.trim(),
      office_city: officeCity.trim(),
      state: officeState.trim(),
      office_state: officeState.trim(),
      pin: String(officePin).trim(),
      office_pin: String(officePin).trim(),
      latitude: Number(latitude),
      office_lat: Number(latitude),
      longitude: Number(longitude),
      office_long: Number(longitude),
      radius_meters: Number(radiusMeters),
      geofence_radius: Number(radiusMeters),
      office_start_time: officeStartTimeIso || computedStart.isoTimestamp,
      shift_start_time: computedStart.display12h,
      office_end_time: officeEndTimeIso || computedEnd.isoTimestamp,
      shift_end_time: computedEnd.display12h,
      standard_break_allowance_minutes: Number(breakAllowance),
      break_allowance: Number(breakAllowance),
      break_allowence: Number(breakAllowance),
      break_grace_period_minutes: Number(gracePeriod),
      grace_period: Number(gracePeriod),
      office_grace_period: Number(gracePeriod),
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleCreateOffice = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateOfficeInputs({
      name: newOfficeName,
      code: newOfficeCode,
      locality: newOfficeLocality,
      city: newOfficeCity,
      state: newOfficeState,
      pin: newOfficePin,
      lat: newLatitude,
      lng: newLongitude,
      radius: newRadiusMeters,
      startTime: newOfficeStartTime,
      endTime: newOfficeEndTime,
      breakMin: newBreakAllowance,
      graceMin: newGracePeriod,
    });

    if (Object.keys(errors).length > 0) {
      setModalErrors(errors);
      const firstMsg = Object.values(errors)[0];
      alert(`Validation Error:\n• ${firstMsg}`);
      return;
    }
    setModalErrors({});

    const lat = parseFloat(newLatitude);
    const lng = parseFloat(newLongitude);
    const formattedAddress = `${newOfficeLocality.trim()}, ${newOfficeCity.trim()}, ${newOfficeState.trim()} - ${newOfficePin.trim()}`;

    const startParts = parseTimeToParts(newOfficeStartTime, 10, 0, 'AM');
    const computedStart = buildTimeOutputs(startParts.hour, startParts.minute, startParts.ampm);

    const endParts = parseTimeToParts(newOfficeEndTime, 5, 30, 'PM');
    const computedEnd = buildTimeOutputs(endParts.hour, endParts.minute, endParts.ampm);

    setIsCreatingOffice(true);
    const success = await addOffice({
      office_name: newOfficeName.trim(),
      name: newOfficeName.trim(),
      office_code: newOfficeCode.trim().toUpperCase(),
      code: newOfficeCode.trim().toUpperCase(),
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
      office_lat: lat,
      longitude: lng,
      office_long: lng,
      radius_meters: Number(newRadiusMeters) || 100,
      geofence_radius: Number(newRadiusMeters) || 100,
      time_zone: 'Asia/Kolkata',
      working_days: [1, 2, 3, 4, 5, 6],
      standard_break_allowance_minutes: Number(newBreakAllowance) || 60,
      break_allowance: Number(newBreakAllowance) || 60,
      break_allowence: Number(newBreakAllowance) || 60,
      break_grace_period_minutes: Number(newGracePeriod) || 15,
      grace_period: Number(newGracePeriod) || 15,
      office_grace_period: Number(newGracePeriod) || 15,
      shift_start_time: computedStart.display12h,
      office_start_time: newOfficeStartTimeIso || computedStart.isoTimestamp,
      shift_end_time: computedEnd.display12h,
      office_end_time: newOfficeEndTimeIso || computedEnd.isoTimestamp,
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
      setNewOfficeStartTimeIso('');
      setNewOfficeEndTime('05:30 PM');
      setNewOfficeEndTimeIso('');
      setModalErrors({});
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
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${isSelected
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
          {Object.keys(mainErrors).length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>Please correct the errors in the highlighted fields below before saving.</span>
            </div>
          )}
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
                    onChange={(e) => {
                      setOfficeName(e.target.value);
                      if (mainErrors.name) setMainErrors((p) => { const n = { ...p }; delete n.name; return n; });
                    }}
                    placeholder="e.g. Tripura Jal Board - Headquarters"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none ${mainErrors.name ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                      }`}
                  />
                  {mainErrors.name && (
                    <span className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      {mainErrors.name}
                    </span>
                  )}
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
                    onChange={(e) => {
                      setOfficeCode(e.target.value.toUpperCase());
                      if (mainErrors.code) setMainErrors((p) => { const n = { ...p }; delete n.code; return n; });
                    }}
                    placeholder="e.g. TJB"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-bold uppercase font-mono tracking-wider focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none ${mainErrors.code ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                      }`}
                  />
                  {mainErrors.code ? (
                    <span className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      {mainErrors.code}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Short form like Tripura Jal Board as <strong>TJB</strong>
                    </span>
                  )}
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
                    onChange={(e) => {
                      setOfficeLocality(e.target.value);
                      if (mainErrors.locality) setMainErrors((p) => { const n = { ...p }; delete n.locality; return n; });
                    }}
                    placeholder="e.g. Sakuntala Road / Sector 5"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none ${mainErrors.locality ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                      }`}
                  />
                  {mainErrors.locality && (
                    <span className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      {mainErrors.locality}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Office City *
                  </label>
                  <input
                    type="text"
                    required
                    value={officeCity}
                    onChange={(e) => {
                      setOfficeCity(e.target.value);
                      if (mainErrors.city) setMainErrors((p) => { const n = { ...p }; delete n.city; return n; });
                    }}
                    placeholder="e.g. Agartala"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none ${mainErrors.city ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                      }`}
                  />
                  {mainErrors.city && (
                    <span className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      {mainErrors.city}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Office State *
                  </label>
                  <input
                    type="text"
                    required
                    value={officeState}
                    onChange={(e) => {
                      setOfficeState(e.target.value);
                      if (mainErrors.state) setMainErrors((p) => { const n = { ...p }; delete n.state; return n; });
                    }}
                    placeholder="e.g. Tripura"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none ${mainErrors.state ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                      }`}
                  />
                  {mainErrors.state && (
                    <span className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      {mainErrors.state}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Office Area PIN (6 Digits) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    value={officePin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOfficePin(val);
                      if (mainErrors.pin) setMainErrors((p) => { const n = { ...p }; delete n.pin; return n; });
                    }}
                    placeholder="e.g. 799001"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none ${mainErrors.pin ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                      }`}
                  />
                  {mainErrors.pin ? (
                    <span className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      {mainErrors.pin}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Must be exactly 6 digits (e.g. <strong>799001</strong>)
                    </span>
                  )}
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
                    className={`mb-2 p-2 rounded-lg text-[11px] flex items-center gap-1.5 font-medium ${gpsMainStatus.type === 'success'
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
                      onChange={(e) => {
                        setLatitude(parseFloat(e.target.value));
                        if (mainErrors.lat) setMainErrors((p) => { const n = { ...p }; delete n.lat; return n; });
                      }}
                      placeholder="23.831500"
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-lg font-mono text-xs focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none ${mainErrors.lat ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                        }`}
                    />
                    {mainErrors.lat && (
                      <span className="text-[10px] text-rose-600 font-semibold mt-1 block">
                        {mainErrors.lat}
                      </span>
                    )}
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
                      onChange={(e) => {
                        setLongitude(parseFloat(e.target.value));
                        if (mainErrors.lng) setMainErrors((p) => { const n = { ...p }; delete n.lng; return n; });
                      }}
                      placeholder="91.286800"
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-lg font-mono text-xs focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none ${mainErrors.lng ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                        }`}
                    />
                    {mainErrors.lng && (
                      <span className="text-[10px] text-rose-600 font-semibold mt-1 block">
                        {mainErrors.lng}
                      </span>
                    )}
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
                  onChange={(e) => {
                    setRadiusMeters(parseInt(e.target.value));
                    if (mainErrors.radius) setMainErrors((p) => { const n = { ...p }; delete n.radius; return n; });
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>50m (Strict)</span>
                  <span>100m (Default)</span>
                  <span>500m (Wide Campus)</span>
                </div>
                {mainErrors.radius && (
                  <span className="text-[10px] text-rose-600 font-semibold mt-1 block">
                    {mainErrors.radius}
                  </span>
                )}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ClockTimePicker
                  label="Office Start Time"
                  value={officeStartTime}
                  onChange={(display12h, iso) => {
                    setOfficeStartTime(display12h);
                    setOfficeStartTimeIso(iso);
                    if (mainErrors.startTime) setMainErrors((p) => { const n = { ...p }; delete n.startTime; return n; });
                  }}
                  required
                  error={mainErrors.startTime}
                  hint="Select hours, minutes, and AM/PM"
                />

                <ClockTimePicker
                  label="Office End Time"
                  value={officeEndTime}
                  onChange={(display12h, iso) => {
                    setOfficeEndTime(display12h);
                    setOfficeEndTimeIso(iso);
                    if (mainErrors.endTime) setMainErrors((p) => { const n = { ...p }; delete n.endTime; return n; });
                  }}
                  required
                  error={mainErrors.endTime}
                  hint="Select hours, minutes, and AM/PM"
                />
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
                      min="0"
                      max="480"
                      required
                      value={breakAllowance}
                      onChange={(e) => {
                        setBreakAllowance(parseInt(e.target.value) || 0);
                        if (mainErrors.breakMin) setMainErrors((p) => { const n = { ...p }; delete n.breakMin; return n; });
                      }}
                      className={`w-24 px-3 py-1.5 bg-white border rounded-lg text-xs font-bold text-slate-900 font-mono ${mainErrors.breakMin ? 'border-rose-500' : 'border-slate-300'
                        }`}
                    />
                    <span className="text-xs text-slate-600 font-medium">Minutes (Standard: 60 min)</span>
                  </div>
                  {mainErrors.breakMin ? (
                    <span className="text-[10px] text-rose-600 font-semibold mt-1 block">{mainErrors.breakMin}</span>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Allowed break duration displayed on employee mobile timer.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-800 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Grace Period (Minutes) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="120"
                      required
                      value={gracePeriod}
                      onChange={(e) => {
                        setGracePeriod(parseInt(e.target.value) || 0);
                        if (mainErrors.graceMin) setMainErrors((p) => { const n = { ...p }; delete n.graceMin; return n; });
                      }}
                      className={`w-24 px-3 py-1.5 bg-white border rounded-lg text-xs font-bold text-slate-900 font-mono ${mainErrors.graceMin ? 'border-rose-500' : 'border-slate-300'
                        }`}
                    />
                    <span className="text-xs text-slate-600 font-medium">Minutes Buffer (Standard: 15 min)</span>
                  </div>
                  {mainErrors.graceMin ? (
                    <span className="text-[10px] text-rose-600 font-semibold mt-1 block">{mainErrors.graceMin}</span>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Buffer time before triggering excess break alert notifications.
                    </p>
                  )}
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
              {Object.keys(modalErrors).length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>Please fix the highlighted errors below before registering this office.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Office Official Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOfficeName}
                    onChange={(e) => {
                      setNewOfficeName(e.target.value);
                      if (modalErrors.name) setModalErrors((p) => { const n = { ...p }; delete n.name; return n; });
                    }}
                    placeholder="e.g. Tripura Jal Board - Headquarters"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none ${modalErrors.name ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                      }`}
                  />
                  {modalErrors.name && (
                    <span className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      {modalErrors.name}
                    </span>
                  )}
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
                    onChange={(e) => {
                      setNewOfficeCode(e.target.value.toUpperCase());
                      if (modalErrors.code) setModalErrors((p) => { const n = { ...p }; delete n.code; return n; });
                    }}
                    placeholder="e.g. TJB"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-xs font-bold uppercase font-mono tracking-wider focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none ${modalErrors.code ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                      }`}
                  />
                  {modalErrors.code ? (
                    <span className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      {modalErrors.code}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Short form like Tripura Jal Board as <strong>TJB</strong>
                    </span>
                  )}
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
                    onChange={(e) => {
                      setNewOfficeLocality(e.target.value);
                      if (modalErrors.locality) setModalErrors((p) => { const n = { ...p }; delete n.locality; return n; });
                    }}
                    placeholder="e.g. Sakuntala Road / Sector 4"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none ${modalErrors.locality ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                      }`}
                  />
                  {modalErrors.locality && (
                    <span className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      {modalErrors.locality}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Office City *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOfficeCity}
                    onChange={(e) => {
                      setNewOfficeCity(e.target.value);
                      if (modalErrors.city) setModalErrors((p) => { const n = { ...p }; delete n.city; return n; });
                    }}
                    placeholder="e.g. Agartala"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none ${modalErrors.city ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                      }`}
                  />
                  {modalErrors.city && (
                    <span className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      {modalErrors.city}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Office State *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOfficeState}
                    onChange={(e) => {
                      setNewOfficeState(e.target.value);
                      if (modalErrors.state) setModalErrors((p) => { const n = { ...p }; delete n.state; return n; });
                    }}
                    placeholder="e.g. Tripura"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none ${modalErrors.state ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                      }`}
                  />
                  {modalErrors.state && (
                    <span className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      {modalErrors.state}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Office Area PIN (6 Digits) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    value={newOfficePin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setNewOfficePin(val);
                      if (modalErrors.pin) setModalErrors((p) => { const n = { ...p }; delete n.pin; return n; });
                    }}
                    placeholder="e.g. 799001"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none ${modalErrors.pin ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                      }`}
                  />
                  {modalErrors.pin ? (
                    <span className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      {modalErrors.pin}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Must be exactly 6 digits (e.g. <strong>799001</strong>)
                    </span>
                  )}
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
                    className={`mb-2 p-2 rounded-lg text-[11px] flex items-center gap-1.5 font-medium ${gpsModalStatus.type === 'success'
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
                      onChange={(e) => {
                        setNewLatitude(e.target.value);
                        if (modalErrors.lat) setModalErrors((p) => { const n = { ...p }; delete n.lat; return n; });
                      }}
                      placeholder="e.g. 23.831500"
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg font-mono text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none ${modalErrors.lat ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                        }`}
                    />
                    {modalErrors.lat && (
                      <span className="text-[10px] text-rose-600 font-semibold mt-1 block">{modalErrors.lat}</span>
                    )}
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
                      onChange={(e) => {
                        setNewLongitude(e.target.value);
                        if (modalErrors.lng) setModalErrors((p) => { const n = { ...p }; delete n.lng; return n; });
                      }}
                      placeholder="e.g. 91.286800"
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg font-mono text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none ${modalErrors.lng ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                        }`}
                    />
                    {modalErrors.lng && (
                      <span className="text-[10px] text-rose-600 font-semibold mt-1 block">{modalErrors.lng}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Geofence Radius */}
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Geofence Radius (Meters) *
                </label>
                <input
                  type="number"
                  min="10"
                  max="50000"
                  required
                  value={newRadiusMeters}
                  onChange={(e) => {
                    setNewRadiusMeters(parseInt(e.target.value) || 100);
                    if (modalErrors.radius) setModalErrors((p) => { const n = { ...p }; delete n.radius; return n; });
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg font-mono text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none ${modalErrors.radius ? 'border-rose-500' : 'border-slate-300'
                    }`}
                />
                {modalErrors.radius ? (
                  <span className="text-[10px] text-rose-600 font-semibold mt-0.5 block">{modalErrors.radius}</span>
                ) : (
                  <span className="text-[10px] text-slate-400">Default: 100m (Permitted: 10m - 50,000m)</span>
                )}
              </div>

              {/* Office Start Time & End Time with Clock Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ClockTimePicker
                  label="Office Start Time"
                  value={newOfficeStartTime}
                  onChange={(display12h, iso) => {
                    setNewOfficeStartTime(display12h);
                    setNewOfficeStartTimeIso(iso);
                    if (modalErrors.startTime) setModalErrors((p) => { const n = { ...p }; delete n.startTime; return n; });
                  }}
                  required
                  error={modalErrors.startTime}
                  hint="Select hours, minutes, and AM/PM"
                />

                <ClockTimePicker
                  label="Office End Time"
                  value={newOfficeEndTime}
                  onChange={(display12h, iso) => {
                    setNewOfficeEndTime(display12h);
                    setNewOfficeEndTimeIso(iso);
                    if (modalErrors.endTime) setModalErrors((p) => { const n = { ...p }; delete n.endTime; return n; });
                  }}
                  required
                  error={modalErrors.endTime}
                  hint="Select hours, minutes, and AM/PM"
                />
              </div>

              {/* Separate Break Allowance & Grace Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Break Allowance (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="480"
                    required
                    value={newBreakAllowance}
                    onChange={(e) => {
                      setNewBreakAllowance(parseInt(e.target.value) || 0);
                      if (modalErrors.breakMin) setModalErrors((p) => { const n = { ...p }; delete n.breakMin; return n; });
                    }}
                    placeholder="60"
                    className={`w-full px-3 py-2 bg-white border rounded-lg font-mono text-xs ${modalErrors.breakMin ? 'border-rose-500' : 'border-slate-300'
                      }`}
                  />
                  {modalErrors.breakMin ? (
                    <span className="text-[10px] text-rose-600 font-semibold mt-1 block">{modalErrors.breakMin}</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Standard allowance: 60m</span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Grace Period (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    required
                    value={newGracePeriod}
                    onChange={(e) => {
                      setNewGracePeriod(parseInt(e.target.value) || 0);
                      if (modalErrors.graceMin) setModalErrors((p) => { const n = { ...p }; delete n.graceMin; return n; });
                    }}
                    placeholder="15"
                    className={`w-full px-3 py-2 bg-white border rounded-lg font-mono text-xs ${modalErrors.graceMin ? 'border-rose-500' : 'border-slate-300'
                      }`}
                  />
                  {modalErrors.graceMin ? (
                    <span className="text-[10px] text-rose-600 font-semibold mt-1 block">{modalErrors.graceMin}</span>
                  ) : (
                    <span className="text-[10px] text-amber-700 font-medium">Alert threshold: {Number(newBreakAllowance) + Number(newGracePeriod)}m</span>
                  )}
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
