export const COMPANY_NAME = "MTR PUBLICATION AND PRODUCTION";

export const BASE_UNITS = [
  "Unit Penulisan",
  "Unit Video",
  "Unit Audio / Muzik",
  "Unit Penyuntingan",
  "Unit Ilustrasi",
  "Unit Pengurusan Media Sosial dan ICT",
  "Unit Konsultasi",
  "Unit Pengurusan Jual Beli",
];

export type UserProfile = {
  id: string;
  username: string;
  full_name: string;
  role: "admin" | "pekerja";
  unit: string;
  is_unit_head: boolean;
  avatar_url: string;
  created_at: string;
};
