import { DoctorItem, DepartmentItem, PatientIntake, DoctorRecommendation } from "../types/appointment";

export async function routePatientWithAI(
  intake: PatientIntake,
  availableDoctors: DoctorItem[],
  departments: DepartmentItem[]
): Promise<DoctorRecommendation> {
  const concern = (intake.primaryConcern || "").toLowerCase();
  const symptomsText = (intake.symptoms || []).join(" ").toLowerCase() + " " + concern;

  // Department matching rules based on clinical concern keywords
  let targetDept = "General Medicine";

  if (
    symptomsText.includes("bone") ||
    symptomsText.includes("joint") ||
    symptomsText.includes("fracture") ||
    symptomsText.includes("back pain") ||
    symptomsText.includes("knee") ||
    symptomsText.includes("spine") ||
    symptomsText.includes("ligament")
  ) {
    targetDept = "Orthopedics";
  } else if (
    symptomsText.includes("skin") ||
    symptomsText.includes("rash") ||
    symptomsText.includes("acne") ||
    symptomsText.includes("itching") ||
    symptomsText.includes("eczema") ||
    symptomsText.includes("allergy")
  ) {
    targetDept = "Dermatology";
  } else if (
    symptomsText.includes("heart") ||
    symptomsText.includes("chest pain") ||
    symptomsText.includes("palpitation") ||
    symptomsText.includes("bp") ||
    symptomsText.includes("blood pressure") ||
    symptomsText.includes("hypertension")
  ) {
    targetDept = "Cardiology";
  } else if (
    symptomsText.includes("child") ||
    symptomsText.includes("baby") ||
    symptomsText.includes("pediatric") ||
    symptomsText.includes("vaccine") ||
    symptomsText.includes("infant")
  ) {
    targetDept = "Pediatrics";
  } else if (
    symptomsText.includes("pregnancy") ||
    symptomsText.includes("gynec") ||
    symptomsText.includes("period") ||
    symptomsText.includes("women")
  ) {
    targetDept = "Gynecology";
  } else if (
    symptomsText.includes("eye") ||
    symptomsText.includes("vision") ||
    symptomsText.includes("cataract") ||
    symptomsText.includes("blur")
  ) {
    targetDept = "Ophthalmology";
  } else if (
    symptomsText.includes("ear") ||
    symptomsText.includes("nose") ||
    symptomsText.includes("throat") ||
    symptomsText.includes("sinus") ||
    symptomsText.includes("ent")
  ) {
    targetDept = "ENT";
  } else if (
    symptomsText.includes("stomach") ||
    symptomsText.includes("digest") ||
    symptomsText.includes("gas") ||
    symptomsText.includes("acid") ||
    symptomsText.includes("vomit") ||
    symptomsText.includes("liver")
  ) {
    targetDept = "Gastroenterology";
  }

  // 1. Search doctors matching the target department within this hospital
  let matchedDoctors = availableDoctors.filter(
    (d) =>
      d.active &&
      (d.department?.toLowerCase().includes(targetDept.toLowerCase()) ||
        d.specialty.toLowerCase().includes(targetDept.toLowerCase()) ||
        d.department_id?.toLowerCase().includes(targetDept.toLowerCase()))
  );

  // 2. If no exact specialty match found, fall back to General Medicine or any active doctor in THIS hospital
  if (matchedDoctors.length === 0) {
    matchedDoctors = availableDoctors.filter(
      (d) =>
        d.active &&
        (d.department?.toLowerCase().includes("general") ||
          d.specialty.toLowerCase().includes("general") ||
          d.specialty.toLowerCase().includes("physician"))
    );
  }

  // 3. Fallback to first available active doctor in this hospital
  const selectedDoc = matchedDoctors[0] || availableDoctors.filter((d) => d.active)[0];

  if (!selectedDoc) {
    throw new Error(
      "No active practitioners are currently available in this hospital facility. Please try booking manually or contact reception."
    );
  }

  const deptName = selectedDoc.department || targetDept;

  const explanation = `Based on the symptoms you reported ("${intake.primaryConcern || "General Health Concern"}"), ${deptName} appears to be the most appropriate starting point for clinical assessment.`;

  return {
    departmentId: selectedDoc.department_id || deptName,
    departmentName: deptName,
    doctorId: selectedDoc.id,
    doctorName: selectedDoc.name,
    specialty: selectedDoc.specialty,
    explanation,
    availability: "Available Today",
    fee: selectedDoc.fee || 500,
  };
}
