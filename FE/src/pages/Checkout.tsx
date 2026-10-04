import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAddresses } from "../services/addressService";
import type { Address } from "../services/addressService";
import { checkPreCheckout, placeOrder } from "../services/orderService";
import type { TienDonHang } from "../services/orderService";
import { getCart } from "../services/cartService";
import { checkPromotion } from "../services/promotionService";
import { getRestaurantById } from "../services/restaurantService";
import {
  changePaymentMethod,
  getPaymentMethods,
  simulatePayment,
  type DongMonNho,
} from "../services/paymentService";
import PaymentQr from "../components/PaymentQr";

interface CheckoutData {
  tongTienHang: number;
  phiShip: number;
  soTienGiam: number;
  thanhTien: number;
}

interface PhuongThucThanhToan {
  maPhuongThuc: number;
  tenPhuongThuc: string;
}

// Một dòng món trong giỏ: tên, ảnh, số lượng, tiền và topping để trang xác nhận vẽ ra.
interface GioHangDong {
  tenMonAn: string;
  hinhAnh?: string | null;
  soLuong: number;
  thanhTien: number;
  toppings?: { tenTopping?: string; giaThem?: number }[];
}

interface GioHang {
  maNhaHang: number | null;
  chiTiet: GioHangDong[];
}

interface DonTamDaTao {
  maDonHang: number;
  maDonHangHienThi: string;
  maThanhToan: number;
}

function soTien(raw: TienDonHang): CheckoutData {
  return {
    tongTienHang: Number(raw.tongTienHang),
    phiShip: Number(raw.phiShip),
    soTienGiam: Number(raw.soTienGiam),
    thanhTien: Number(raw.thanhTien),
  };
}

