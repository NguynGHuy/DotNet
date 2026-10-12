import { CalendarDays, Check, Store, TicketPercent } from "lucide-react";
import type { CustomerVoucher } from "../services/promotionService";

interface VoucherCardProps {
  voucher: CustomerVoucher;
  actionLabel?: string;
  actionDisabled?: boolean;
  selected?: boolean;
  compact?: boolean;
  onAction?: (voucher: CustomerVoucher) => void;
}

function formatMoney(value: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function getDiscountLabel(voucher: CustomerVoucher) {
  return voucher.loaiGiam === "PhanTram"
    ? `Giảm ${voucher.giaTriGiam}%`
    : `Giảm ${formatMoney(voucher.giaTriGiam)}`;
}

function VoucherCard({
  voucher,
  actionLabel,
  actionDisabled = false,
  selected = false,
  compact = false,
  onAction,
}: VoucherCardProps) {
  return (
    <article
      className={`customer-voucher-card${selected ? " is-selected" : ""}${
        compact ? " is-compact" : ""
      }`}
    >
      <div className="customer-voucher-ticket-side">
        <TicketPercent size={compact ? 20 : 25} />
        <span>{voucher.nguon === "HeThong" ? "FOODIE" : "QUÁN"}</span>
      </div>

      <div className="customer-voucher-content">
        <div className="customer-voucher-heading">
          <div>
            <strong>{getDiscountLabel(voucher)}</strong>
            <code>{voucher.maCode}</code>
          </div>
          <span className={`customer-voucher-source source-${voucher.nguon.toLowerCase()}`}>
            {voucher.nguon === "HeThong" ? "Toàn hệ thống" : "Voucher nhà hàng"}
          </span>
        </div>

        <p>{voucher.moTa || "Ưu đãi dành cho đơn hàng của bạn."}</p>

        <div className="customer-voucher-conditions">
          <span>
            <Store size={13} /> Đơn tối thiểu {formatMoney(voucher.donHangToiThieu)}
          </span>
          <span>
            <CalendarDays size={13} /> HSD {new Date(voucher.ngayKetThuc).toLocaleDateString("vi-VN")}
          </span>
        </div>

        {voucher.giamToiDa !== null && voucher.loaiGiam === "PhanTram" && (
          <small>Giảm tối đa {formatMoney(voucher.giamToiDa)}</small>
        )}

        {onAction && actionLabel && (
          <button
            type="button"
            className="customer-voucher-action"
            disabled={actionDisabled}
            onClick={() => onAction(voucher)}
          >
            {((voucher.daLuu && actionLabel !== "Bỏ lưu") || selected) && (
              <Check size={14} />
            )}
            {actionLabel}
          </button>
        )}
      </div>
    </article>
  );
}

export default VoucherCard;
