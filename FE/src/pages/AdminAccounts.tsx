import { useCallback, useEffect, useMemo, useState } from "react";
import {
    LockKeyhole,
    RefreshCw,
    Search,
    ShieldCheck,
    UnlockKeyhole,
    UserRound,
    UsersRound,
} from "lucide-react";
import {
    getAdminAccounts,
    lockAccount,
    unlockAccount,
} from "../services/adminService";
import type { AdminAccount } from "../services/adminService";

type StatusFilter = "all" | "active" | "locked";

const ROLE_LABEL: Record<string, string> = {
    Admin: "Quản trị viên",
    Quan: "Nhà hàng",
    KhachHang: "Khách hàng",
};

function getRoleClass(role: string) {
    if (role === "Admin") return "role-admin";
    if (role === "Quan") return "role-restaurant";
    return "role-customer";
}

function AdminAccounts() {
    const [accounts, setAccounts] = useState<AdminAccount[]>([]);
    const [keyword, setKeyword] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("all");
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [error, setError] = useState("");

    const loadAccounts = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const result = await getAdminAccounts();
            setAccounts(Array.isArray(result) ? result : []);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể tải danh sách tài khoản."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAccounts();
    }, [loadAccounts]);

    const handleToggle = async (account: AdminAccount) => {
        const action = account.trangThai ? "khóa" : "mở khóa";

        if (
            !window.confirm(
                `Bạn có chắc muốn ${action} tài khoản ${account.email}?`
            )
        ) {
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

            await loadAccounts();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : `Không thể ${action} tài khoản.`
            );
        } finally {
            setBusyId(null);
        }
    };

    const roles = useMemo(
        () =>
            Array.from(
                new Set(accounts.map((account) => account.role))
            ).sort(),
        [accounts]
    );

    const filteredAccounts = useMemo(() => {
        const searchValue = keyword.trim().toLocaleLowerCase("vi-VN");

        return accounts.filter((account) => {
            const matchesKeyword =
                !searchValue ||
                account.email
                    .toLocaleLowerCase("vi-VN")
                    .includes(searchValue) ||
                (account.soDienThoai ?? "").includes(searchValue);

            const matchesRole =
                roleFilter === "all" || account.role === roleFilter;

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active"
                    ? account.trangThai
                    : !account.trangThai);

            return matchesKeyword && matchesRole && matchesStatus;
        });
    }, [accounts, keyword, roleFilter, statusFilter]);

    const activeCount = accounts.filter(
        (account) => account.trangThai
    ).length;
    const lockedCount = accounts.length - activeCount;

    return (
        <div className="admin-accounts-pro">
            <header className="admin-accounts-heading">
                <div>
                    <span>Người dùng hệ thống</span>
                    <h1>Quản lý tài khoản</h1>
                    <p>
                        Theo dõi và kiểm soát trạng thái tài khoản người dùng.
                    </p>
                </div>

                <button
                    type="button"
                    className="admin-accounts-refresh"
                    onClick={() => void loadAccounts()}
                    disabled={loading}
                >
                    <RefreshCw size={15} />
                    Tải lại
                </button>
            </header>

            <section className="admin-account-summary">
                <article>
                    <span className="summary-icon total">
                        <UsersRound size={18} />
                    </span>
                    <div>
                        <small>Tổng tài khoản</small>
                        <strong>{accounts.length}</strong>
                    </div>
                </article>

                <article>
                    <span className="summary-icon active">
                        <ShieldCheck size={18} />
                    </span>
                    <div>
                        <small>Đang hoạt động</small>
                        <strong>{activeCount}</strong>
                    </div>
                </article>

                <article>
                    <span className="summary-icon locked">
                        <LockKeyhole size={18} />
                    </span>
                    <div>
                        <small>Đã khóa</small>
                        <strong>{lockedCount}</strong>
                    </div>
                </article>
            </section>

            <section className="admin-accounts-panel">
                <div className="admin-accounts-toolbar">
                    <label className="admin-account-search-pro">
                        <Search size={16} />
                        <input
                            type="search"
                            placeholder="Tìm email hoặc số điện thoại..."
                            aria-label="Tìm tài khoản"
                            value={keyword}
                            onChange={(event) =>
                                setKeyword(event.target.value)
                            }
                        />
                    </label>

                    <div className="admin-account-filters">
                        <select
                            aria-label="Lọc theo vai trò"
                            value={roleFilter}
                            onChange={(event) =>
                                setRoleFilter(event.target.value)
                            }
                        >
                            <option value="all">Tất cả vai trò</option>
                            {roles.map((role) => (
                                <option key={role} value={role}>
                                    {ROLE_LABEL[role] || role}
                                </option>
                            ))}
                        </select>

                        <select
                            aria-label="Lọc theo trạng thái"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value as StatusFilter
                                )
                            }
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="active">Đang hoạt động</option>
                            <option value="locked">Đã khóa</option>
                        </select>
                    </div>
                </div>

                <div className="admin-accounts-result-bar">
                    <span>
                        Hiển thị <strong>{filteredAccounts.length}</strong>{" "}
                        trong tổng số <strong>{accounts.length}</strong> tài khoản
                    </span>
                </div>

                {error && (
                    <div className="admin-accounts-error" role="alert">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="admin-accounts-loading">
                        <RefreshCw size={20} />
                        <span>Đang tải tài khoản...</span>
                    </div>
                ) : filteredAccounts.length === 0 ? (
                    <div className="admin-accounts-empty">
                        <UserRound size={28} />
                        <strong>Không tìm thấy tài khoản</strong>
                        <p>Hãy thử thay đổi từ khóa hoặc bộ lọc.</p>
                    </div>
                ) : (
                    <div className="admin-account-table-scroll">
                        <table className="admin-account-table-pro">
                            <thead>
                                <tr>
                                    <th>Tài khoản</th>
                                    <th>Vai trò</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredAccounts.map((account) => {
                                    const isBusy =
                                        busyId === account.maTaiKhoan;

                                    return (
                                        <tr key={account.maTaiKhoan}>
                                            <td>
                                                <div className="admin-account-identity">
                                                    <span>
                                                        {account.email
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                    <div>
                                                        <strong>
                                                            {account.email}
                                                        </strong>
                                                        <small>
                                                            {account.soDienThoai ||
                                                                "Chưa cập nhật SĐT"}
                                                        </small>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span
                                                    className={`admin-account-role ${getRoleClass(
                                                        account.role
                                                    )}`}
                                                >
                                                    {ROLE_LABEL[
                                                        account.role
                                                    ] || account.role}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`admin-account-state ${
                                                        account.trangThai
                                                            ? "is-active"
                                                            : "is-locked"
                                                    }`}
                                                >
                                                    <i aria-hidden="true" />
                                                    {account.trangThai
                                                        ? "Hoạt động"
                                                        : "Đã khóa"}
                                                </span>
                                            </td>

                                            <td>
                                                <time>
                                                    {new Date(
                                                        account.ngayTao
                                                    ).toLocaleDateString(
                                                        "vi-VN"
                                                    )}
                                                </time>
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className={`admin-account-toggle ${
                                                        account.trangThai
                                                            ? "lock"
                                                            : "unlock"
                                                    }`}
                                                    disabled={isBusy}
                                                    onClick={() =>
                                                        void handleToggle(
                                                            account
                                                        )
                                                    }
                                                >
                                                    {account.trangThai ? (
                                                        <LockKeyhole
                                                            size={14}
                                                        />
                                                    ) : (
                                                        <UnlockKeyhole
                                                            size={14}
                                                        />
                                                    )}

                                                    {isBusy
                                                        ? "Đang xử lý..."
                                                        : account.trangThai
                                                          ? "Khóa"
                                                          : "Mở khóa"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default AdminAccounts;