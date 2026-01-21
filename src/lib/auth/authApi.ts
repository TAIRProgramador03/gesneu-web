import axios from 'axios';

export async function loginApi({ usuario, password }: { usuario: string; password: string }) {
    const response = await axios.post(`/api/login`, { usuario, password }, { withCredentials: true });
    return response.data;
}

export async function checkSessionApi() {
    const response = await axios.get(`/api/session`, { withCredentials: true });
    return response.data;
}

export async function logoutApi() {
    const response = await axios.post(`/api/logout`, {}, { withCredentials: true });
    return response.data;
}