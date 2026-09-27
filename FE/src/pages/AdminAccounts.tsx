import { useEffect, useState } from "react";
import {
    getAdminAccounts,
    lockAccount,
    unlockAccount,
} from "../services/adminService";
import type { AdminAccount } from "../services/adminService";

function AdminAccounts() {
    const [accounts, setAccounts] = useState<AdminAccount[]>([]);
    const [keyword, setKeyword] = useState("");
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        getAdminAccounts()
            .then(setAccounts)
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleToggle = async (account: AdminAccount) => {
        const action = account.trangThai ? "khóa" : "mở khóa";

        if (!window.confirm(`Bạn muốn ${action} tài khoản ${account.email}?`)) {
            return;
        }

        try {
            setBusyId(account.maTaiKhoan);
            setError("");

            if (account.trangThai) {
                await lockAccount(account.maTaiKhoan);
            } else {
                await unlockAccount(account.maTaiKhoan);
            }

            setAccounts(await getAdminAccounts());
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setBusyId(null);
        }
    };

    const filteredAccounts = accounts.filter((account) =>
        account.email.toLowerCase().includes(keyword.trim().toLowerCase())
    );

    return (
        <main className="profile-page admin-accounts-page">
            <div className="profile-page-header">
                <h1>Quản lý tài khoản</h1>
                <p>Xem trạng thái và quản lý tài khoản người dùng</p>
            </div>

            <input
                className="admin-account-search"
                type="search"
                placeholder="Tìm theo email..."
                aria-label="Tìm theo email"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
            />

            {error && <p className="auth-error">{error}</p>}

            {loading ? (
                <p>Đang tải tài khoản...</p>
            ) : filteredAccounts.length === 0 ? (
                <div className="empty-result">
                    <h3>Không tìm thấy tài khoản</h3>
                </div>
            ) : (
                <div className="admin-account-table-wrap">
                    <table className="admin-account-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Vai trò</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAccounts.map((account) => (
                                <tr key={account.maTaiKhoan}>
                                    <td>
                                        <strong>{account.email}</strong>
                                        <small>{account.soDienThoai || "Chưa có SĐT"}</small>
                                    </td>
                                    <td>{account.role}</td>
                                    <td>
                                        <span
                                            className={
                                                account.trangThai
                                                    ? "admin-account-status active"
                                                    : "admin-account-status locked"
                                            }
                                        >
                                            {account.trangThai
                                                ? "Hoạt động"
                                                : "Đã khóa"}
                                        </span>
                                    </td>
                                    <td>
                                        {new Date(account.ngayTao).toLocaleDateString(
                                            "vi-VN"
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            disabled={busyId === account.maTaiKhoan}
                                            onClick={() => handleToggle(account)}
                                        >
                                            {busyId === account.maTaiKhoan
                                                ? "Đang xử lý..."
                                                : account.trangThai
                                                    ? "Khóa"
                                                    : "Mở khóa"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}

export default AdminAccounts;