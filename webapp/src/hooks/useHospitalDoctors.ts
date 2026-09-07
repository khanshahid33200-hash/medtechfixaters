import { useState, useEffect } from "react";
import { DoctorItem, DepartmentItem, HospitalWorkspace } from "../types/appointment";
import { getHospitalByTokenOrId } from "../services/hospitalService";
import { getHospitalDoctors, getHospitalDepartments } from "../services/doctorService";

export function useHospitalDoctors(tokenOrId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hospital, setHospital] = useState<HospitalWorkspace | null>(null);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      if (!tokenOrId || !tokenOrId.trim()) {
        if (!cancelled) {
          setError("No hospital QR booking token provided. Please scan your hospital's display QR code.");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const hosp = await getHospitalByTokenOrId(tokenOrId);

        if (cancelled) return;

        if (!hosp) {
          setError("Hospital facility not found or QR code is invalid/inactive.");
          setHospital(null);
          setDoctors([]);
          setDepartments([]);
          setLoading(false);
          return;
        }

        setHospital(hosp);

        const [docList, deptList] = await Promise.all([
          getHospitalDoctors(hosp.id),
          getHospitalDepartments(hosp.id),
        ]);

        if (cancelled) return;

        setDoctors(docList);
        setDepartments(deptList);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed loading hospital appointment portal.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [tokenOrId]);

  return {
    loading,
    error,
    hospital,
    doctors,
    departments,
  };
}
