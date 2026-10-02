import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAddresses } from "../services/addressService";
import type { Address } from "../services/addressService";
// KHOI PHUC KHI GIO HANG DAY DU: import { checkPreCheckout, placeOrder } from "../services/orderService";
// KHOI PHUC KHI GIO HANG DAY DU: import { getCart } from "../services/cartService";
import { placeTemporaryOrder } from "../services/orderService";
import { checkPromotion } from "../services/promotionService";
import { getMonAns } from "../services/menuService";
import { getRestaurantById } from "../services/restaurantService";
import {
  changePaymentMethod,
  docDonDangThanhToan,
  getPaymentMethods,
  getPaymentsByOrder,
  ghiDonDangThanhToan,
  simulatePayment,
  xoaDonDangThanhToan,
  type DonDangThanhToan,
} from "../services/paymentService";
import PaymentQr from "../components/PaymentQr";

interface CheckoutData {
  tongTienHang: number;
  phiShip: number;
  soTienGiam: number;
  thanhTien: number;
}

interface MonTam {
  maMonAn: number;
  tenMonAn: string;
  gia: number;
}

interface PhuongThucThanhToan {
  maPhuongThuc: number;
  tenPhuongThuc: string;
}

const MA_NHA_HANG_TAM = 3;

async function donConTiepTuc(): Promise<(DonDangThanhToan & { moQr: boolean }) | null> {
  const pending = docDonDangThanhToan();
  if (!pending) return null;

  let payments: Array<{
    maThanhToan: number;
    maPhuongThuc: number;
    tenPhuongThuc: string;
    trangThaiThanhToan: string;
  }> = [];
  try {
    const raw = await getPaymentsByOrder(pending.maDonHang);
    payments = Array.isArray(raw) ? raw : [];
  } catch {
    return null;
  }

  const latest = [...payments].sort((a, b) => b.maThanhToan - a.maThanhToan)[0];
  if (
    !latest ||
    latest.trangThaiThanhToan === "ThanhCong" ||
    latest.tenPhuongThuc === "COD"
  ) {
    xoaDonDangThanhToan();
    return null;
  }

  const next: DonDangThanhToan = {
    ...pending,
    maThanhToan: latest.maThanhToan,
    maPhuongThuc: latest.maPhuongThuc,
    tenPhuongThuc: latest.tenPhuongThuc,
  };
  ghiDonDangThanhToan(next);
  return {
    ...next,
    moQr: latest.trangThaiThanhToan === "ChoThanhToan",
  };
}

