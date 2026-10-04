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

export interface DongMonNho {
  tenMonAn: string;
  hinhAnh: string | null;
  soLuong: number;
  thanhTien: number;
  toppings: { tenTopping: string; giaThem: number }[];
}
