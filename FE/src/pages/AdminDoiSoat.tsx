import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Wallet, Plus, X, Eye } from "lucide-react";
import Pagination from "../components/Pagination";
import { getAdminDoiSoat, createDoiSoat, getAdminDoiSoatDetail, payDoiSoat } from "../services/doiSoatService";

function formatMoney(value: number) {
    return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

const STATUS_LABEL: Record<string, string> = {
    MoiTao: "Mới tạo",
    ChoXacNhan: "Chờ nhà hàng xác nhận",
    DaXacNhan: "Chờ thanh toán",
    DaThanhToan: "Đã thanh toán",
    TranhChap: "Đang tranh chấp"
};

export default function AdminDoiSoat() {
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const [showCreate, setShowCreate] = useState(false);
    const [showDetail, setShowDetail] = useState<number | null>(null);
    const [detailData, setDetailData] = useState<any>(null);
    const [maGiaoDich, setMaGiaoDich] = useState("");
    
    // Form tạo mới
    const [formCreate, setFormCreate] = useState({ maNhaHang: "", tuNgay: "", denNgay: "" });
    const [busy, setBusy] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getAdminDoiSoat({ pageNumber, pageSize: 10 });
            setList(res.items);
            setTotalPages(res.totalPages);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [pageNumber]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setBusy(true);
            await createDoiSoat({
                maNhaHang: Number(formCreate.maNhaHang),
                tuNgay: formCreate.tuNgay,
                denNgay: formCreate.denNgay
            });
            setShowCreate(false);
            void loadData();
            alert("Tạo kỳ đối soát thành công!");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setBusy(false);
        }
    };

    const handleViewDetail = async (id: number) => {
        try {
            setBusy(true);
            const res = await getAdminDoiSoatDetail(id);
            setDetailData(res);
            setShowDetail(id);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setBusy(false);
        }
    };

    const handlePay = async () => {
        if (!maGiaoDich.trim()) return alert("Vui lòng nhập mã giao dịch.");
        try {
            setBusy(true);
            await payDoiSoat(showDetail!, maGiaoDich);
            alert("Xác nhận thanh toán thành công!");
            setShowDetail(null);
            void loadData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="admin-promotions-pro">
            <header className="admin-promotions-heading">
                <div>
                    <span>Kế toán & Tài chính</span>
                    <h1>Đối soát doanh thu</h1>
                    <p>Quản lý doanh thu, phí nền tảng và thanh toán cho nhà hàng.</p>
                </div>
                <div className="admin-promotions-heading-actions">
                    <button type="button" className="refresh" onClick={loadData} disabled={loading}>
                        <RefreshCw size={15} /> Tải lại
                    </button>
                    <button type="button" className="create" onClick={() => setShowCreate(true)}>
                        <Plus size={16} /> Tạo kỳ đối soát
                    </button>
                </div>
            </header>

            <section className="admin-promotions-panel">
                {loading ? (
                    <div className="admin-promotions-loading">Đang tải dữ liệu...</div>
                ) : (
                    <div className="admin-promotions-table-scroll">
                        <table className="admin-promotions-table">
                            <thead>
                                <tr>
                                    <th>Kỳ đối soát</th>
                                    <th>Nhà hàng</th>
                                    <th>Số đơn</th>
                                    <th>Tiền cần thanh toán</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map(item => (
                                    <tr key={item.maDoiSoat}>
                                        <td>
                                            <strong>Kỳ #{item.maDoiSoat}</strong>
                                            <small>{item.tuNgay} đến {item.denNgay}</small>
                                        </td>
                                        <td>{item.tenNhaHang} <small>Mã: {item.maNhaHang}</small></td>
                                        <td>{item.tongSoDon} đơn</td>
                                        <td><strong style={{ color: "#e14a1b" }}>{formatMoney(item.soTienCanDoiSoat)}</strong></td>
                                        <td>
                                            <span className={`admin-promotion-state ${item.trangThai === 'DaThanhToan' ? 'active' : 'upcoming'}`}>
                                                <i aria-hidden="true" />
                                                {STATUS_LABEL[item.trangThai] || item.trangThai}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="admin-account-toggle unlock" onClick={() => handleViewDetail(item.maDoiSoat)}>
                                                <Eye size={14} /> Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {totalPages > 1 && <Pagination pageNumber={pageNumber} totalPages={totalPages} onPageChange={setPageNumber} />}
            </section>

            {/* MODAL TẠO MỚI */}
            {showCreate && (
                <div className="admin-promotion-modal-overlay">
                    <div className="admin-promotion-modal edit-modal">
                        <button className="admin-promotion-modal-close" onClick={() => setShowCreate(false)}><X size={18} /></button>
                        <form onSubmit={handleCreate}>
                            <h2>Tạo kỳ đối soát mới</h2>
                            <p style={{ marginBottom: 20 }}>Tổng hợp các đơn đã hoàn thành chưa được đối soát.</p>
                            
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 15 }}>
                                <span>Mã nhà hàng</span>
                                <input type="number" required value={formCreate.maNhaHang} onChange={e => setFormCreate({...formCreate, maNhaHang: e.target.value})} />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 15 }}>
                                <span>Từ ngày</span>
                                <input type="date" required value={formCreate.tuNgay} onChange={e => setFormCreate({...formCreate, tuNgay: e.target.value})} />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 15 }}>
                                <span>Đến ngày</span>
                                <input type="date" required value={formCreate.denNgay} onChange={e => setFormCreate({...formCreate, denNgay: e.target.value})} />
                            </label>

                            <div className="promotion-edit-actions">
                                <button type="button" onClick={() => setShowCreate(false)}>Hủy</button>
                                <button type="submit" disabled={busy}>{busy ? "Đang tạo..." : "Tạo kỳ đối soát"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT & THANH TOÁN */}
            {showDetail && detailData && (
                <div className="admin-promotion-modal-overlay">
                    <div className="admin-promotion-modal">
                        <button className="admin-promotion-modal-close" onClick={() => setShowDetail(null)}><X size={18} /></button>
                        <h2>Chi tiết kỳ đối soát #{detailData.maDoiSoat}</h2>
                        <p style={{ marginBottom: 20 }}>Nhà hàng: {detailData.tenNhaHang}</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
                            <div style={{ padding: 15, background: '#fafafa', borderRadius: 10 }}>
                                <p>Tổng tiền hàng: <strong>{formatMoney(detailData.tongTienHang)}</strong></p>
                                <p>Giảm giá NH chi trả: <strong>{formatMoney(detailData.tongGiamGiaNhaHang)}</strong></p>
                                <p>Phí nền tảng thu: <strong style={{ color: 'red' }}>{formatMoney(detailData.tongPhiNenTang)}</strong></p>
                            </div>
                            <div style={{ padding: 15, background: '#fff0e8', borderRadius: 10 }}>
                                <p>Tiền NH thực nhận: <strong>{formatMoney(detailData.tongTienNhaHangNhan)}</strong></p>
                                <p>Tiền NH đã thu (COD): <strong>{formatMoney(detailData.tongTienNhaHangDaThu)}</strong></p>
                                <hr style={{ margin: '10px 0', border: '1px solid #fed7aa' }}/>
                                <p>Hệ thống cần thanh toán: <strong style={{ fontSize: 18, color: '#c2410c' }}>{formatMoney(detailData.soTienCanDoiSoat)}</strong></p>
                            </div>
                        </div>

                        {detailData.trangThai === "DaXacNhan" && (
                            <div style={{ padding: 15, border: '1px solid #bde8d0', background: '#effbf4', borderRadius: 10, marginBottom: 20 }}>
                                <strong style={{ color: '#16805a' }}>Nhà hàng đã xác nhận số liệu.</strong>
                                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                    <input 
                                        type="text" 
                                        placeholder="Nhập mã giao dịch ngân hàng..." 
                                        style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
                                        value={maGiaoDich}
                                        onChange={e => setMaGiaoDich(e.target.value)}
                                    />
                                    <button 
                                        onClick={handlePay} 
                                        disabled={busy}
                                        style={{ background: '#16805a', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Xác nhận đã chuyển khoản
                                    </button>
                                </div>
                            </div>
                        )}

                        {detailData.trangThai === "DaThanhToan" && (
                            <p style={{ color: '#16805a', fontWeight: 'bold', marginBottom: 20 }}>Đã thanh toán (Mã GD: {detailData.maGiaoDichDoiSoat})</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}