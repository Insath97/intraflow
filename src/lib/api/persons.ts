import api from "./axios-client";

export interface ApiResponse<T = unknown> {
  status: string;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
}

export interface PersonItem {
  id: string;
  registration_no: string;
  full_name: string;
  name_with_initials: string;
  nic_number: string;
  date_of_birth: string;
  age: number;
  gender: "male" | "female" | "other";
  marital_status: "single" | "married" | "divorced" | "widowed";
  contact_number: string;
  email: string;
  address: string;
  province_id: string;
  district_id: string;
  ds_division_id: string;
  gn_division_id: string;
  village: string;
  postal_code: string;
  disability_type: string;
  disability_category: string;
  disability_level: "mild" | "moderate" | "severe" | "profound";
  cause: string;
  date_identified: string;
  certification_status: "certified" | "pending" | "not_certified";
  disability_description: string;
  assistance_required: string[];
  guardian_name: string;
  guardian_relationship: string;
  guardian_contact: string;
  guardian_address: string;
  household_size: number;
  education_level: string;
  employment_status: string;
  occupation: string;
  employer: string;
  monthly_income: number;
  skills: string;
  government_assistance: boolean;
  medical_assistance: boolean;
  education_support: boolean;
  employment_support: boolean;
  equipment_required: string[];
  other_support: string;
  status: "active" | "inactive" | "deceased" | "pending";
  registered_date: string;
  registered_by: string;
  created_at: string;
  updated_at: string;
}

export interface PersonListParams {
  search?: string;
  status?: string;
  district_id?: string;
  province_id?: string;
  disability_type?: string;
  gender?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  size?: number;
}

export const personsApi = {
  getAll: (params?: PersonListParams) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.status) q.set("status", params.status);
    if (params?.district_id) q.set("district_id", params.district_id);
    if (params?.province_id) q.set("province_id", params.province_id);
    if (params?.disability_type) q.set("disability_type", params.disability_type);
    if (params?.gender) q.set("gender", params.gender);
    if (params?.sort_by) q.set("sort_by", params.sort_by);
    if (params?.sort_order) q.set("sort_order", params.sort_order);
    if (params?.page) q.set("page", String(params.page));
    if (params?.size) q.set("size", String(params.size));
    return api.get<ApiResponse<PaginatedResponse<PersonItem>>>(`/persons?${q.toString()}`);
  },

  getById: (id: string) =>
    api.get<ApiResponse<{ person: PersonItem }>>(`/persons/${id}`),

  list: () =>
    api.get<ApiResponse<PersonItem[]>>("/persons/list"),

  create: (data: FormData) =>
    api.post<ApiResponse<{ person: PersonItem }>>("/persons", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  update: (id: string, data: FormData) => {
    data.append("_method", "PUT");
    return api.post<ApiResponse<{ person: PersonItem }>>(`/persons/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/persons/${id}`),

  toggleStatus: (id: string) =>
    api.patch<ApiResponse<{ person: PersonItem }>>(`/persons/${id}/toggle-status`),

  getStats: () =>
    api.get<ApiResponse<{
      total_persons: number;
      active_records: number;
      districts: number;
      registered_this_month: number;
      male_count: number;
      female_count: number;
      other_count: number;
      children_count: number;
      adults_count: number;
      elderly_count: number;
    }>>("/persons/stats"),

  getChartData: () =>
    api.get<ApiResponse<{
      by_district: Array<{ name: string; value: number }>;
      by_gender: Array<{ name: string; value: number }>;
      by_age_group: Array<{ name: string; value: number }>;
      by_disability_type: Array<{ name: string; value: number }>;
      monthly_registrations: Array<{ month: string; count: number }>;
    }>>("/persons/chart-data"),
};
