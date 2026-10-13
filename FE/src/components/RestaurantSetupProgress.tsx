import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ClipboardList } from "lucide-react";
import { getLegalProfile } from "../services/legalProfileService";
import { getMyContract } from "../services/contractService";
import type { LegalProfileResponse } from "../services/legalProfileService";
import type { SignedContract } from "../services/contractService";
import type { Restaurant } from "../services/restaurantService";

interface Props {
    restaurant: Restaurant;
}

function RestaurantSetupProgress({ restaurant }: Props) {
    const [data, setData] = useState<{
        legal: LegalProfileResponse;
        contract: SignedContract | null;
    } | null>(null);

    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        Promise.all([getLegalProfile(), getMyContract()])
            .then(([legal, result]) => {
                if (!cancelled) {
                    setData({ legal, contract: result.hopDong });
                }
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Không tải được tiến độ hồ sơ."
                    );
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    if (error) {
        return (
            <section className="merchant-setup-card">
                <p className="auth-error">{error}</p>
                <Link to="/quan/ho-so-phap-ly">Mở hồ sơ pháp lý →</Link>
            </section>
        );
    }

    if (!data) {
        return (
            <section className="merchant-setup-card">
                Đang kiểm tra tiến độ hồ sơ...
            </section>
        );
    }

    const profile = data.legal.hoSo;
    const contract = data.contract;
    const approval = data.legal.trangThaiDuyet;

    const basicDone = [
        restaurant.tenNhaHang,
        restaurant.diaChiQuan,
        restaurant.moTa,
        restaurant.anhBia,
        restaurant.gioMoCua,
        restaurant.gioDongCua,
        restaurant.soDienThoai,
    ].every((value) => Boolean(value?.trim()));

    const legalDone = [
        profile?.nguoiDaiDien,
        profile?.soGiayToNguoiDaiDien,
        profile?.tenPhapLy,
        profile?.maSoThue,
        profile?.diaChiPhapLy,
        profile?.soGiayPhepKinhDoanh,
        profile?.fileGiayPhepKinhDoanh,
        profile?.fileGiayToNguoiDaiDien,
    ].every((value) => Boolean(value?.trim()));

    const signed = Boolean(
        contract?.thoiGianKy &&
        ["DaKy", "ChoDuyet", "HieuLuc"].includes(contract.trangThai)
    );

    const pending = approval === "ChoDuyet";
    const approved = approval === "DaDuyet";
    const rejected = approval === "TuChoi";

    const steps = [
        {
            title: "Thông tin nhà hàng",
            done: basicDone,
            text: basicDone ? "Đã nhập" : "Cần bổ sung",
            to: "/quan/thong-tin",
        },
        {
            title: "Hồ sơ pháp lý và giấy tờ",
            done: legalDone,
            text: legalDone ? "Đã nhập" : "Cần bổ sung",
            to: "/quan/ho-so-phap-ly",
        },
        {
            title: "Ký hợp đồng",
            done: signed,
            text: signed ? "Đã ký" : rejected ? "Cần ký lại" : "Chưa ký",
            to: "/quan/hop-dong",
        },
        {
            title: "Gửi xét duyệt",
            done: pending || approved,
            text: approved
                ? "Đã được duyệt"
                : pending
                    ? "Đang chờ Admin"
                    : rejected ? "Cần gửi lại" : "Chưa gửi",
            to: "/quan/hop-dong",
        },
    ];

    const nextLink = pending || approved
        ? "/quan/hop-dong"
        : !basicDone
            ? "/quan/thong-tin"
            : !legalDone || rejected
                ? "/quan/ho-so-phap-ly"
                : "/quan/hop-dong";

    return (
        <section className="merchant-setup-card">
            <div className="merchant-setup-heading">
                <span className="merchant-setup-icon">
                    <ClipboardList size={22} />
                </span>
                <div>
                    <h2>
                        {pending
                            ? "Hồ sơ đang chờ xét duyệt"
                            : rejected
                                ? "Hồ sơ cần bổ sung"
                                : "Hoàn thiện hồ sơ nhà hàng"}
                    </h2>
                    <p>
                        {pending
                            ? "Admin sẽ kiểm tra thông tin và hợp đồng đã gửi."
                            : "Hoàn thiện các bước để gửi yêu cầu tham gia nền tảng."}
                    </p>
                </div>
            </div>

            {rejected && contract?.lyDoTuChoi && (
                <p className="merchant-setup-reason">
                    Lý do từ chối: {contract.lyDoTuChoi}
                </p>
            )}

            <div className="merchant-setup-steps">
                {steps.map((step, index) => (
                    <Link
                        key={step.title}
                        to={step.to}
                        className={`merchant-setup-step ${step.done ? "is-done" : ""}`}
                    >
                        <span className="merchant-setup-step-number">
                            {step.done ? <CheckCircle2 size={19} /> : index + 1}
                        </span>
                        <div>
                            <strong>{step.title}</strong>
                            <small>{step.text}</small>
                        </div>
                        <ArrowRight size={16} />
                    </Link>
                ))}
            </div>

            <Link className="merchant-setup-continue" to={nextLink}>
                {pending || approved
                    ? "Xem hồ sơ đã gửi"
                    : rejected ? "Bổ sung hồ sơ" : "Tiếp tục hoàn thiện"}
                <ArrowRight size={16} />
            </Link>
        </section>
    );
}

export default RestaurantSetupProgress;