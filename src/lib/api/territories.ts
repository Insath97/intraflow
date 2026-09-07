import api from "./axios-client";

export interface ApiResponse<T = unknown> {
  status: string;
  message: string;
  data: T;
}

export interface Province {
  id: string;
  name: string;
  code: string;
  status: "active" | "inactive";
}

export interface District {
  id: string;
  name: string;
  code: string;
  province_id: string;
  status: "active" | "inactive";
}

export interface DSDivision {
  id: string;
  name: string;
  code: string;
  district_id: string;
  status: "active" | "inactive";
}

export interface GNDivision {
  id: string;
  name: string;
  code: string;
  ds_division_id: string;
  status: "active" | "inactive";
}

export const territoriesApi = {
  getProvinces: () =>
    api.get<ApiResponse<Province[]>>("/territories/provinces"),

  getProvinceById: (id: string) =>
    api.get<ApiResponse<Province>>(`/territories/provinces/${id}`),

  createProvince: (data: Omit<Province, "id">) =>
    api.post<ApiResponse<Province>>("/territories/provinces", data),

  updateProvince: (id: string, data: Partial<Province>) =>
    api.put<ApiResponse<Province>>(`/territories/provinces/${id}`, data),

  deleteProvince: (id: string) =>
    api.delete<ApiResponse<null>>(`/territories/provinces/${id}`),

  getDistricts: (provinceId?: string) => {
    const q = provinceId ? `?province_id=${provinceId}` : "";
    return api.get<ApiResponse<District[]>>(`/territories/districts${q}`);
  },

  getDistrictById: (id: string) =>
    api.get<ApiResponse<District>>(`/territories/districts/${id}`),

  createDistrict: (data: Omit<District, "id">) =>
    api.post<ApiResponse<District>>("/territories/districts", data),

  updateDistrict: (id: string, data: Partial<District>) =>
    api.put<ApiResponse<District>>(`/territories/districts/${id}`, data),

  deleteDistrict: (id: string) =>
    api.delete<ApiResponse<null>>(`/territories/districts/${id}`),

  getDSDivisions: (districtId?: string) => {
    const q = districtId ? `?district_id=${districtId}` : "";
    return api.get<ApiResponse<DSDivision[]>>(`/territories/ds-divisions${q}`);
  },

  getDSDivisionById: (id: string) =>
    api.get<ApiResponse<DSDivision>>(`/territories/ds-divisions/${id}`),

  createDSDivision: (data: Omit<DSDivision, "id">) =>
    api.post<ApiResponse<DSDivision>>("/territories/ds-divisions", data),

  updateDSDivision: (id: string, data: Partial<DSDivision>) =>
    api.put<ApiResponse<DSDivision>>(`/territories/ds-divisions/${id}`, data),

  deleteDSDivision: (id: string) =>
    api.delete<ApiResponse<null>>(`/territories/ds-divisions/${id}`),

  getGNDivisions: (dsDivisionId?: string) => {
    const q = dsDivisionId ? `?ds_division_id=${dsDivisionId}` : "";
    return api.get<ApiResponse<GNDivision[]>>(`/territories/gn-divisions${q}`);
  },

  getGNDivisionById: (id: string) =>
    api.get<ApiResponse<GNDivision>>(`/territories/gn-divisions/${id}`),

  createGNDivision: (data: Omit<GNDivision, "id">) =>
    api.post<ApiResponse<GNDivision>>("/territories/gn-divisions", data),

  updateGNDivision: (id: string, data: Partial<GNDivision>) =>
    api.put<ApiResponse<GNDivision>>(`/territories/gn-divisions/${id}`, data),

  deleteGNDivision: (id: string) =>
    api.delete<ApiResponse<null>>(`/territories/gn-divisions/${id}`),
};