interface DonTamDaTao {
  maDonHang: number;
  maDonHangHienThi: string;
  maThanhToan: number;
}
function Checkout() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [ghiChu, setGhiChu] = useState("");

  const [maCode, setMaCode] = useState("");
  const [promotionId, setPromotionId] = useState<number | null>(null);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [promoMessage, setPromoMessage] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);

  const [loading, setLoading] = useState(true);
  /* KHOI PHUC KHI GIO HANG DAY DU
  const [placingOrder, setPlacingOrder] = useState(false);
  */
  const [confirming, setConfirming] = useState(false);
  const [paying, setPaying] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrBusy, setQrBusy] = useState(false);
  const [donDaTao, setDonDaTao] = useState<DonTamDaTao | null>(null);
  const [monTam, setMonTam] = useState<MonTam | null>(null);
  const [tenNhaHang, setTenNhaHang] = useState("");
  const [phuongThucList, setPhuongThucList] = useState<PhuongThucThanhToan[]>(
    [],
  );
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const initCheckout = async () => {
      try {
        // 1. Lấy địa chỉ
        const addrData = await getAddresses();
        setAddresses(addrData);
        const defaultAddr =
          addrData.find((a: Address) => a.macDinh) || addrData[0];
        if (defaultAddr) setSelectedAddressId(defaultAddr.maDiaChi);

        /* KHOI PHUC KHI GIO HANG DAY DU
                // 2. Tính tiền (Gọi API của Người 3)
                const [moneyData, cart] = await Promise.all([
                    checkPreCheckout(null),
                    getCart(),
                ]);
                setCheckoutData(moneyData);
                setRestaurantId(cart.maNhaHang);
                */

        const [nhaHang, monAns, phuongThuc] = await Promise.all([
          getRestaurantById(MA_NHA_HANG_TAM),
          getMonAns(MA_NHA_HANG_TAM),
          getPaymentMethods(),
        ]);

        const monDangBan = monAns
          .filter((mon) => mon.trangThai)
          .sort((a, b) => a.maMonAn - b.maMonAn)[0];

        setRestaurantId(MA_NHA_HANG_TAM);
        setPhuongThucList(phuongThuc);

        const donNho = await donConTiepTuc();
        if (donNho) {
          setSelectedAddressId(donNho.maDiaChi);
          setGhiChu(donNho.ghiChu);
          setMaCode(donNho.maCode);
          setPromotionId(donNho.promotionId);
          setTenNhaHang(donNho.tenNhaHang);
          setMonTam({
            maMonAn: donNho.maMonAn,
            tenMonAn: donNho.tenMonAn,
            gia: donNho.gia,
          });
          setSelectedPaymentId(donNho.maPhuongThuc);
          setCheckoutData({
            tongTienHang: donNho.tongTienHang,
            phiShip: donNho.phiShip,
            soTienGiam: donNho.soTienGiam,
            thanhTien: donNho.thanhTien,
          });
          setDonDaTao({
            maDonHang: donNho.maDonHang,
            maDonHangHienThi: donNho.maDonHangHienThi,
            maThanhToan: donNho.maThanhToan,
          });
          if (donNho.moQr) {
            setShowBill(true);
            setShowQr(true);
          }
          return;
        }

        if (!monDangBan) {
          throw new Error("Nhà hàng tạm không còn món đang bán.");
        }

        const phiShip = nhaHang.phiShipMacDinh;
        setTenNhaHang(nhaHang.tenNhaHang);
        setMonTam({
          maMonAn: monDangBan.maMonAn,
          tenMonAn: monDangBan.tenMonAn,
          gia: monDangBan.gia,
        });
        const macDinh =
          phuongThuc.find(
            (item: PhuongThucThanhToan) => item.tenPhuongThuc === "COD",
          ) ?? phuongThuc[0];
        setSelectedPaymentId(macDinh ? macDinh.maPhuongThuc : null);
        setCheckoutData({
          tongTienHang: monDangBan.gia,
          phiShip,
          soTienGiam: 0,
          thanhTien: monDangBan.gia + phiShip,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Có lỗi xảy ra";
        alert(message);
        navigate("/gio-hang");
      } finally {
        setLoading(false);
      }
    };
    initCheckout();
  }, [navigate]);

  const handleApplyPromotion = async () => {
    if (!maCode.trim() || restaurantId === null || !checkoutData) return;

    try {
      setPromoBusy(true);
      setPromoMessage("");

      const result = await checkPromotion(
        maCode.trim(),
        restaurantId,
        checkoutData.tongTienHang,
      );

      /* KHOI PHUC KHI GIO HANG DAY DU
            const updatedCheckout = await checkPreCheckout(result.maKhuyenMai);
            setCheckoutData(updatedCheckout);
            */
      setCheckoutData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          soTienGiam: result.soTienGiam,
          thanhTien: prev.tongTienHang + prev.phiShip - result.soTienGiam,
        };
      });
      setPromotionId(result.maKhuyenMai);
      setPromoMessage("Áp dụng mã thành công.");
    } catch (err) {
      setPromoMessage((err as Error).message);
    } finally {
      setPromoBusy(false);
    }
  };

  const handleRemovePromotion = async () => {
    try {
      setPromoBusy(true);
      /* KHOI PHUC KHI GIO HANG DAY DU
            const updatedCheckout = await checkPreCheckout(null);
            setCheckoutData(updatedCheckout);
            */
      setCheckoutData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          soTienGiam: 0,
          thanhTien: prev.tongTienHang + prev.phiShip,
        };
      });
      setPromotionId(null);
      setMaCode("");
      setPromoMessage("");
    } catch (err) {
      setPromoMessage((err as Error).message);
    } finally {
      setPromoBusy(false);
    }
  };

  /* KHOI PHUC KHI GIO HANG DAY DU
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert("Vui lòng chọn địa chỉ giao hàng!");
      return;
    }
    try {
      setPlacingOrder(true);
      const res = await placeOrder({
        maDiaChi: selectedAddressId,
        maKhuyenMai: promotionId,
        ghiChu: ghiChu,
      });
      alert("Đặt hàng thành công! Mã đơn: " + res.maDonHangHienThi);
      navigate("/don-hang"); // Chuyển tới lịch sử đơn hàng
    } catch (error) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
      alert("Lỗi đặt hàng: " + message);
    } finally {
      setPlacingOrder(false);
    }
  };
  */

  const recheckBeforeOrder = async () => {
    if (!monTam || restaurantId === null) {
      throw new Error("Thiếu thông tin món tạm.");
    }

    const [nhaHang, monAns] = await Promise.all([
      getRestaurantById(MA_NHA_HANG_TAM),
      getMonAns(MA_NHA_HANG_TAM),
    ]);

    if (nhaHang.trangThaiHoatDong !== "MoCua") {
      throw new Error("Nhà hàng hiện đang tạm ngưng nhận đơn.");
    }

    const monConBan = monAns.find(
      (mon) => mon.maMonAn === monTam.maMonAn && mon.trangThai,
    );
    if (!monConBan) {
      throw new Error("Món tạm không còn được bán.");
    }

    const phiShip = nhaHang.phiShipMacDinh;
    let soTienGiam = 0;
    let maKhuyenMai = promotionId;
    if (promotionId !== null) {
      const result = await checkPromotion(
        maCode.trim(),
        restaurantId,
        monConBan.gia,
      );
      soTienGiam = result.soTienGiam;
      maKhuyenMai = result.maKhuyenMai;
    }

    return { nhaHang, monConBan, phiShip, soTienGiam, maKhuyenMai };
  };

  const applyFreshTotals = (
    fresh: Awaited<ReturnType<typeof recheckBeforeOrder>>,
  ) => {
    setTenNhaHang(fresh.nhaHang.tenNhaHang);
    setMonTam({
      maMonAn: fresh.monConBan.maMonAn,
      tenMonAn: fresh.monConBan.tenMonAn,
      gia: fresh.monConBan.gia,
    });
    setPromotionId(fresh.maKhuyenMai);
    setCheckoutData({
      tongTienHang: fresh.monConBan.gia,
      phiShip: fresh.phiShip,
      soTienGiam: fresh.soTienGiam,
      thanhTien: fresh.monConBan.gia + fresh.phiShip - fresh.soTienGiam,
    });
  };

  const handleConfirm = async () => {
    if (donDaTao) {
      if (selectedPaymentId === null) {
        alert("Vui lòng chọn phương thức thanh toán!");
        return;
      }
      setShowBill(true);
      return;
    }

    if (!selectedAddressId) {
      alert("Vui lòng chọn địa chỉ giao hàng!");
      return;
    }
    if (selectedPaymentId === null) {
      alert("Vui lòng chọn phương thức thanh toán!");
      return;
    }
    if (!monTam || !checkoutData || restaurantId === null) return;

    if (maCode.trim() && promotionId === null) {
      alert("Bạn đã nhập mã giảm giá nhưng chưa áp dụng. Hãy áp dụng hoặc xóa mã.");
      return;
    }

    try {
      setConfirming(true);
      const fresh = await recheckBeforeOrder();
      applyFreshTotals(fresh);
      setShowBill(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
      alert(message);
    } finally {
      setConfirming(false);
    }
  };

  const handlePay = async () => {
    const payment = phuongThucList.find(
      (item) => item.maPhuongThuc === selectedPaymentId,
    );
    if (!payment || selectedAddressId === null) return;

    try {
      setPaying(true);

      if (donDaTao) {
        const nhaHang = await getRestaurantById(MA_NHA_HANG_TAM);
        if (nhaHang.trangThaiHoatDong !== "MoCua") {
          alert("Nhà hàng hiện đang tạm ngưng nhận đơn.");
          return;
        }

        const created = await changePaymentMethod(
          donDaTao.maThanhToan,
          payment.maPhuongThuc,
        );
        const nextPaymentId = Number(created.maThanhToanMoi);
        const donMoi = { ...donDaTao, maThanhToan: nextPaymentId };
        setDonDaTao(donMoi);
        if (payment.tenPhuongThuc === "COD") {
          xoaDonDangThanhToan();
          navigate(`/don-hang/${donDaTao.maDonHang}`);
          return;
        }
        if (monTam && checkoutData) {
          ghiDonDangThanhToan({
            maDonHang: donMoi.maDonHang,
            maDonHangHienThi: donMoi.maDonHangHienThi,
            maThanhToan: donMoi.maThanhToan,
            maPhuongThuc: payment.maPhuongThuc,
            tenPhuongThuc: payment.tenPhuongThuc,
            maDiaChi: selectedAddressId,
            ghiChu,
            maCode,
            promotionId,
            tongTienHang: checkoutData.tongTienHang,
            phiShip: checkoutData.phiShip,
            soTienGiam: checkoutData.soTienGiam,
            thanhTien: checkoutData.thanhTien,
            maMonAn: monTam.maMonAn,
            tenMonAn: monTam.tenMonAn,
            gia: monTam.gia,
            tenNhaHang,
          });
        }
        setShowQr(true);
        return;
      }

      const fresh = await recheckBeforeOrder();
      applyFreshTotals(fresh);
      const res = await placeTemporaryOrder({
        maDiaChi: selectedAddressId,
        maPhuongThuc: payment.maPhuongThuc,
        maKhuyenMai: fresh.maKhuyenMai,
        ghiChu: ghiChu.trim() || null,
      });
      if (payment.tenPhuongThuc === "COD") {
        navigate(`/don-hang/${res.maDonHang}`);
        return;
      }
      const donMoi = {
        maDonHang: res.maDonHang,
        maDonHangHienThi: res.maDonHangHienThi,
        maThanhToan: res.maThanhToan,
      };
      ghiDonDangThanhToan({
        ...donMoi,
        maPhuongThuc: payment.maPhuongThuc,
        tenPhuongThuc: payment.tenPhuongThuc,
        maDiaChi: selectedAddressId,
        ghiChu,
        maCode,
        promotionId: fresh.maKhuyenMai,
        tongTienHang: fresh.monConBan.gia,
        phiShip: fresh.phiShip,
        soTienGiam: fresh.soTienGiam,
        thanhTien: fresh.monConBan.gia + fresh.phiShip - fresh.soTienGiam,
        maMonAn: fresh.monConBan.maMonAn,
        tenMonAn: fresh.monConBan.tenMonAn,
        gia: fresh.monConBan.gia,
        tenNhaHang: fresh.nhaHang.tenNhaHang,
      });
      setDonDaTao(donMoi);
      setShowQr(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
      alert(message);
    } finally {
      setPaying(false);
    }
  };

  const handleQrSuccess = async () => {
    if (!donDaTao) return;
    try {
      setQrBusy(true);
      await simulatePayment(donDaTao.maThanhToan, "ThanhCong");
      xoaDonDangThanhToan();
      navigate(`/don-hang/${donDaTao.maDonHang}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
      alert(message);
    } finally {
      setQrBusy(false);
    }
  };

  const handleQrFail = async () => {
    if (!donDaTao) return;
    try {
      setQrBusy(true);
      await simulatePayment(donDaTao.maThanhToan, "ThatBai");
      setShowQr(false);
      setShowBill(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
      alert(message);
    } finally {
      setQrBusy(false);
    }
  };

  if (loading)
    return (
      <div className="loading-spinner" style={{ margin: "100px auto" }}></div>
    );

  if (showBill && monTam && checkoutData) {
    const address = addresses.find((item) => item.maDiaChi === selectedAddressId);
    const payment = phuongThucList.find(
      (item) => item.maPhuongThuc === selectedPaymentId,
    );
    const formatMoney = (value: number) => `${value.toLocaleString("vi-VN")} đ`;

    return (
      <main className="checkout-page">
        <div className="invoice-sheet">
          <div className="invoice-track">
            <h1>Hóa đơn</h1>
            <p>
              {donDaTao
                ? `Đơn ${donDaTao.maDonHangHienThi} đã được tạo. Chỉ đổi được phương thức thanh toán.`
                : "Xem lại thông tin. Đơn hàng chưa được tạo."}
            </p>
          </div>

          <section className="invoice-block">
            <h2>{tenNhaHang}</h2>
          </section>

          <section className="invoice-block">
            <div className="invoice-item">
              <div className="invoice-line">
                <strong>{monTam.tenMonAn} x1</strong>
                <span>{formatMoney(monTam.gia)}</span>
              </div>
            </div>
          </section>

          <section className="invoice-block invoice-money">
            <div className="invoice-line">
              <span>Tổng tiền món</span>
              <span>{formatMoney(checkoutData.tongTienHang)}</span>
            </div>
            <div className="invoice-line">
              <span>Phí giao hàng</span>
              <span>{formatMoney(checkoutData.phiShip)}</span>
            </div>
            <div className="invoice-line">
              <span>Giảm giá</span>
              <span>-{formatMoney(checkoutData.soTienGiam)}</span>
            </div>
            {promotionId !== null && maCode.trim() && (
              <p className="invoice-muted">Mã: {maCode.trim()}</p>
            )}
            <div className="invoice-line invoice-total">
              <span>Thành tiền</span>
              <span>{formatMoney(checkoutData.thanhTien)}</span>
            </div>
          </section>

          <section className="invoice-block">
            {address && (
              <>
                <p className="invoice-receiver">
                  {address.tenNguoiNhan} · {address.soDienThoaiNhan}
                </p>
                <p className="invoice-muted">{address.diaChiCuThe}</p>
              </>
            )}
            {ghiChu.trim() && (
              <p className="invoice-muted">Ghi chú: {ghiChu.trim()}</p>
            )}
            {payment && (
              <p className="invoice-muted">Thanh toán: {payment.tenPhuongThuc}</p>
            )}
          </section>

          <div className="checkout-bill-actions">
            <button
              type="button"
              className="menu-button checkout-secondary"
              onClick={() => setShowBill(false)}
              disabled={paying || showQr}
            >
              Sửa lại
            </button>
            <button
              type="button"
              className="menu-button"
              onClick={handlePay}
              disabled={paying || showQr}
            >
              {paying ? "Đang tạo đơn..." : "Thanh toán"}
            </button>
          </div>
        </div>
        {showQr && payment && (
          <div className="qr-overlay" role="dialog" aria-modal="true" aria-labelledby="qr-title">
            <div className="qr-dialog">
              <h2 id="qr-title">Thanh toán {payment.tenPhuongThuc}</h2>
              <p>Quét mã mô phỏng, rồi chọn kết quả.</p>
              <PaymentQr />
              <p>{formatMoney(checkoutData.thanhTien)}</p>
              <div className="qr-actions">
                <button
                  type="button"
                  className="menu-button"
                  onClick={handleQrSuccess}
                  disabled={qrBusy}
                >
                  {qrBusy ? "Đang xử lý..." : "Tôi đã thanh toán"}
                </button>
                <button
                  type="button"
                  className="menu-button checkout-secondary"
                  onClick={handleQrFail}
                  disabled={qrBusy}
                >
                  Thanh toán thất bại
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <h2>Xác nhận Đơn hàng</h2>
        {donDaTao && (
          <p className="checkout-promotion-message">
            Thanh toán đơn {donDaTao.maDonHangHienThi} thất bại. Địa chỉ, món và mã giảm giá giữ nguyên. Hãy chọn phương thức thanh toán khác.
          </p>
        )}

        <div className="checkout-section">
          <h3>🍜 Món đặt tạm</h3>
          {monTam && (
            <>
              <div className="summary-row">
                <span>{monTam.tenMonAn} x1</span>
                <span>{monTam.gia.toLocaleString()} đ</span>
              </div>
              {tenNhaHang && (
                <p style={{ margin: 0, color: "#666" }}>{tenNhaHang}</p>
              )}
            </>
          )}
        </div>

        <div className="checkout-section">
          <h3>📍 Giao đến</h3>
          {addresses.length === 0 ? (
            <p>
              Bạn chưa có địa chỉ.{" "}
              <Link to="/dia-chi" style={{ color: "#ff5a1f" }}>
                Thêm địa chỉ ngay
              </Link>
            </p>
          ) : (
            <div className="address-options">
              {addresses.map((a) => (
                <label
                  key={a.maDiaChi}
                  className={`address-option ${selectedAddressId === a.maDiaChi ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddressId === a.maDiaChi}
                    disabled={donDaTao !== null}
                    onChange={() => setSelectedAddressId(a.maDiaChi)}
                  />
                  <div>
                    <strong>
                      {a.tenNguoiNhan} - {a.soDienThoaiNhan}
                    </strong>
                    <p>{a.diaChiCuThe}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="checkout-section">
          <h3>📝 Ghi chú cho quán</h3>
          <textarea
            placeholder="Ví dụ: Ít cay, tới nơi gọi điện..."
            value={ghiChu}
            disabled={donDaTao !== null}
            onChange={(e) => setGhiChu(e.target.value)}
            rows={2}
            className="checkout-note"
          ></textarea>
        </div>

        <div className="checkout-section">
          <h3>🎟️ Mã giảm giá</h3>

          <div className="checkout-promotion">
            <input
              aria-label="Mã giảm giá"
              placeholder="Nhập mã giảm giá"
              value={maCode}
              disabled={promotionId !== null || promoBusy || donDaTao !== null}
              onChange={(e) => setMaCode(e.target.value)}
            />

            {promotionId === null ? (
              <button
                type="button"
                onClick={handleApplyPromotion}
                disabled={promoBusy || !maCode.trim() || donDaTao !== null}
              >
                {promoBusy ? "Đang kiểm tra..." : "Áp dụng"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRemovePromotion}
                disabled={promoBusy || donDaTao !== null}
              >
                Bỏ mã
              </button>
            )}
          </div>

          {promoMessage && (
            <p className="checkout-promotion-message">{promoMessage}</p>
          )}
        </div>

        <div className="checkout-section">
          <h3>💳 Phương thức thanh toán</h3>
          {phuongThucList.length === 0 ? (
            <p>Chưa có phương thức thanh toán.</p>
          ) : (
            <div className="address-options">
              {phuongThucList.map((item) => (
                <label
                  key={item.maPhuongThuc}
                  className={`address-option ${selectedPaymentId === item.maPhuongThuc ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={selectedPaymentId === item.maPhuongThuc}
                    onChange={() => setSelectedPaymentId(item.maPhuongThuc)}
                  />
                  <div>
                    <strong>{item.tenPhuongThuc}</strong>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="checkout-section summary-box">
          <h3>💰 Tổng cộng</h3>
          {checkoutData && (
            <>
              <div className="summary-row">
                <span>Tổng tiền món:</span>
                <span>{checkoutData.tongTienHang.toLocaleString()} đ</span>
              </div>
              <div className="summary-row">
                <span>Phí giao hàng:</span>
                <span>{checkoutData.phiShip.toLocaleString()} đ</span>
              </div>
              <div className="summary-row">
                <span>Khuyến mãi:</span>
                <span>- {checkoutData.soTienGiam.toLocaleString()} đ</span>
              </div>
              <hr />
              <div className="summary-row total">
                <span>Thanh toán:</span>
                <span>{checkoutData.thanhTien.toLocaleString()} đ</span>
              </div>
            </>
          )}
        </div>

        {/* KHOI PHUC KHI GIO HANG DAY DU
        <button
          className="menu-button"
          onClick={handlePlaceOrder}
          disabled={placingOrder || promoBusy || addresses.length === 0}
          style={{ width: "100%", marginTop: 20 }}
        >
          {placingOrder ? "Đang xử lý..." : "XÁC NHẬN ĐẶT HÀNG"}
        </button>
        */}
        <button
          className="menu-button"
          type="button"
          onClick={handleConfirm}
          disabled={confirming || promoBusy || addresses.length === 0}
          style={{ width: "100%", marginTop: 20 }}
        >
          {confirming ? "Đang kiểm tra..." : "Xác nhận"}
        </button>
      </div>
    </main>
  );
}

export default Checkout;
