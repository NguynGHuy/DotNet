import { quanApiFetch } from "./quanApi";


export interface MonAn {

    maMonAn: number;

    maNhaHang: number;

    maDanhMuc: number;

    tenDanhMuc: string;

    tenMonAn: string;

    moTa?: string;

    gia: number;

    hinhAnh?: string;

    trangThai: boolean;

    danhGiaTrungBinh: number;

}



export interface TaoMonAnRequest {

    maDanhMuc: number;

    tenMonAn: string;

    moTa?: string;

    gia: number;

    hinhAnh?: string;

}



export interface CapNhatMonAnRequest {

    maDanhMuc: number;

    tenMonAn: string;

    moTa?: string;

    gia: number;

    hinhAnh?: string;

}



// GET danh sách món ăn theo nhà hàng

export const getMonAns = async (

    maNhaHang: number

): Promise<MonAn[]> => {


    return quanApiFetch(

        `/mon-an?maNhaHang=${maNhaHang}`

    );


};



// GET chi tiết món ăn

export const getMonAn = async (

    id: number

): Promise<MonAn> => {


    return quanApiFetch(

        `/mon-an/${id}`

    );


};



// POST tạo món ăn

export const createMonAn = async (

    data: TaoMonAnRequest

) => {


    return quanApiFetch(

        "/mon-an",

        {

            method: "POST",

            body: JSON.stringify(data)

        }

    );


};



// PUT cập nhật món ăn

export const updateMonAn = async (

    id: number,

    data: CapNhatMonAnRequest

) => {


    return quanApiFetch(

        `/mon-an/${id}`,

        {

            method: "PUT",

            body: JSON.stringify(data)

        }

    );


};



// PUT bật/tắt trạng thái món

export const updateTrangThaiMonAn = async (

    id: number,

    trangThai: boolean

) => {


    return quanApiFetch(

        `/mon-an/${id}/trang-thai`,

        {

            method: "PUT",

            body: JSON.stringify({

                trangThai

            })

        }

    );


};



// DELETE món ăn

export const deleteMonAn = async (

    id: number

) => {


    return quanApiFetch(

        `/mon-an/${id}`,

        {

            method: "DELETE"

        }

    );


};



// POST gán nhóm topping

export const ganTopping = async (

    maMonAn: number,

    maNhomTopping: number

) => {


    return quanApiFetch(

        `/mon-an/${maMonAn}/gan-topping`,

        {

            method: "POST",

            body: JSON.stringify(

                maNhomTopping

            )

        }

    );


};



// DELETE gỡ nhóm topping

export const goTopping = async (

    maMonAn: number,

    maNhomTopping: number

) => {


    return quanApiFetch(

        `/mon-an/${maMonAn}/go-topping/${maNhomTopping}`,

        {

            method: "DELETE"

        }

    );


};