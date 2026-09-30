import {
    useEffect,
    useState
} from "react";


import {
    getDanhMucs,
    createDanhMuc,
    updateDanhMuc,
    deleteDanhMuc,
    type DanhMuc
} from "../services/categoryService";


import {
    getCurrentUser
} from "../services/userService";



interface CurrentUser {

    nhaHang?: {

        maNhaHang: number;

    };

}



function RestaurantCategory() {


    const [danhMucs, setDanhMucs]
        = useState<DanhMuc[]>([]);



    const [loading, setLoading]
        = useState<boolean>(true);



    const [error, setError]
        = useState<string>("");



    // =========================
    // FORM THÊM DANH MỤC
    // =========================


    const [showForm, setShowForm]
        = useState<boolean>(false);



    const [tenDanhMuc, setTenDanhMuc]
        = useState<string>("");



    const [thuTuHienThi, setThuTuHienThi]
        = useState<number>(0);




    // =========================
    // FORM SỬA DANH MỤC
    // =========================


    const [editId, setEditId]
        = useState<number | null>(null);



    const [editTenDanhMuc, setEditTenDanhMuc]
        = useState<string>("");



    const [editThuTuHienThi, setEditThuTuHienThi]
        = useState<number>(0);






    useEffect(() => {


        const loadData = async () => {


            try {


                setLoading(true);

                setError("");



                const user =
                    await getCurrentUser() as CurrentUser;



                const maNhaHang =
                    user.nhaHang?.maNhaHang;



                if (!maNhaHang) {


                    throw new Error(
                        "Không tìm thấy nhà hàng"
                    );


                }





                const data =
                    await getDanhMucs(
                        maNhaHang
                    );



                setDanhMucs(data);



            }
            catch (err) {


                console.error(
                    "Lỗi tải danh mục:",
                    err
                );



                setError(
                    "Không tải được danh mục"
                );



            }
            finally {


                setLoading(false);



            }


        };



        loadData();



    }, []);








    // =========================
    // TẠO DANH MỤC
    // =========================


    const handleCreate = async () => {


        if (!tenDanhMuc.trim()) {


            alert(
                "Vui lòng nhập tên danh mục"
            );


            return;


        }





        try {


            await createDanhMuc(

                tenDanhMuc.trim(),

                thuTuHienThi

            );



            setTenDanhMuc("");

            setThuTuHienThi(0);

            setShowForm(false);



            window.location.reload();



        }
        catch (err) {


            console.error(
                "Lỗi tạo danh mục:",
                err
            );



            if (err instanceof Error) {


                alert(
                    err.message
                );


            }
            else {


                alert(
                    "Không thể tạo danh mục"
                );


            }


        }


    };







    // =========================
    // CHỌN DANH MỤC ĐỂ SỬA
    // =========================


    const handleEdit = (
        item: DanhMuc
    ) => {


        setEditId(
            item.maDanhMuc
        );


        setEditTenDanhMuc(
            item.tenDanhMuc
        );


        setEditThuTuHienThi(
            item.thuTuHienThi
        );


    };







    // =========================
    // CẬP NHẬT DANH MỤC
    // =========================


    const handleUpdate = async () => {


        if (editId === null) {

            return;

        }



        try {


            await updateDanhMuc(

                editId,

                editTenDanhMuc,

                editThuTuHienThi

            );



            setEditId(null);

            setEditTenDanhMuc("");

            setEditThuTuHienThi(0);



            window.location.reload();



        }
        catch (err) {


            console.error(
                "Lỗi cập nhật danh mục:",
                err
            );


            alert(
                "Không thể cập nhật danh mục"
            );


        }


    };







    // =========================
    // XÓA DANH MỤC
    // =========================


    const handleDelete = async (

        id: number

    ) => {



        const confirmDelete =
            window.confirm(
                "Bạn có chắc muốn xóa danh mục này?"
            );



        if (!confirmDelete) {

            return;

        }



        try {


            await deleteDanhMuc(id);



            window.location.reload();



        }
        catch (err) {


            console.error(
                "Lỗi xóa danh mục:",
                err
            );


            alert(
                "Không thể xóa danh mục"
            );


        }


    };







    return (


        <div>


            <h1>
                Quản lý danh mục
            </h1>





            <button

                onClick={() =>
                    setShowForm(true)
                }

            >

                + Thêm danh mục

            </button>







            {
                showForm && (


                    <div>


                        <input

                            type="text"

                            placeholder="Tên danh mục"

                            value={
                                tenDanhMuc
                            }


                            onChange={
                                (e) =>
                                    setTenDanhMuc(
                                        e.target.value
                                    )
                            }

                        />




                        <input

                            type="number"

                            placeholder="Thứ tự hiển thị"

                            value={
                                thuTuHienThi
                            }


                            onChange={
                                (e) =>
                                    setThuTuHienThi(
                                        Number(
                                            e.target.value
                                        )
                                    )
                            }

                        />





                        <button

                            onClick={
                                handleCreate
                            }

                        >

                            Lưu

                        </button>





                        <button

                            onClick={() => {

                                setShowForm(false);

                                setTenDanhMuc("");

                                setThuTuHienThi(0);

                            }}

                        >

                            Hủy

                        </button>



                    </div>


                )

            }







            {
                editId !== null && (


                    <div>


                        <h3>
                            Sửa danh mục
                        </h3>



                        <input

                            type="text"

                            value={
                                editTenDanhMuc
                            }


                            onChange={
                                (e) =>
                                    setEditTenDanhMuc(
                                        e.target.value
                                    )
                            }

                        />



                        <input

                            type="number"

                            value={
                                editThuTuHienThi
                            }


                            onChange={
                                (e) =>
                                    setEditThuTuHienThi(
                                        Number(
                                            e.target.value
                                        )
                                    )
                            }

                        />



                        <button

                            onClick={
                                handleUpdate
                            }

                        >

                            Lưu sửa

                        </button>



                        <button

                            onClick={() => {

                                setEditId(null);

                            }}

                        >

                            Hủy

                        </button>



                    </div>


                )

            }








            {
                loading && (

                    <p>
                        Đang tải...
                    </p>

                )
            }






            {
                error && (

                    <p>
                        {error}
                    </p>

                )
            }







            {

                danhMucs.map(item => (


                    <div

                        key={
                            item.maDanhMuc
                        }

                    >


                        <h3>

                            {
                                item.tenDanhMuc
                            }

                        </h3>


                        <p>

                            Thứ tự:
                            {" "}
                            {
                                item.thuTuHienThi
                            }

                        </p>




                        <button

                            onClick={() =>
                                handleEdit(item)
                            }

                        >

                            Sửa

                        </button>




                        <button

                            onClick={() =>
                                handleDelete(
                                    item.maDanhMuc
                                )
                            }

                        >

                            Xóa

                        </button>



                    </div>



                ))

            }





        </div>


    );


}



export default RestaurantCategory;