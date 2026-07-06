import type { Hospital, Patient, User } from "@prisma/client";

export function hospitalToApi(h: Hospital) {
  return {
    resourceType: "Organization",
    id: h.id,
    name: h.name,
    address: [
      {
        line: h.street ? [h.street] : [],
        city: h.city ?? "",
        state: h.state ?? "",
        postalCode: h.postalCode ?? "",
      },
    ],
    telecom: [
      ...(h.phone ? [{ system: "phone", value: h.phone }] : []),
      ...(h.url ? [{ system: "url", value: h.url }] : []),
    ],
    type: [{ coding: [{ display: h.orgType ?? "Hospital" }] }],
    extension: [
      { url: "organization-rating", valueDecimal: h.rating ?? 4 },
      { url: "emergency-services", valueBoolean: h.emergencyServices },
    ],
  };
}

export function patientToApi(p: Patient) {
  return {
    resourceType: "Patient",
    id: p.id,
    hospitalId: p.hospitalId,
    name: [{ use: "official", family: p.lastName, given: [p.firstName] }],
    gender: p.gender,
    birthDate: p.birthDate,
    telecom: [
      ...(p.phone ? [{ system: "phone", value: p.phone, use: "home" }] : []),
      ...(p.email ? [{ system: "email", value: p.email, use: "home" }] : []),
    ],
    address: [
      {
        use: "home",
        line: p.street ? [p.street] : [],
        city: p.city ?? "",
        state: p.state ?? "",
        postalCode: p.postalCode ?? "",
        country: "US",
      },
    ],
    identifier: [{ system: "http://hospital.example.org/patients", value: p.mrn }],
    visitStatus: p.visitStatus,
    room: p.room ?? undefined,
    consultNotes: p.consultNotes ?? undefined,
    admittedAt: p.admittedAt?.toISOString(),
    dischargedAt: p.dischargedAt?.toISOString(),
    lastConsultAt: p.lastConsultAt?.toISOString(),
  };
}

export function userToAuth(u: User) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    hospitalId: u.hospitalId ?? undefined,
    patientId: u.patientId ?? undefined,
    specialization: u.specialization ?? undefined,
    gender: u.gender ?? undefined,
    bloodType: u.bloodType ?? undefined,
    isVerified: u.isVerified,
    createdAt: u.createdAt.toISOString(),
    lastLogin: (u.lastLogin ?? new Date()).toISOString(),
  };
}
