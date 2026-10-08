import { apiFetch } from "./api";

export interface AdminAccount {
  maTaiKhoan: number;
  email: string;
  soDienThoai: string | null;
  role: string;
  trangThai: boolean;
  daXacThucEmail: boolean;
  ngayTao: string;
  anhDaiDien: string | null;
}

export interface PendingRestaurant {
  maNhaHang: number;
  tenNhaHang: string;
  diaChiQuan: string | null;
  trangThaiDuyet: string;
}

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

export function getAdminAccounts(): Promise<AdminAccount[]> {
  return apiFetch("/admin/tai-khoan", {
    headers: authHeaders(),
  });
}

export function lockAccount(id: number) {
  return apiFetch(`/admin/tai-khoan/${id}/khoa`, {
    method: "PUT",
    headers: authHeaders(),
  });
}

export function unlockAccount(id: number) {
  return apiFetch(`/admin/tai-khoan/${id}/mo-khoa`, {
    method: "PUT",
    headers: authHeaders(),
  });
}

export function getPendingRestaurants(): Promise<PendingRestaurant[]> {
  return apiFetch("/admin/nha-hang/cho-duyet", {
    headers: authHeaders(),
  });
}

export function approveRestaurant(id: number) {
  return apiFetch(`/admin/nha-hang/${id}/duyet`, {
    method: "PUT",
    headers: authHeaders(),
  });
}

export function rejectRestaurant(id: number) {
  return apiFetch(`/admin/nha-hang/${id}/tu-choi`, {
    method: "PUT",
    headers: authHeaders(),
  });
}

export interface AdminOverview {
  tongNhaHang: number;
  tongDonHang: number;
  tongDoanhThu: number;
}

export function getAdminOverview(): Promise<AdminOverview> {
  return apiFetch("/admin/thong-ke/tong-quan", {
    headers: authHeaders(),
  });
}

export interface TopRestaurant {
  maNhaHang: number;
  tenNhaHang: string;
  diaChiQuan: string | null;
  danhGiaTrungBinh: number | null;
}

export function getTopRestaurants(): Promise<TopRestaurant[]> {
  return apiFetch("/admin/thong-ke/top-nha-hang", {
    headers: authHeaders(),
  });
}
