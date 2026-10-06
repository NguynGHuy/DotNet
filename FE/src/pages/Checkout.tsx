import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CircleCheck,
  CircleX,
  PencilLine,
  QrCode,
  ReceiptText,
  CheckCircle2,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  Smartphone,
  Store,
  TicketPercent,
  UtensilsCrossed,
} from "lucide-react";

import {
  getAddresses,
  type Address,
} from "../services/addressService";
import {
  checkPreCheckout,
  placeOrder,
  type TienDonHang,
} from "../services/orderService";
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

interface GioHangDong {
  tenMonAn: string;
  hinhAnh?: string | null;
  soLuong: number;
  thanhTien: number;
  toppings?: {
    tenTopping?: string;
    giaThem?: number;
  }[];
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

function mapDong(
  chiTiet: GioHangDong[],
): DongMonNho[] {
  return chiTiet.map((item) => ({
    tenMonAn: item.tenMonAn,
    hinhAnh: item.hinhAnh?.trim() || null,
    soLuong: item.soLuong,
    thanhTien: item.thanhTien,
    toppings: (item.toppings ?? []).map(
      (topping) => ({
        tenTopping:
          topping.tenTopping ?? "",
        giaThem:
          topping.giaThem ?? 0,
      }),
    ),
  }));
}

function formatCurrency(value: number) {
  return `${Number(value || 0).toLocaleString(
    "vi-VN",
  )} đ`;
}

function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const maGioHang = Number(
    searchParams.get("maGioHang"),
  );

  const [addresses, setAddresses] =
    useState<Address[]>([]);

  const [
    selectedAddressId,
    setSelectedAddressId,
  ] = useState<number | null>(null);

  const [
    checkoutData,
    setCheckoutData,
  ] = useState<CheckoutData | null>(null);

  const [ghiChu, setGhiChu] =
    useState("");

  const [maCode, setMaCode] =
    useState("");

  const [
    promotionId,
    setPromotionId,
  ] = useState<number | null>(null);

  const [
    restaurantId,
    setRestaurantId,
  ] = useState<number | null>(null);

  const [
    promoMessage,
    setPromoMessage,
  ] = useState("");

  const [promoBusy, setPromoBusy] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [confirming, setConfirming] =
    useState(false);

  const [paying, setPaying] =
    useState(false);

  const [showBill, setShowBill] =
    useState(false);

  const [showQr, setShowQr] =
    useState(false);

  const [qrBusy, setQrBusy] =
    useState(false);

  const [donDaTao, setDonDaTao] =
    useState<DonTamDaTao | null>(null);

  const [dongGio, setDongGio] =
    useState<DongMonNho[]>([]);

  const [tenNhaHang, setTenNhaHang] =
    useState("");

  const [
    phuongThucList,
    setPhuongThucList,
  ] = useState<PhuongThucThanhToan[]>(
    [],
  );

  const [
    selectedPaymentId,
    setSelectedPaymentId,
  ] = useState<number | null>(null);

