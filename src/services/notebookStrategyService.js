import axios from "axios";
import { getToken } from "../pages/auth/protected";

const STRATEGY_ENGINE_BASE_URL = (
  import.meta.env.VITE_STRATEGY_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:4001"
).replace(/\/+$/, "");

const LOCAL_PYTHON_FALLBACK_URL = "http://127.0.0.1:4001";

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
  const requestConfig = buildRequestConfig();

  try {
    const response = await axios.post(
      `${STRATEGY_ENGINE_BASE_URL}/api/strategy/notebook-strategies`,
      payload,
      requestConfig,
    );
    return response?.data || response;
  } catch (error) {
    if (
      error?.response?.status !== 404 ||
      STRATEGY_ENGINE_BASE_URL === LOCAL_PYTHON_FALLBACK_URL
    ) {
      throw error;
    }

    const fallbackResponse = await axios.post(
      `${LOCAL_PYTHON_FALLBACK_URL}/api/strategy/notebook-strategies`,
      payload,
      requestConfig,
    );
    return fallbackResponse?.data || fallbackResponse;
  }
}

export async function getNotebookStrategies(params = {}) {
  const requestConfig = {
    ...buildRequestConfig(),
    params: {
      search: params?.search || undefined,
      userId: params?.userId || undefined,
      limit: params?.limit ?? 50,
      offset: params?.offset ?? 0,
    },
  };

  try {
    const response = await axios.get(
      `${STRATEGY_ENGINE_BASE_URL}/api/strategy/notebook-strategies`,
      requestConfig,
    );
    return response?.data || response;
  } catch (error) {
    if (
      error?.response?.status !== 404 ||
      STRATEGY_ENGINE_BASE_URL === LOCAL_PYTHON_FALLBACK_URL
    ) {
      throw error;
    }

    const fallbackResponse = await axios.get(
      `${LOCAL_PYTHON_FALLBACK_URL}/api/strategy/notebook-strategies`,
      requestConfig,
    );
    return fallbackResponse?.data || fallbackResponse;
  }
}

export async function updateNotebookStrategy(strategyId, payload) {
  const requestConfig = buildRequestConfig();

  try {
    const response = await axios.put(
      `${STRATEGY_ENGINE_BASE_URL}/api/strategy/notebook-strategies/${strategyId}`,
      payload,
      requestConfig,
    );
    return response?.data || response;
  } catch (error) {
    if (
      error?.response?.status !== 404 ||
      STRATEGY_ENGINE_BASE_URL === LOCAL_PYTHON_FALLBACK_URL
    ) {
      throw error;
    }

    const fallbackResponse = await axios.put(
      `${LOCAL_PYTHON_FALLBACK_URL}/api/strategy/notebook-strategies/${strategyId}`,
      payload,
      requestConfig,
    );
    return fallbackResponse?.data || fallbackResponse;
  }
}
