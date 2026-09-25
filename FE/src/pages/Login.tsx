import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { getCurrentUser } from "../services/userService";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [matKhau, setMatKhau] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        setError("");

        // Validation email
        if (!email.trim()) {
            setError("Vui lòng nhập email.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
            setError("Email không đúng định dạng.");
            return;
        }

        // Validation mật khẩu
        if (!matKhau) {
            setError("Vui lòng nhập mật khẩu.");
            return;
        }

        try {
            setLoading(true);

            const data = await login({
                email: email.trim(),
                matKhau,
            });

            // Lưu JWT
            localStorage.setItem("token", data.token);

            // Lấy thông tin user
            const user = await getCurrentUser();

            console.log("Thông tin tài khoản:", user);

            // Gửi event để Header biết user vừa đăng nhập
            window.dispatchEvent(
                new CustomEvent("login-success", {
                    detail: user,
                })
            );

            navigate("/");
        } catch (error) {
            console.error("LOGIN ERROR:", error);

            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Đăng nhập thất bại.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className= "auth-page" >
        <div className="auth-card" >
            <h2>Đăng nhập </h2>

                < p className = "auth-description" >
                    Đăng nhập để tiếp tục sử dụng dịch vụ
                        </p>

                        < div className = "form-group" >
                            <label>Email </label>

                            < input
    type = "email"
    placeholder = "Nhập email của bạn"
    value = { email }
    onChange = {(e) => setEmail(e.target.value)
}
          />
    </div>

    < div className = "form-group" >
        <label>Mật khẩu </label>

            < input
type = "password"
placeholder = "Nhập mật khẩu"
value = { matKhau }
onChange = {(e) => setMatKhau(e.target.value)}
          />
    </div>

{
    error && (
        <p className="auth-error" >
        { error }
            </p>
        )
}

<button
          className="auth-button"
onClick = { handleLogin }
disabled = { loading }
    >
{ loading? "Đang đăng nhập...": "Đăng nhập" }
    </button>

    < p className = "auth-footer" >
        Chưa có tài khoản ? { " "}
            < Link to = "/dang-ky" >
                Đăng ký ngay
                    </Link>
                    </p>
                    </div>
                    </main>
  );
}

export default Login;