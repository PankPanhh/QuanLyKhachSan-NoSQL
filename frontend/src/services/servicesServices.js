// src/services/servicesServices.js
import api from './api';

const ADMIN_ENDPOINT = '/services';

export const getAllServices = async () => {
	try {
		const res = await api.get(ADMIN_ENDPOINT);
		if (res && res.data) return res.data;
		if (Array.isArray(res)) return res;
		return [];
	} catch (err) {
		console.error('getAllServices error', err);
		throw err;
	}
};

export const uploadServiceImage = async (id, file) => {
	try {
		const form = new FormData();
		form.append('image', file);
		const res = await api.putFormData(`${ADMIN_ENDPOINT}/${id}/image`, form);
		return res; // api client returns parsed JSON
	} catch (err) {
		console.error('uploadServiceImage error', err);
		throw err;
	}
};

export const getServiceStats = async (id) => {
	try {
		const res = await api.get(`${ADMIN_ENDPOINT}/${id}/stats`);
		return res; // parsed JSON
	} catch (err) {
		console.error('getServiceStats error', err);
		throw err;
	}
};

export const adminCreateService = async (serviceData) => {
	try {
		const res = await api.post(ADMIN_ENDPOINT, serviceData);
		return res;
	} catch (err) {
		console.error('adminCreateService error', err);
		// Fallback: if conflict, try to fetch existing
		const msg = err && err.message ? String(err.message) : '';
		if (msg.includes('Mã dịch vụ') || msg.includes('409')) {
			try {
				const all = await api.get(ADMIN_ENDPOINT);
				const list = (all && Array.isArray(all)) ? all : (all && all.data && Array.isArray(all.data) ? all.data : []);
				const found = list.find(s => s.MaDichVu === serviceData.MaDichVu);
				if (found) return { success: true, data: found };
			} catch (e2) {
				console.error('adminCreateService fallback fetch failed', e2);
			}
		}
		throw err;
	}
};

export const adminUpdateService = async (id, serviceData) => {
	try {
		const res = await api.put(`${ADMIN_ENDPOINT}/${id}`, serviceData);
		return res;
	} catch (err) {
		console.error('adminUpdateService error', err);
		throw err;
	}
};

export const adminDeleteService = async (id) => {
	try {
		const res = await api.delete(`${ADMIN_ENDPOINT}/${id}`);
		return res;
	} catch (err) {
		console.error('adminDeleteService error', err);
		throw err;
	}
};
