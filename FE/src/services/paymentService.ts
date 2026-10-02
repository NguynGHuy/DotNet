import { apiFetch } from "./api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export async function getPaymentMethods() {
  return apiFetch("/thanh-toan/phuong-thuc", {
    method: "GET",
    headers: authHeaders(),
  });
}

export async function createPayment(maDonHang: number, maPhuongThuc: number) {
  return apiFetch("/thanh-toan", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ maDonHang, maPhuongThuc }),
  });
}

export async function getPaymentsByOrder(maDonHang: number) {
  return apiFetch(`/thanh-toan/don-hang/${maDonHang}`, {
    method: "GET",
    headers: authHeaders(),
  });
}

export async function simulatePayment(
  id: number,
  ketQua: "ThanhCong" | "ThatBai",
) {
  return apiFetch(`/thanh-toan/${id}/mo-phong`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ ketQua }),
  });
}

export async function changePaymentMethod(id: number, maPhuongThuc: number) {
  return apiFetch(`/thanh-toan/${id}/doi-phuong-thuc`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ maPhuongThuc }),
  });
}

const KHOA_DON_DANG_THANH_TOAN = "don-thanh-toan-dang-do";

export interface DonDangThanhToan {
  maDonHang: number;
  maDonHangHienThi: string;
  maThanhToan: number;
  maPhuongThuc: number;
  tenPhuongThuc: string;
  maDiaChi: number;
  ghiChu: string;
  maCode: string;
  promotionId: number | null;
  tongTienHang: number;
  phiShip: number;
  soTienGiam: number;
  thanhTien: number;
  maMonAn: number;
  tenMonAn: string;
  gia: number;
  tenNhaHang: string;
}

export function docDonDangThanhToan(): DonDangThanhToan | null {
  const raw = sessionStorage.getItem(KHOA_DON_DANG_THANH_TOAN);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw) as DonDangThanhToan;
    if (
      !data ||
      typeof data.maDonHang !== "number" ||
      typeof data.maThanhToan !== "number"
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function ghiDonDangThanhToan(data: DonDangThanhToan) {
  sessionStorage.setItem(KHOA_DON_DANG_THANH_TOAN, JSON.stringify(data));
}

export function xoaDonDangThanhToan() {
  sessionStorage.removeItem(KHOA_DON_DANG_THANH_TOAN);
}
