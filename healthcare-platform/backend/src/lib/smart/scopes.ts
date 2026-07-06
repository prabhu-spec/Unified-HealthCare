export const SMART_SCOPES = {
  patient: [
    "patient/Patient.read",
    "patient/Observation.read",
    "patient/Condition.read"
  ],
  provider: [
    "user/Patient.read",
    "user/Observation.read",
    "user/Condition.read",
    "user/Encounter.read"
  ],
  admin: ["system/*.read", "system/*.write"]
};
