export type Role = "SystemAdmin" | "BranchManager" | "AwarenessEmployee";

export type UserProfile = {
  uid: string;
  role: Role;
  fullName: string;
  employeeCode: string;
  branchId?: string;
  isActive?: boolean;
  photoURL?: string;
};

export type Donor = {
  id?: string;
  fullName: string;
  idCardImageUrl: string;
  awarenessEmployeeId: string;
  awarenessEmployeeName: string;
  awarenessEmployeeCode: string;
  donationNumber: string;
  createdAt: number;
  status?: "registered" | "arrived" | "donation_completed" | "not_donated" | "deferred";
  arrivedAt?: number;
};

export type DonorStatusHistory = {
  id?: string;
  donorId: string;
  donationNumber: string;
  status: Donor["status"];
  changedAt: number;
  changedByUid: string;
  note?: string;
};

export type DeferralReason = {
  id?: string;
  code: string;
  title: string;
  isActive: boolean;
};

export type DonorDeferral = {
  id?: string;
  donorId: string;
  donationNumber: string;
  reasons: string[];
  hematocrit?: number;
  systolic?: number;
  temperature?: number;
  weight?: number;
  createdAt: number;
  createdByUid: string;
};

export type Booking = {
  id?: string;
  donorId: string;
  donationNumber: string;
  donorName: string;
  bookingDate: string; // YYYY-MM-DD
  bookingNumber: number; // 1..500
  qrPayload: { bookingId: string; donationNumber: string; bookingNumber: number; bookingDate: string };
  createdAt: number;
};

export type Attendance = {
  id?: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  start: { ts: number; lat: number; lng: number };
  end?: { ts: number; lat: number; lng: number };
};

export type EducationMaterial = {
  id?: string;
  type: "article" | "faq" | "video" | "image";
  title: string;
  body?: string;
  url?: string;
  createdAt: number;
  updatedAt: number;
};

export type Notification = {
  id?: string;
  type: "donor_registered" | "system";
  message: string;
  createdAt: number;
  readBy?: string[]; // uids
};
