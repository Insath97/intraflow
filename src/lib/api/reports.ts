import api from "./axios-client";

export interface ApiResponse<T = unknown> {
  status: string;
  message: string;
  data: T;
}

export interface DashboardStats {
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
}

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface MonthlyRegistration {
  month: string;
  count: number;
}

export interface ReportFilters {
  district_id?: string;
  province_id?: string;
  disability_type?: string;
  gender?: string;
  age_group?: string;
  certification_status?: string;
  start_date?: string;
  end_date?: string;
}

export const reportsApi = {
  getStats: () =>
    api.get<ApiResponse<DashboardStats>>("/reports/stats"),

  getPersonsByDistrict: () =>
    api.get<ApiResponse<ChartDataPoint[]>>("/reports/by-district"),

  getPersonsByGender: () =>
    api.get<ApiResponse<ChartDataPoint[]>>("/reports/by-gender"),

  getPersonsByAgeGroup: () =>
    api.get<ApiResponse<ChartDataPoint[]>>("/reports/by-age-group"),

  getPersonsByDisabilityType: () =>
    api.get<ApiResponse<ChartDataPoint[]>>("/reports/by-disability-type"),

  getPersonsByProvince: () =>
    api.get<ApiResponse<ChartDataPoint[]>>("/reports/by-province"),

  getMonthlyRegistrations: () =>
    api.get<ApiResponse<MonthlyRegistration[]>>("/reports/monthly-registrations"),

  getAssistanceReport: () =>
    api.get<ApiResponse<{
      total: number;
      government_assistance: number;
      medical_assistance: number;
      education_support: number;
      employment_support: number;
      certified: number;
      pending: number;
      not_certified: number;
      avg_income: number;
      employed: number;
      unemployed: number;
    }>>("/reports/assistance"),

  generateReport: (filters: ReportFilters) => {
    const q = new URLSearchParams();
    if (filters.district_id) q.set("district_id", filters.district_id);
    if (filters.province_id) q.set("province_id", filters.province_id);
    if (filters.disability_type) q.set("disability_type", filters.disability_type);
    if (filters.gender) q.set("gender", filters.gender);
    if (filters.age_group) q.set("age_group", filters.age_group);
    if (filters.certification_status) q.set("certification_status", filters.certification_status);
    if (filters.start_date) q.set("start_date", filters.start_date);
    if (filters.end_date) q.set("end_date", filters.end_date);
    return api.get<ApiResponse<{ persons: unknown[] }>>(`/reports/generate?${q.toString()}`);
  },
};
