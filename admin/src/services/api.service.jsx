import apiServiceInstance from "../config/axios.config";


export const get = async (uri, token, params) => {
    try {
        const headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        // console.log('Headers:', headers.Authorization );

        const res = await apiServiceInstance.get(uri, { headers, params });
        return res;
    } catch (error) {
        throw error;
    }
};

export const post = async (uri, data, token) => {
    try {
        const headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        console.log(apiServiceInstance)
        const res = await apiServiceInstance.post(uri, data, { headers });
        return res.data; // Đảm bảo trả về res.data
    } catch (error) {
        throw error;
    }
};

export const put = async (uri, data, token) => {
    try {
        const headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const res = await apiServiceInstance.put(uri, data, { headers });
        return res.data;
    } catch (error) {
        throw error;
    }
};

export const del = async (uri, data, token) => {
    try {
        const headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const res = await apiServiceInstance.delete(uri, { headers, data });
        return res.data;
    } catch (error) {
        throw error;
    }
};

export const patch = async (uri, data, token) => {
    try {
        const headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const res = await apiServiceInstance.patch(uri, data, { headers });
        return res.data;
    } catch (error) {
        throw error;
    }
};