  useEffect(() => {
    const initCheckout = async () => {
      try {
        if (
          !Number.isInteger(maGioHang) ||
          maGioHang <= 0
        ) {
          throw new Error(
            "Không xác định được giỏ hàng cần thanh toán.",
          );
        }

        const [
          addressData,
          paymentData,
          cart,
        ] = await Promise.all([
          getAddresses(),
          getPaymentMethods(),
          getCart(
            maGioHang,
          ) as Promise<GioHang>,
        ]);

        setAddresses(addressData);
        setPhuongThucList(paymentData);

        const defaultAddress =
          addressData.find(
            (address: Address) =>
              address.macDinh,
          ) ?? addressData[0];

        if (defaultAddress) {
          setSelectedAddressId(
            defaultAddress.maDiaChi,
          );
        }

        if (
          !cart?.chiTiet?.length ||
          cart.maNhaHang === null
        ) {
          throw new Error(
            "Giỏ hàng trống.",
          );
        }

        const restaurant =
          await getRestaurantById(
            cart.maNhaHang,
          );

        const money =
          await checkPreCheckout(
            maGioHang,
            null,
          );

        setRestaurantId(
          cart.maNhaHang,
        );

        setTenNhaHang(
          restaurant.tenNhaHang,
        );

        setDongGio(
          mapDong(cart.chiTiet),
        );

        setCheckoutData(
          soTien(money),
        );

        const defaultPayment =
          paymentData.find(
            (
              item: PhuongThucThanhToan,
            ) =>
              item.tenPhuongThuc ===
              "COD",
          ) ?? paymentData[0];

        setSelectedPaymentId(
          defaultPayment
            ? defaultPayment.maPhuongThuc
            : null,
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Có lỗi xảy ra.";

        alert(message);
        navigate("/nha-hang");
      } finally {
        setLoading(false);
      }
    };

    void initCheckout();
  }, [maGioHang, navigate]);

  const handleApplyPromotion =
    async () => {
      if (
        !maCode.trim() ||
        restaurantId === null ||
        !checkoutData
      ) {
        return;
      }

      try {
        setPromoBusy(true);
        setPromoMessage("");

        const result =
          await checkPromotion(
            maCode.trim(),
            restaurantId,
            checkoutData.tongTienHang,
          );

        const money =
          await checkPreCheckout(
            maGioHang,
            result.maKhuyenMai,
          );

        setCheckoutData(
          soTien(money),
        );

        setPromotionId(
          result.maKhuyenMai,
        );

        setPromoMessage(
          "Áp dụng mã thành công.",
        );
      } catch (error) {
        setPromoMessage(
          error instanceof Error
            ? error.message
            : "Không thể áp dụng mã khuyến mãi.",
        );
      } finally {
        setPromoBusy(false);
      }
    };

  const handleRemovePromotion =
    async () => {
      try {
        setPromoBusy(true);

        const money =
          await checkPreCheckout(
            maGioHang,
            null,
          );

        setCheckoutData(
          soTien(money),
        );

        setPromotionId(null);
        setMaCode("");
        setPromoMessage("");
      } catch (error) {
        setPromoMessage(
          error instanceof Error
            ? error.message
            : "Không thể bỏ mã khuyến mãi.",
        );
      } finally {
        setPromoBusy(false);
      }
    };

  const recheckBeforeOrder =
    async () => {
      if (restaurantId === null) {
        throw new Error(
          "Giỏ hàng trống.",
        );
      }

      const [cart, money] =
        await Promise.all([
          getCart(
            maGioHang,
          ) as Promise<GioHang>,

          checkPreCheckout(
            maGioHang,
            promotionId,
          ),
        ]);

      if (!cart?.chiTiet?.length) {
        throw new Error(
          "Giỏ hàng trống.",
        );
      }

      const lines = mapDong(
        cart.chiTiet,
      );

      const moneyData =
        soTien(money);

      setDongGio(lines);
      setCheckoutData(moneyData);

      return {
        lines,
        tien: moneyData,
      };
    };

  const handleConfirm = async () => {
    if (donDaTao) {
      if (
        selectedPaymentId === null
      ) {
        alert(
          "Vui lòng chọn phương thức thanh toán!",
        );

        return;
      }

      setShowBill(true);
      return;
    }

    if (!selectedAddressId) {
      alert(
        "Vui lòng chọn địa chỉ giao hàng!",
      );

      return;
    }

    if (selectedPaymentId === null) {
      alert(
        "Vui lòng chọn phương thức thanh toán!",
      );

      return;
    }

    if (
      !checkoutData ||
      restaurantId === null ||
      dongGio.length === 0
    ) {
      return;
    }

    if (
      maCode.trim() &&
      promotionId === null
    ) {
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
      const message =
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra.";

      alert(message);
    } finally {
      setConfirming(false);
    }
  };

  const handlePay = async () => {
    const payment =
      phuongThucList.find(
        (item) =>
          item.maPhuongThuc ===
          selectedPaymentId,
      );

    if (
      !payment ||
      selectedAddressId === null ||
      restaurantId === null
    ) {
      return;
    }

    try {
      setPaying(true);

      if (donDaTao) {
        const restaurant =
          await getRestaurantById(
            restaurantId,
          );

        if (!restaurant.dangMoCua) {
          alert(
            "Nhà hàng hiện đang tạm ngưng nhận đơn.",
          );

          return;
        }

        const changed =
          (await changePaymentMethod(
            donDaTao.maThanhToan,
            payment.maPhuongThuc,
          )) as {
            maThanhToanMoi: number;
          };

        const nextPaymentId =
          Number(
            changed.maThanhToanMoi,
          );

        setDonDaTao({
          ...donDaTao,
          maThanhToan:
            nextPaymentId,
        });

        if (
          payment.tenPhuongThuc ===
          "COD"
        ) {
          navigate(
            `/don-hang/${donDaTao.maDonHang}`,
          );

          return;
        }

        setShowQr(true);
        return;
      }

      await recheckBeforeOrder();

      const response =
        await placeOrder({
          maGioHang,
          maDiaChi:
            selectedAddressId,
          maPhuongThuc:
            payment.maPhuongThuc,
          maKhuyenMai:
            promotionId,
          ghiChu,
        });

      if (
        payment.tenPhuongThuc ===
        "COD"
      ) {
        navigate(
          `/don-hang/${response.maDonHang}`,
        );

        return;
      }

      setDonDaTao({
        maDonHang:
          response.maDonHang,

        maDonHangHienThi:
          response.maDonHangHienThi,

        maThanhToan:
          response.maThanhToan,
      });

      setShowQr(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra.";

      alert(message);
    } finally {
      setPaying(false);
    }
  };

  const handleQrSuccess =
    async () => {
      if (!donDaTao) {
        return;
      }

      try {
        setQrBusy(true);

        await simulatePayment(
          donDaTao.maThanhToan,
          "ThanhCong",
        );

        navigate(
          `/don-hang/${donDaTao.maDonHang}`,
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Có lỗi xảy ra.";

        alert(message);
      } finally {
        setQrBusy(false);
      }
    };

  const handleQrFail = async () => {
    if (!donDaTao) {
      return;
    }

    try {
      setQrBusy(true);

      await simulatePayment(
        donDaTao.maThanhToan,
        "ThatBai",
      );

      setShowQr(false);
      setShowBill(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra.";

      alert(message);
    } finally {
      setQrBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="checkout-page checkout-loading-page">
        <div className="loading-spinner" />

        <p>
          Đang chuẩn bị đơn hàng...
        </p>
      </main>
    );
  }

  if (
  showBill &&
  dongGio.length > 0 &&
  checkoutData
) {
  const address =
    addresses.find(
      (item) =>
        item.maDiaChi ===
        selectedAddressId,
    );

  const payment =
    phuongThucList.find(
      (item) =>
        item.maPhuongThuc ===
        selectedPaymentId,
    );

  const isCodPayment =
    payment?.tenPhuongThuc
      .toUpperCase()
      .includes("COD") ?? false;

  return (
    <main className="checkout-review-page">
      <div className="checkout-review-container">
        <header className="checkout-review-header">
          <div className="checkout-review-title">
            <span>
              <ReceiptText size={21} />
            </span>

            <div>
              <small>
                Xác nhận lần cuối
              </small>

              <h1>
                Kiểm tra đơn hàng
              </h1>

              <p>
                Đảm bảo thông tin chính xác
                trước khi tạo đơn.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="checkout-review-edit"
            disabled={paying || showQr}
            onClick={() =>
              setShowBill(false)
            }
          >
            <PencilLine size={15} />
            Sửa thông tin
          </button>
        </header>

        {donDaTao && (
          <div className="checkout-review-created">
            <CheckCircle2 size={18} />

            <div>
              <strong>
                Đơn{" "}
                {
                  donDaTao.maDonHangHienThi
                }{" "}
                đã được tạo
              </strong>

              <p>
                Địa chỉ, món ăn và mã
                khuyến mãi được giữ nguyên.
                Bạn đang đổi phương thức
                thanh toán.
              </p>
            </div>
          </div>
        )}

        <div className="checkout-review-layout">
          <section className="checkout-review-main">
            <div className="checkout-review-restaurant">
              <span>
                <Store size={18} />
              </span>

              <div>
                <small>
                  Nhà hàng
                </small>

                <h2>{tenNhaHang}</h2>
              </div>

              <strong>
                {dongGio.length} loại món
              </strong>
            </div>

            <div className="checkout-review-items">
              {dongGio.map(
                (line, index) => (
                  <article
                    key={`${line.tenMonAn}-${index}`}
                    className="checkout-review-item"
                  >
                    <div className="checkout-review-item-image">
                      {line.hinhAnh ? (
                        <img
                          src={
                            line.hinhAnh
                          }
                          alt={
                            line.tenMonAn
                          }
                          onError={(
                            event,
                          ) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <UtensilsCrossed
                          size={21}
                        />
                      )}
                    </div>

                    <div className="checkout-review-item-info">
                      <div>
                        <h3>
                          {line.tenMonAn}
                        </h3>

                        <span>
                          x{line.soLuong}
                        </span>
                      </div>

                      {line.toppings.length >
                        0 && (
                        <p>
                          {line.toppings
                            .map(
                              (
                                topping,
                              ) =>
                                topping.tenTopping,
                            )
                            .join(", ")}
                        </p>
                      )}
                    </div>

                    <strong>
                      {formatCurrency(
                        line.thanhTien,
                      )}
                    </strong>
                  </article>
                ),
              )}
            </div>

            <div className="checkout-review-delivery">
              <div className="checkout-review-section-title">
                <MapPin size={17} />

                <h3>
                  Thông tin giao hàng
                </h3>
              </div>

              {address ? (
                <div className="checkout-review-address">
                  <strong>
                    {address.tenNguoiNhan}

                    <span>
                      {
                        address.soDienThoaiNhan
                      }
                    </span>
                  </strong>

                  <p>
                    {address.diaChiCuThe}
                  </p>
                </div>
              ) : (
                <p className="checkout-review-muted">
                  Chưa có địa chỉ giao hàng.
                </p>
              )}

              {ghiChu.trim() && (
                <div className="checkout-review-note">
                  <MessageSquareText
                    size={14}
                  />

                  <span>
                    {ghiChu.trim()}
                  </span>
                </div>
              )}
            </div>
          </section>

          <aside className="checkout-review-summary">
            <div className="checkout-review-summary-title">
              <ReceiptText size={18} />

              <h2>
                Chi tiết thanh toán
              </h2>
            </div>

            <div className="checkout-review-money">
              <div>
                <span>Tiền món</span>

                <strong>
                  {formatCurrency(
                    checkoutData.tongTienHang,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Phí giao hàng
                </span>

                <strong>
                  {formatCurrency(
                    checkoutData.phiShip,
                  )}
                </strong>
              </div>

              <div className="discount">
                <span>Khuyến mãi</span>

                <strong>
                  -
                  {formatCurrency(
                    checkoutData.soTienGiam,
                  )}
                </strong>
              </div>

              {promotionId !== null &&
                maCode.trim() && (
                  <div className="checkout-review-code">
                    <TicketPercent
                      size={13}
                    />

                    <span>
                      {maCode.trim()}
                    </span>
                  </div>
                )}

              <div className="total">
                <span>
                  Tổng thanh toán
                </span>

                <strong>
                  {formatCurrency(
                    checkoutData.thanhTien,
                  )}
                </strong>
              </div>
            </div>

            {payment && (
              <div className="checkout-review-payment">
                <span>
                  {isCodPayment ? (
                    <Banknote size={18} />
                  ) : (
                    <Smartphone
                      size={18}
                    />
                  )}
                </span>

                <div>
                  <small>
                    Phương thức thanh toán
                  </small>

                  <strong>
                    {
                      payment.tenPhuongThuc
                    }
                  </strong>
                </div>
              </div>
            )}

            <button
              type="button"
              className="checkout-review-pay"
              disabled={paying || showQr}
              onClick={() =>
                void handlePay()
              }
            >
              {paying ? (
                "Đang xử lý..."
              ) : (
                <>
                  {isCodPayment ? (
                    <Banknote size={17} />
                  ) : (
                    <QrCode size={17} />
                  )}

                  <span>
                    {isCodPayment
                      ? "Đặt đơn COD"
                      : "Tiến hành thanh toán"}
                  </span>

                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              type="button"
              className="checkout-review-back"
              disabled={paying || showQr}
              onClick={() =>
                setShowBill(false)
              }
            >
              Quay lại chỉnh sửa
            </button>

            <div className="checkout-review-security">
              <ShieldCheck size={14} />

              <span>
                Chỉ tạo đơn sau khi bạn xác
                nhận bước này.
              </span>
            </div>
          </aside>
        </div>
      </div>

      {showQr && payment && (
        <div
          className="qr-overlay qr-overlay-v2"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-title"
        >
          <div className="qr-dialog qr-dialog-v2">
            <div className="qr-dialog-icon">
              <QrCode size={24} />
            </div>

            <span className="qr-dialog-eyebrow">
              Thanh toán trực tuyến
            </span>

            <h2 id="qr-title">
              {payment.tenPhuongThuc}
            </h2>

            <p className="qr-dialog-description">
              Quét mã bằng ứng dụng thanh
              toán, sau đó xác nhận kết quả.
            </p>

            <div className="qr-payment-amount">
              <span>
                Số tiền thanh toán
              </span>

              <strong>
                {formatCurrency(
                  checkoutData.thanhTien,
                )}
              </strong>
            </div>

            <div className="qr-code-frame">
              <PaymentQr />
            </div>

            <p className="qr-demo-note">
              Đây là chức năng thanh toán mô
              phỏng dùng trong đồ án.
            </p>

            <div className="qr-actions qr-actions-v2">
              <button
                type="button"
                className="qr-success-button"
                disabled={qrBusy}
                onClick={() =>
                  void handleQrSuccess()
                }
              >
                <CircleCheck size={17} />

                {qrBusy
                  ? "Đang xử lý..."
                  : "Tôi đã thanh toán"}
              </button>

              <button
                type="button"
                className="qr-fail-button"
                disabled={qrBusy}
                onClick={() =>
                  void handleQrFail()
                }
              >
                <CircleX size={17} />
                Thanh toán thất bại
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

  const selectedCheckoutAddress =
    addresses.find(
      (address) =>
        address.maDiaChi ===
        selectedAddressId,
    );

  return (
    <main className="checkout-page checkout-compact-page">
      <div className="checkout-compact-container">
        <header className="checkout-compact-header">
          <Link
            to={
              restaurantId
                ? `/gio-hang?maNhaHang=${restaurantId}`
                : "/nha-hang"
            }
            className="checkout-back-link"
          >
            <ArrowLeft size={16} />
            Quay lại giỏ hàng
          </Link>

          <span>
            Xác nhận đơn hàng
          </span>

          <h1>Thanh toán</h1>

          <p>
            Hoàn tất thông tin để nhà
            hàng chuẩn bị món cho bạn.
          </p>
        </header>

        {donDaTao && (
          <div className="checkout-retry-notice">
            <CheckCircle2
              size={18}
            />

            <div>
              <strong>
                Đơn{" "}
                {
                  donDaTao.maDonHangHienThi
                }{" "}
                đã được tạo
              </strong>

              <p>
                Hãy chọn phương thức
                thanh toán khác để
                tiếp tục.
              </p>
            </div>
          </div>
        )}

        <div className="checkout-compact-layout">
          <div className="checkout-compact-main">
            <section className="checkout-compact-card">
              <div className="checkout-compact-card-title">
                <span>
                  <MapPin size={17} />
                </span>

                <div>
                  <h2>
                    Thông tin giao hàng
                  </h2>

                  <p>
                    Địa chỉ nhận món và
                    ghi chú giao hàng
                  </p>
                </div>
              </div>

              {addresses.length === 0 ? (
                <div className="checkout-empty-address">
                  Bạn chưa có địa chỉ
                  giao hàng.{" "}

                  <Link to="/dia-chi">
                    Thêm địa chỉ ngay
                  </Link>
                </div>
              ) : (
                <>
                  <div className="checkout-address-select-row">
                    <label htmlFor="checkout-address">
                      Địa chỉ nhận món
                    </label>

                    <div className="checkout-address-select-wrap">
                      <select
                        id="checkout-address"
                        value={
                          selectedAddressId ??
                          ""
                        }
                        disabled={
                          donDaTao !== null
                        }
                        onChange={(
                          event,
                        ) =>
                          setSelectedAddressId(
                            Number(
                              event.target
                                .value,
                            ),
                          )
                        }
                      >
                        <option
                          value=""
                          disabled
                        >
                          Chọn địa chỉ
                        </option>

                        {addresses.map(
                          (address) => (
                            <option
                              key={
                                address.maDiaChi
                              }
                              value={
                                address.maDiaChi
                              }
                            >
                              {
                                address.tenNguoiNhan
                              }
                              {" - "}
                              {
                                address.diaChiCuThe
                              }
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </div>

                  {selectedCheckoutAddress && (
                    <div className="checkout-selected-address">
                      <MapPin size={16} />

                      <div>
                        <strong>
                          {
                            selectedCheckoutAddress.tenNguoiNhan
                          }

                          <span>
                            {
                              selectedCheckoutAddress.soDienThoaiNhan
                            }
                          </span>
                        </strong>

                        <p>
                          {
                            selectedCheckoutAddress.diaChiCuThe
                          }
                        </p>
                      </div>

                      <Link to="/dia-chi">
                        Quản lý
                      </Link>
                    </div>
                  )}
                </>
              )}

              <div className="checkout-compact-divider" />

              <label className="checkout-compact-note">
                <span>
                  <MessageSquareText
                    size={15}
                  />
                  Ghi chú cho nhà hàng
                </span>

                <textarea
                  value={ghiChu}
                  disabled={
                    donDaTao !== null
                  }
                  maxLength={300}
                  rows={2}
                  placeholder="Ví dụ: tới nơi gọi điện, giao tại bảo vệ..."
                  onChange={(event) =>
                    setGhiChu(
                      event.target.value,
                    )
                  }
                />

                <small>
                  {ghiChu.length}/300
                </small>
              </label>
            </section>

            <section className="checkout-compact-card">
              <div className="checkout-compact-card-title">
                <span>
                  <Banknote size={17} />
                </span>

                <div>
                  <h2>
                    Thanh toán và ưu đãi
                  </h2>

                  <p>
                    Chọn phương thức thanh
                    toán phù hợp
                  </p>
                </div>
              </div>

              <div className="checkout-compact-payment-options">
                {phuongThucList.map(
                  (item) => {
                    const isCod =
                      item.tenPhuongThuc
                        .toUpperCase()
                        .includes("COD");

                    return (
                      <label
                        key={
                          item.maPhuongThuc
                        }
                        className={`checkout-compact-payment ${
                          selectedPaymentId ===
                          item.maPhuongThuc
                            ? "selected"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={
                            selectedPaymentId ===
                            item.maPhuongThuc
                          }
                          onChange={() =>
                            setSelectedPaymentId(
                              item.maPhuongThuc,
                            )
                          }
                        />

                        <span className="payment-compact-icon">
                          {isCod ? (
                            <Banknote
                              size={18}
                            />
                          ) : (
                            <Smartphone
                              size={18}
                            />
                          )}
                        </span>

                        <span>
                          <strong>
                            {
                              item.tenPhuongThuc
                            }
                          </strong>

                          <small>
                            {isCod
                              ? "Khi nhận món"
                              : "Quét mã QR"}
                          </small>
                        </span>
                      </label>
                    );
                  },
                )}
              </div>

              <div className="checkout-compact-divider" />

              <div className="checkout-compact-promotion">
                <div>
                  <TicketPercent
                    size={17}
                  />

                  <span>
                    <strong>
                      Mã khuyến mãi
                    </strong>

                    <small>
                      Áp dụng ưu đãi của
                      nhà hàng
                    </small>
                  </span>
                </div>

                <div className="checkout-promotion-inline">
                  <input
                    aria-label="Mã giảm giá"
                    placeholder="Nhập mã"
                    value={maCode}
                    disabled={
                      promotionId !==
                        null ||
                      promoBusy ||
                      donDaTao !== null
                    }
                    onChange={(event) =>
                      setMaCode(
                        event.target.value.toUpperCase(),
                      )
                    }
                  />

                  {promotionId === null ? (
                    <button
                      type="button"
                      disabled={
                        promoBusy ||
                        !maCode.trim() ||
                        donDaTao !== null
                      }
                      onClick={() =>
                        void handleApplyPromotion()
                      }
                    >
                      {promoBusy
                        ? "Đang kiểm tra"
                        : "Áp dụng"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="remove"
                      disabled={
                        promoBusy ||
                        donDaTao !== null
                      }
                      onClick={() =>
                        void handleRemovePromotion()
                      }
                    >
                      Bỏ mã
                    </button>
                  )}
                </div>
              </div>

              {promoMessage && (
                <p
                  className={`checkout-promotion-message ${
                    promotionId !== null
                      ? "success"
                      : "error"
                  }`}
                >
                  {promoMessage}
                </p>
              )}
            </section>
          </div>

          <aside className="checkout-compact-summary">
            <div className="checkout-summary-restaurant">
              <span>
                <Store size={17} />
              </span>

              <div>
                <small>
                  Đơn hàng tại
                </small>

                <h2>{tenNhaHang}</h2>
              </div>
            </div>

            <div className="checkout-compact-items">
              {dongGio.map(
                (line, index) => (
                  <article
                    key={`${line.tenMonAn}-${index}`}
                    className="checkout-compact-item"
                  >
                    <div className="checkout-compact-item-image">
                      {line.hinhAnh ? (
                        <img
                          src={
                            line.hinhAnh
                          }
                          alt={
                            line.tenMonAn
                          }
                          onError={(
                            event,
                          ) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <UtensilsCrossed
                          size={20}
                        />
                      )}
                    </div>

                    <div className="checkout-compact-item-info">
                      <div>
                        <h3>
                          {line.tenMonAn}
                        </h3>

                        <span>
                          x{line.soLuong}
                        </span>
                      </div>

                      {line.toppings.length >
                        0 && (
                        <p>
                          {line.toppings
                            .map(
                              (
                                topping,
                              ) =>
                                topping.tenTopping,
                            )
                            .join(", ")}
                        </p>
                      )}
                    </div>

                    <strong>
                      {formatCurrency(
                        line.thanhTien,
                      )}
                    </strong>
                  </article>
                ),
              )}
            </div>

            {checkoutData && (
              <div className="checkout-compact-money">
                <div>
                  <span>Tiền món</span>

                  <strong>
                    {formatCurrency(
                      checkoutData.tongTienHang,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Phí giao hàng
                  </span>

                  <strong>
                    {formatCurrency(
                      checkoutData.phiShip,
                    )}
                  </strong>
                </div>

                <div className="discount">
                  <span>
                    Khuyến mãi
                  </span>

                  <strong>
                    -
                    {formatCurrency(
                      checkoutData.soTienGiam,
                    )}
                  </strong>
                </div>

                <div className="total">
                  <span>
                    Tổng thanh toán
                  </span>

                  <strong>
                    {formatCurrency(
                      checkoutData.thanhTien,
                    )}
                  </strong>
                </div>
              </div>
            )}

            <button
              type="button"
              className="checkout-compact-submit"
              disabled={
                confirming ||
                promoBusy ||
                addresses.length === 0 ||
                selectedPaymentId ===
                  null
              }
              onClick={() =>
                void handleConfirm()
              }
            >
              <span>
                {confirming
                  ? "Đang kiểm tra..."
                  : "Xác nhận đơn hàng"}
              </span>

              {!confirming && (
                <ArrowRight size={17} />
              )}
            </button>

            <div className="checkout-compact-security">
              <ShieldCheck size={14} />

              <span>
                Thông tin của bạn được
                bảo vệ an toàn.
              </span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Checkout;