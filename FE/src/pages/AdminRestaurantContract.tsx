import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Download, FileText } from "lucide-react";
import {
    getAdminContract,
    downloadAdminContractFile,
} from "../services/adminContractService";
import type {
    AdminContractDetails,
    ContractFileType,
} from "../services/adminContractService";

const STATUS: Record<string, string> = {
    Nhap: "Bản nháp",
    ChoKy: "Chờ ký",
    DaKy: "Đã ký",
    ChoDuyet: "Chờ xét duyệt",
    HieuLuc: "Đã duyệt",
    TuChoi: "Đã từ chối",
    HetHan: "Hết hạn",
    ChamDut: "Đã chấm dứt",
};

function formatTime(value: string | null) {
    return value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";
}

function formatDate(value: string) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
}

function AdminRestaurantContract() {
    const { id } = useParams();
    const [result, setResult] = useState<{
        id: string;
        data: AdminContractDetails | null;
        error: string;
    } | null>(null);

    const [downloading, setDownloading] =
        useState<ContractFileType | null>(null);
    const [fileError, setFileError] = useState("");

    useEffect(() => {
        const maNhaHang = Number(id);
        if (!id || !Number.isInteger(maNhaHang) || maNhaHang <= 0) return;

        let cancelled = false;

        getAdminContract(maNhaHang)
            .then((data) => {
                if (!cancelled) setResult({ id, data, error: "" });
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setResult({
                        id,
                        data: null,
                        error: err instanceof Error
                            ? err.message
                            : "Không tải được hồ sơ.",
                    });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    const data = result?.data;
    const contract = data?.hopDong;

    const handleDownload = async (type: ContractFileType) => {
        if (!contract || downloading !== null) return;

        try {
            setDownloading(type);
            setFileError("");
            await downloadAdminContractFile(contract.maHopDong, type);
        } catch (err) {
            setFileError(
                err instanceof Error ? err.message : "Không tải được tệp."
            );
        } finally {
            setDownloading(null);
        }
    };

    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
        return <p className="auth-error">Mã nhà hàng không hợp lệ.</p>;
    }

    if (!result || result.id !== id) {
        return <p>Đang tải hồ sơ nhà hàng...</p>;
    }

    if (result.error || !data) {
        return (
            <div>
                <Link to="/admin/nha-hang">← Về danh sách nhà hàng</Link>
                <p className="auth-error">{result.error || "Không có dữ liệu."}</p>
            </div>
        );
    }

    const restaurantInfo = [
        ["Nhà hàng", data.nhaHang.tenNhaHang],
        ["Địa chỉ quán", data.nhaHang.diaChiQuan],
        ["Email", data.nhaHang.email],
        ["Số điện thoại", data.nhaHang.soDienThoai],
    ];

    const legalInfo = contract ? [
        ["Tên pháp lý", contract.tenPhapLy],
        ["Người đại diện", contract.nguoiDaiDien],
        ["Chức vụ", contract.chucVuNguoiDaiDien],
        ["Số giấy tờ đại diện", contract.soGiayToNguoiDaiDien],
        ["Mã số thuế", contract.maSoThue],
        ["Địa chỉ pháp lý", contract.diaChiPhapLy],
        ["Số giấy phép kinh doanh", contract.soGiayPhepKinhDoanh],
        ["Thời gian ký", formatTime(contract.thoiGianKy)],
        ["Thời gian gửi", formatTime(contract.thoiGianGuiDuyet)],
        ["Phí nền tảng", `${contract.tyLePhiNenTang}%`],
        ["Ngày bắt đầu", formatDate(contract.ngayBatDau)],
        ["Ngày kết thúc", formatDate(contract.ngayKetThuc)],
    ] : [];

    const documents: {
        type: ContractFileType;
        title: string;
        exists: boolean;
    }[] = [
            { type: "giay-phep", title: "Giấy phép kinh doanh", exists: !!contract?.coGiayPhep },
            { type: "giay-to", title: "Giấy tờ đại diện", exists: !!contract?.coGiayToDaiDien },
            { type: "hop-dong", title: "Bản hợp đồng", exists: !!contract?.coTepHopDong },
        ];

    return (
        <div className="admin-contract-page">
            <Link className="admin-contract-back" to="/admin/nha-hang">
                ← Về danh sách nhà hàng
            </Link>

            <div className="profile-page-header">
                <h1>Hồ sơ & hợp đồng</h1>
                <p>Kiểm tra thông tin và giấy tờ trước khi quyết định xét duyệt.</p>
            </div>

            <section className="admin-contract-section">
                <h2>Thông tin nhà hàng</h2>
                <dl className="admin-contract-info">
                    {restaurantInfo.map(([label, value]) => (
                        <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value || "Chưa có"}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            {!contract ? (
                <section className="admin-contract-section">
                    <p>Nhà hàng chưa có hợp đồng.</p>
                </section>
            ) : (
                <>
                    <section className="admin-contract-section">
                        <div className="admin-contract-heading">
                            <h2>Thông tin hợp đồng</h2>
                            <span>{STATUS[contract.trangThai] ?? contract.trangThai}</span>
                        </div>

                        <p className="admin-contract-number">
                            <FileText size={17} />
                            {contract.soHopDong}
                        </p>

                        <dl className="admin-contract-info">
                            {legalInfo.map(([label, value]) => (
                                <div key={label}>
                                    <dt>{label}</dt>
                                    <dd>{value || "Chưa có"}</dd>
                                </div>
                            ))}
                        </dl>

                        {contract.lyDoTuChoi && (
                            <p className="auth-error">
                                Lý do từ chối: {contract.lyDoTuChoi}
                            </p>
                        )}
                    </section>

                    <section className="admin-contract-section">
                        <h2>Giấy tờ đính kèm</h2>
                        {fileError && <p className="auth-error" role="alert">{fileError}</p>}

                        <div className="admin-contract-files">
                            {documents.map((document) => (
                                <button
                                    key={document.type}
                                    type="button"
                                    disabled={!document.exists || downloading !== null}
                                    onClick={() => void handleDownload(document.type)}
                                >
                                    <Download size={16} />
                                    {downloading === document.type
                                        ? "Đang tải..."
                                        : document.title}
                                    {!document.exists && " — chưa có"}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="admin-contract-section">
                        <h2>Nội dung đã ký — phiên bản {contract.phienBanDieuKhoan}</h2>
                        <div className="merchant-contract-content">
                            {contract.noiDungHopDong || "Chưa có nội dung."}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

export default AdminRestaurantContract;