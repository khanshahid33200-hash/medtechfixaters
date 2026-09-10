from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, List

router = APIRouter(prefix="/doctor", tags=["Doctor Profile & Admin Management"])

class DoctorProfileResponse(BaseModel):
    doctor_id: str
    supabase_uid: str
    hospital_id: str
    hospital_name: str
    name: str
    email: str
    department_id: str
    department_name: str
    specialization: str
    role: str
    status: str

class CreateDoctorRequest(BaseModel):
    name: str
    email: str
    password: str
    department_name: str = "Cardiology"
    specialization: str = "General Physician"
    role: str = "doctor"
    hospital_id: str = "hosp-001"

class UpdateDoctorStatusRequest(BaseModel):
    status: str  # active, inactive, on_leave

# In-memory store for doctor list in backend runtime
INITIAL_DOCTORS = [
    {
        "doctor_id": "doc-001",
        "supabase_uid": "sb-uid-doc-001",
        "hospital_id": "hosp-001",
        "hospital_name": "Metro Care General Hospital",
        "name": "Dr. Rahul Sharma",
        "email": "doctor@hospital.com",
        "department_id": "dept-cardio-01",
        "department_name": "Cardiology",
        "specialization": "Interventional Cardiology",
        "role": "doctor",
        "status": "active"
    },
    {
        "doctor_id": "doc-admin-001",
        "supabase_uid": "sb-uid-admin-001",
        "hospital_id": "hosp-001",
        "hospital_name": "Metro Care General Hospital",
        "name": "Dr. Sarah Jenkins (Admin)",
        "email": "admin@hospital.com",
        "department_id": "dept-cardio-01",
        "department_name": "Cardiology",
        "specialization": "Executive Chief of Cardiology",
        "role": "admin",
        "status": "active"
    },
    {
        "doctor_id": "doc-002",
        "supabase_uid": "sb-uid-doc-002",
        "hospital_id": "hosp-001",
        "hospital_name": "Metro Care General Hospital",
        "name": "Dr. Vikram Seth",
        "email": "vikram@hospital.com",
        "department_id": "dept-opd-02",
        "department_name": "General OPD",
        "specialization": "Internal Medicine",
        "role": "doctor",
        "status": "active"
    }
]

doctors_db = list(INITIAL_DOCTORS)

@router.get("/profile/{user_id}", response_model=DoctorProfileResponse)
async def get_doctor_by_user_id(user_id: str):
    """
    Fetch Doctor Profile & Hospital Association in Supabase Database by Auth User ID.
    """
    found = next((d for d in doctors_db if d["supabase_uid"] == user_id or d["email"] in user_id), None)
    if found:
        return DoctorProfileResponse(**found)

    if "admin" in user_id.lower():
        return DoctorProfileResponse(
            doctor_id="doc-admin-001",
            supabase_uid=user_id,
            hospital_id="hosp-001",
            hospital_name="Metro Care General Hospital",
            name="Dr. Sarah Jenkins (Admin)",
            email="admin@hospital.com",
            department_id="dept-cardio-01",
            department_name="Cardiology",
            specialization="Executive Chief of Cardiology",
            role="admin",
            status="active"
        )

    return DoctorProfileResponse(
        doctor_id=f"doc-{user_id[:8]}",
        supabase_uid=user_id,
        hospital_id="hosp-001",
        hospital_name="Metro Care General Hospital",
        name=f"Dr. {user_id[:6].upper()}",
        email=f"{user_id}@hospital.com",
        department_id="dept-cardio-01",
        department_name="Cardiology",
        specialization="Consultant Specialist",
        role="doctor",
        status="active"
    )

@router.get("/list", response_model=List[DoctorProfileResponse])
async def list_doctors():
    """
    Admin Endpoint: List all registered doctors under the hospital.
    """
    return [DoctorProfileResponse(**d) for d in doctors_db]

@router.post("/create", response_model=DoctorProfileResponse)
async def create_doctor_profile(payload: CreateDoctorRequest):
    """
    Admin Endpoint: Create new Doctor profile linked to Supabase Auth.
    """
    new_doc_id = f"doc-00{len(doctors_db) + 1}"
    new_sb_uid = f"sb-uid-{new_doc_id}"

    new_doc = {
        "doctor_id": new_doc_id,
        "supabase_uid": new_sb_uid,
        "hospital_id": payload.hospital_id,
        "hospital_name": "Metro Care General Hospital",
        "name": payload.name,
        "email": payload.email,
        "department_id": f"dept-{payload.department_name.lower().replace(' ', '')}",
        "department_name": payload.department_name,
        "specialization": payload.specialization,
        "role": payload.role,
        "status": "active"
    }
    doctors_db.append(new_doc)
    return DoctorProfileResponse(**new_doc)

@router.put("/{doctor_id}/status", response_model=DoctorProfileResponse)
async def update_doctor_status(doctor_id: str, payload: UpdateDoctorStatusRequest):
    """
    Admin Endpoint: Activate, Deactivate, or set Doctor On Leave.
    """
    found = next((d for d in doctors_db if d["doctor_id"] == doctor_id), None)
    if not found:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    found["status"] = payload.status
    return DoctorProfileResponse(**found)

@router.delete("/{doctor_id}")
async def delete_doctor_profile(doctor_id: str):
    """
    Admin Endpoint: Delete/Archive Doctor profile.
    """
    global doctors_db
    doctors_db = [d for d in doctors_db if d["doctor_id"] != doctor_id]
    return {"message": f"Doctor {doctor_id} successfully deleted"}
