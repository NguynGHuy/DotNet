import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Home from "./pages/Home";
import RestaurantDetail from "./pages/RestaurantDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AddressPage from "./pages/Address";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
function App() {
    return (
        <BrowserRouter>
        <Header />

        < Routes >
        <Route path= "/" element = {< Home />} />

            < Route
                path = "/dang-nhap"
                element = {< Login />}
                />

                < Route
                path = "/dang-ky"
                element = {< Register />}
                />

                < Route
                path = "/nha-hang/:id"
                element = {< RestaurantDetail />}
                />
                < Route
                path = "/ho-so"
                element = {< Profile />}
                />
                < Route
                path = "/dia-chi"
                element = {< AddressPage />}
                />

                <Route path="/gio-hang" element={<Cart />} />
                <Route path="/thanh-toan" element={<Checkout />} />
                <Route path="/don-hang" element={<Orders />} />
    </Routes>
    </BrowserRouter>
  );
}

export default App;