import { useCallback, useEffect, useState } from "react";
import { WalletCards, RefreshCw, Eye, CheckCircle2, X } from "lucide-react";
import Pagination from "../components/Pagination";
import { getQuanDoiSoat, getQuanDoiSoatDetail, confirmDoiSoat } from "../services/doiSoatService";

function formatMoney(value: number) {
    return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

const STATUS_LABEL: Record<string, string> = {
    MoiTao: "Đang tính toán",
    ChoXacNhan: "Chờ bạn xác nhận",
    DaXacNhan: "Chờ thanh toán",
    DaThanhToan: "Đã nhận tiền",
    TranhChap: "Đang khiếu nại"
};

export default function RestaurantDoiSoat() {
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const [showDetail, setShowDetail] = useState<number | null>(null);
    const [detailData, setDetailData] = useState<any>(null);
    const [busy, setBusy] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getQuanDoiSoat({ pageNumber, pageSize: 10 });
            setList(res.items);
            setTotalPages(res.totalPages);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [pageNumber]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const handleViewDetail = async (id: number) => {
        try {
            setBusy(true);
            const res = await getQuanDoiSoatDetail(id);
            setDetailData(res);
            setShowDetail(id);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setBusy(false);
        }
    };

    const handleConfirm = async () => {
        if(!window.confirm("Bạn đồng ý với số liệu này và yêu cầu Admin thanh toán?")) return;
        try {
            setBusy(true);
            await confirmDoiSoat(showDetail!);
            alert("Xác nhận thành công! Vui lòng chờ Admin chuyển khoản.");
            setShowDetail(null);
            void loadData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="merchant-info-page">
            <header className="merchant-info-header">
                <div>
                    <span className="merchant-info-eyebrow">TÀI CHÍNH</span>
                    <h1>Đối soát doanh thu</h1>
                    <p>Kiểm tra số liệu và nhận thanh toán từ hệ thống.</p>
                </div>
                <button type="button" className="merchant-info-reset" onClick={loadData} disabled={loading}>
                    <RefreshCw size={16} /> Tải lại
                </button>
            </header>

            <div className="merchant-info-section">
                {loading ? <p>Đang tải dữ liệu...</p> : list.length === 0 ? <p>Chưa có kỳ đối soát nào.</p> : (
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: 12 }}>Kỳ đối soát</th>
                                <th style={{ padding: 12 }}>Số đơn</th>
                                <th style={{ padding: 12 }}>Thực nhận từ hệ thống</th>
                                <th style={{ padding: 12 }}>Trạng thái</th>
                                <th style={{ padding: 12 }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map(item => (
                                <tr key={item.maDoiSoat} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: 12 }}>
                                        <strong>#{item.maDoiSoat}</strong>
                                        <br/><small>{item.tuNgay} ➝ {item.denNgay}</small>
                                    </td>
                                    <td style={{ padding: 12 }}>{item.tongSoDon}</td>
                                    <td style={{ padding: 12 }}><strong style={{ color: '#ea580c', fontSize: 16 }}>{formatMoney(item.soTienCanDoiSoat)}</strong></td>
                                    <td style={{ padding: 12 }}>
                                        <span className={`merchant-info-approval ${item.trangThai === 'ChoXacNhan' ? '' : 'is-approved'}`}>
                                            {STATUS_LABEL[item.trangThai] || item.trangThai}
                                        </span>
                                    </td>
                                    <td style={{ padding: 12 }}>
                                        <button className="merchant-info-save" style={{ padding: '6px 12px', minHeight: 'auto' }} onClick={() => handleViewDetail(item.maDoiSoat)}>
                                            <Eye size={14}/> Xem
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {totalPages > 1 && <Pagination pageNumber={pageNumber} totalPages={totalPages} onPageChange={setPageNumber} />}
            </div>

            {/* MODAL CHI TIẾT */}
            {showDetail && detailData && (
                <div className="merchant-config-overlay">
                    <div className="merchant-config-dialog" style={{ width: 600 }}>
                        <header className="merchant-config-header">
                            <div>
                                <span>BẢNG KÊ CHI TIẾT</span>
                                <h2>Kỳ đối soát #{detailData.maDoiSoat}</h2>
                            </div>
                            <button onClick={() => setShowDetail(null)}><X size={18}/></button>
                        </header>
                        <div className="merchant-config-body">
                            <div style={{ background: '#f8f9fa', padding: 15, borderRadius: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                    <p>Tổng tiền món: <strong>{formatMoney(detailData.tongTienHang)}</strong></p>
                                    <p>Quán giảm giá: <strong>-{formatMoney(detailData.tongGiamGiaNhaHang)}</strong></p>
                                    <p>Phí nền tảng: <strong style={{ color: 'red' }}>-{formatMoney(detailData.tongPhiNenTang)}</strong></p>
                                </div>
                                <div style={{ borderLeft: '1px solid #ddd', paddingLeft: 15 }}>
                                    <p>Doanh thu thuần: <strong>{formatMoney(detailData.tongTienNhaHangNhan)}</strong></p>
                                    <p>Quán đã thu (COD): <strong style={{ color: 'red' }}>-{formatMoney(detailData.tongTienNhaHangDaThu)}</strong></p>
                                    <h3 style={{ marginTop: 10, color: '#ea580c' }}>Thực nhận: {formatMoney(detailData.soTienCanDoiSoat)}</h3>
                                </div>
                            </div>
                            
                            {detailData.trangThai === "ChoXacNhan" && (
                                <div style={{ marginTop: 20, textAlign: 'right' }}>
                                    <button 
                                        className="merchant-info-save" 
                                        onClick={handleConfirm}
                                        disabled={busy}
                                        style={{ width: '100%', fontSize: 15, padding: 12 }}
                                    >
                                        <CheckCircle2 size={18}/> Xác nhận số liệu đúng
                                    </button>
                                </div>
                            )}

                            {detailData.trangThai === "DaThanhToan" && (
                                <div style={{ marginTop: 20, padding: 15, background: '#ecfdf5', color: '#047857', borderRadius: 8, textAlign: 'center' }}>
                                    <strong>Đã nhận thanh toán từ hệ thống</strong><br/>
                                    Mã GD: {detailData.maGiaoDichDoiSoat}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}