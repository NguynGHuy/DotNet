import { quanApiFetch } from "./quanApi";


// =================================================
// INTERFACE
// =================================================


export interface NhomTopping {

    maNhomTopping: number;

    maNhaHang: number;

    tenNhom: string;

    batBuocChon: boolean;

    chonToiDa: number;

}



export interface Topping {

    maTopping: number;

    maNhomTopping: number;

    tenTopping: string;

    giaThem: number;

    trangThai: boolean;

}



// =================================================
// REQUEST MODELS
// =================================================


export interface TaoNhomToppingRequest {

    tenNhom: string;

    batBuocChon: boolean;

    chonToiDa: number;

}



export interface CapNhatNhomToppingRequest {

    tenNhom: string;

    batBuocChon: boolean;

    chonToiDa: number;

}



export interface TaoToppingRequest {

    maNhomTopping: number;

    tenTopping: string;

    giaThem: number;

}



export interface CapNhatToppingRequest {

    tenTopping: string;

    giaThem: number;

}



// =================================================
// NHÓM TOPPING
// =================================================



// GET danh sách nhóm topping theo nhà hàng

export const getNhomToppings = async (

    maNhaHang: number

): Promise<NhomTopping[]> => {


    const data = await quanApiFetch(

        `/nhom-topping?maNhaHang=${maNhaHang}`

    );


    return data;

};




// POST tạo nhóm topping

export const createNhomTopping = async (

    data: TaoNhomToppingRequest

) => {


    return quanApiFetch(

        "/nhom-topping",

        {

            method: "POST",

            body: JSON.stringify(data)

        }

    );


};




// PUT cập nhật nhóm topping

export const updateNhomTopping = async (

    id: number,

    data: CapNhatNhomToppingRequest

) => {


    return quanApiFetch(

        `/nhom-topping/${id}`,

        {

            method: "PUT",

            body: JSON.stringify(data)

        }

    );


};




// DELETE nhóm topping

export const deleteNhomTopping = async (

    id: number

) => {


    return quanApiFetch(

        `/nhom-topping/${id}`,

        {

            method: "DELETE"

        }

    );


};




// =================================================
// TOPPING
// =================================================



// GET topping theo nhóm

export const getToppings = async (

    maNhomTopping: number

): Promise<Topping[]> => {


    const data = await quanApiFetch(

        `/topping?maNhomTopping=${maNhomTopping}`

    );


    return data;

};




// POST tạo topping

export const createTopping = async (

    data: TaoToppingRequest

) => {


    return quanApiFetch(

        "/topping",

        {

            method: "POST",

            body: JSON.stringify(data)

        }

    );


};




// PUT cập nhật topping

export const updateTopping = async (

    id: number,

    data: CapNhatToppingRequest

) => {


    return quanApiFetch(

        `/topping/${id}`,

        {

            method: "PUT",

            body: JSON.stringify(data)

        }

    );


};




// PUT bật/tắt topping

export const updateTrangThaiTopping = async (

    id: number,

    trangThai: boolean

) => {


    return quanApiFetch(

        `/topping/${id}/trang-thai`,

        {

            method: "PUT",

            body: JSON.stringify({

                trangThai

            })

        }

    );


};
// DELETE xóa topping

export const deleteTopping = async (

    id: number

) => {


    return quanApiFetch(

        `/topping/${id}`,

        {

            method: "DELETE"

        }

    );


};