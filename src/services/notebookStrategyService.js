import axios from "axios";
import { getToken, getUser } from "../pages/auth/protected";
import apiService from "./apiServices";
import Swal from "sweetalert2";

const STRATEGY_ENGINE_BASE_URL = (
  import.meta.env.VITE_STRATEGY_API_URL || import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/+$/, "");
const userId = getUser()?.id;

function buildRequestConfig() {
  const token = getToken();
  return {
    timeout: 90000,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

export async function saveNotebookStrategy(payload) {

  try {
    const response = await apiService.post("api/strategy/user-strategies",
      payload,
    );
    await Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Saved successfully",
            showConfirmButton: false,
            timer: 1800,
            timerProgressBar: true,
          });
    return response?.data || response;
  } catch (error) {
    if (
      error?.response?.status !== 404
    ) {
      throw error;
    }
  }
}

export async function getNotebookStrategies() {
  try {
    const response = await apiService.get(`/api/strategy/user-strategies?userId=${userId}`);
    return response?.data || response;
  } catch (error) {
    if (
      error?.response?.status !== 404
    ) {
      throw error;
    }
  }
}

export async function updateNotebookStrategy(strategyId, payload) {
  try {
    const response = await apiService.put(`/api/strategy/user-strategies/${strategyId}`,
      payload,
    );
    return response?.data || response;
  } catch (error) {
    if (
      error?.response?.status !== 404
    ) {
      throw error;
    }
  }
}
