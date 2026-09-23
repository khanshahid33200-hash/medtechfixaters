import React, { useState } from "react";
import { PatientIntake } from "../../types/booking";
import { User, Phone, Calendar, ArrowRight, FileText } from "lucide-react";
import { validateName, validatePhone, validateAge } from "../../utils/validation";

interface PatientDetailsProps {
  initialIntake?: PatientIntake;
  onSubmitDetails: (intake: PatientIntake) => void;
}

export const PatientDetails: React.FC<PatientDetailsProps> = ({
  initialIntake,
  onSubmitDetails,
}) => {
  const [fullName, setFullName] = useState(initialIntake?.fullName || "");
  const [phone, setPhone] = useState(initialIntake?.contactNumber || "");
  const [age, setAge] = useState(initialIntake?.age || 30);
  const [gender, setGender] = useState(initialIntake?.gender || "Male");
  const [primaryConcern, setPrimaryConcern] = useState(
    initialIntake?.primaryConcern || ""
  );

  const [errors, setErrors] = useState<{ fullName?: string; phone?: string; age?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { fullName?: string; phone?: string; age?: string } = {};

    const nameCheck = validateName(fullName);
    if (!nameCheck.isValid) newErrors.fullName = nameCheck.error;

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.isValid) newErrors.phone = phoneCheck.error;

    const ageCheck = validateAge(age);
    if (!ageCheck.isValid) newErrors.age = ageCheck.error;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmitDetails({
      fullName: fullName.trim(),
      contactNumber: phoneCheck.cleaned,
      age: ageCheck.ageNum,
      gender,
      primaryConcern: primaryConcern.trim(),
      symptoms: primaryConcern ? [primaryConcern.trim()] : [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-[#1D1D1F]">Patient Details</h3>
        <p className="text-xs text-[#6E6E73]">
          Please enter patient information for OPD token registration
        </p>
      </div>

      <div className="space-y-3.5 bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-white/90 shadow-sm">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
            Full Name *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
            />
          </div>
          {errors.fullName && (
            <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
            Mobile Number *
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
            />
          </div>
          {errors.phone && (
            <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Age & Gender */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
              Age (Years) *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="number"
                min={1}
                max={120}
                required
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Primary Health Concern */}
        <div>
          <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
            Reason for Visit / Symptoms (Optional)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={primaryConcern}
              onChange={(e) => setPrimaryConcern(e.target.value)}
              placeholder="e.g. Fever for 2 days, back pain"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-[#1D1D1F] focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3.5 px-4 rounded-2xl bg-[#007AFF] hover:bg-[#0062D6] active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#007AFF]/25 transition-all duration-200"
      >
        <span>Proceed to Next Step</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
};