function mapDong(chiTiet: GioHangDong[]): DongMonNho[] {
  return chiTiet.map((item) => ({
    tenMonAn: item.tenMonAn,
    hinhAnh: item.hinhAnh?.trim() || null,
    soLuong: item.soLuong,
    thanhTien: item.thanhTien,
    toppings: (item.toppings ?? []).map((tp) => ({
      tenTopping: tp.tenTopping ?? "",
      giaThem: tp.giaThem ?? 0,
    })),
  }));
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
  const [confirming, setConfirming] = useState(false);
  const [paying, setPaying] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrBusy, setQrBusy] = useState(false);
  const [donDaTao, setDonDaTao] = useState<DonTamDaTao | null>(null);
  const [dongGio, setDongGio] = useState<DongMonNho[]>([]);
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
        const [addrData, phuongThuc, cart] = await Promise.all([
          getAddresses(),
          getPaymentMethods(),
          getCart() as Promise<GioHang>,
        ]);
        setAddresses(addrData);
        setPhuongThucList(phuongThuc);
        const defaultAddr =
          addrData.find((a: Address) => a.macDinh) || addrData[0];
        if (defaultAddr) setSelectedAddressId(defaultAddr.maDiaChi);

        if (!cart?.chiTiet?.length || cart.maNhaHang == null) {
          throw new Error("Giỏ hàng trống.");
        }

        const nhaHang = await getRestaurantById(cart.maNhaHang);
        const money = await checkPreCheckout(null);
        setRestaurantId(cart.maNhaHang);
        setTenNhaHang(nhaHang.tenNhaHang);
        setDongGio(mapDong(cart.chiTiet));
        setCheckoutData(soTien(money));
        const macDinh =
          phuongThuc.find(
            (item: PhuongThucThanhToan) => item.tenPhuongThuc === "COD",
          ) ?? phuongThuc[0];
        setSelectedPaymentId(macDinh ? macDinh.maPhuongThuc : null);
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
      const money = await checkPreCheckout(result.maKhuyenMai);
      setCheckoutData(soTien(money));
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
      const money = await checkPreCheckout(null);
      setCheckoutData(soTien(money));
      setPromotionId(null);
      setMaCode("");
      setPromoMessage("");
    } catch (err) {
      setPromoMessage((err as Error).message);
    } finally {
      setPromoBusy(false);
    }
  };

  const recheckBeforeOrder = async () => {
    if (restaurantId === null) {
      throw new Error("Giỏ hàng trống.");
    }

    const [cart, money] = await Promise.all([
      getCart() as Promise<GioHang>,
      checkPreCheckout(promotionId),
    ]);
    if (!cart?.chiTiet?.length) {
      throw new Error("Giỏ hàng trống.");
    }

    const lines = mapDong(cart.chiTiet);
    const tien = soTien(money);
    setDongGio(lines);
    setCheckoutData(tien);
    return { lines, tien };
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
    if (!checkoutData || restaurantId === null || dongGio.length === 0) return;

    if (maCode.trim() && promotionId === null) {
      alert(
        "Bạn đã nhập mã giảm giá nhưng chưa áp dụng. Hãy áp dụng hoặc xóa mã.",
      );
      return;
    }

    try {
      setConfirming(true);
      await recheckBeforeOrder();
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
    if (!payment || selectedAddressId === null || restaurantId === null) return;

    try {
      setPaying(true);

      if (donDaTao) {
        const nhaHang = await getRestaurantById(restaurantId);
        if (nhaHang.trangThaiHoatDong !== "MoCua") {
          alert("Nhà hàng hiện đang tạm ngưng nhận đơn.");
          return;
        }

        const created = (await changePaymentMethod(
          donDaTao.maThanhToan,
          payment.maPhuongThuc,
        )) as { maThanhToanMoi: number };
        const nextPaymentId = Number(created.maThanhToanMoi);
        const donMoi = { ...donDaTao, maThanhToan: nextPaymentId };
        setDonDaTao(donMoi);
        if (payment.tenPhuongThuc === "COD") {
          navigate(`/don-hang/${donDaTao.maDonHang}`);
          return;
        }
        setShowQr(true);
        return;
      }

      await recheckBeforeOrder();
      const res = await placeOrder({
        maDiaChi: selectedAddressId,
        maPhuongThuc: payment.maPhuongThuc,
        maKhuyenMai: promotionId,
        ghiChu,
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

  if (showBill && dongGio.length > 0 && checkoutData) {
    const address = addresses.find(
      (item) => item.maDiaChi === selectedAddressId,
    );
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
                : "Xem lại thông tin truoc khi thanh toán."}
            </p>
          </div>

          <section className="invoice-block">
            <h2>{tenNhaHang}</h2>
          </section>

          <section className="invoice-block">
            {dongGio.map((line, index) => (
              <div key={`${line.tenMonAn}-${index}`} className="invoice-item">
                <div className="invoice-line">
                  <strong>
                    {line.tenMonAn} x{line.soLuong}
                  </strong>
                  <span>{formatMoney(line.thanhTien)}</span>
                </div>
                {line.toppings.map((tp, tpIndex) => (
                  <div key={tpIndex} className="invoice-line invoice-topping">
                    <span>+ {tp.tenTopping}</span>
                    <span>{formatMoney(tp.giaThem)}</span>
                  </div>
                ))}
              </div>
            ))}
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
              <p className="invoice-muted">
                Thanh toán: {payment.tenPhuongThuc}
              </p>
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
          <div
            className="qr-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-title"
          >
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
            Thanh toán đơn {donDaTao.maDonHangHienThi} thất bại. Địa chỉ, món và
            mã giảm giá giữ nguyên. Hãy chọn phương thức thanh toán khác.
          </p>
        )}

        <div className="checkout-section checkout-shop-sheet">
          {tenNhaHang && (
            <div className="checkout-shop-row">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9.5 12 4l8 5.5V20a1 1 0 0 1-1 1h-5.2v-5.2H10.2V21H5a1 1 0 0 1-1-1V9.5Z" />
              </svg>
              <strong>{tenNhaHang}</strong>
            </div>
          )}
          {dongGio.map((line, index) => (
            <article
              key={`${line.tenMonAn}-${index}`}
              className="checkout-dish-row"
            >
              <div className="checkout-dish-thumb">
                {line.hinhAnh && (
                  <img
                    src={line.hinhAnh}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.remove();
                    }}
                  />
                )}
              </div>
              <div className="checkout-dish-body">
                <div className="checkout-dish-top">
                  <p className="checkout-dish-name">{line.tenMonAn}</p>
                  <p className="checkout-dish-price">
                    {line.thanhTien.toLocaleString("vi-VN")} đ
                  </p>
                </div>
                {line.toppings.length > 0 && (
                  <div className="checkout-dish-toppings">
                    {line.toppings.map((tp, tpIndex) => (
                      <p key={tpIndex} className="checkout-dish-variant">
                        <span>+ {tp.tenTopping}</span>
                        <span>{tp.giaThem.toLocaleString("vi-VN")} đ</span>
                      </p>
                    ))}
                  </div>
                )}
                <p className="checkout-dish-qty">x{line.soLuong}</p>
              </div>
            </article>
          ))}
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
