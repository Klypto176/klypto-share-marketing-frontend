import axios from "axios";
import { getToken } from "../pages/auth/protected";

export async function executeIndicatorSandbox(payload) {
  const sanitizedPayload = {
    sessionId: payload?.sessionId,
    resetBeforeExecution: Boolean(payload?.resetBeforeExecution),
    timeoutSeconds: payload?.timeoutSeconds ?? 120,
    mode: payload?.mode || "indicator",
    code: payload?.code || "",
    inputs: {
      symbol: payload?.inputs?.symbol,
      lookupSymbol: payload?.inputs?.lookupSymbol,
      token: payload?.inputs?.token,
      timeframe: payload?.inputs?.timeframe,
      exchange: payload?.inputs?.exchange,
      fromDate: payload?.inputs?.fromDate,
      toDate: payload?.inputs?.toDate,
      settings: payload?.inputs?.settings || {},
    },
  };

  const token = getToken();
  const baseUrl = (
    import.meta.env.VITE_STRATEGY_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000"
  ).replace(/\/+$/, "");
  const requestConfig = {
    timeout: 120000,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  try {
    const response = await axios.post(
      `${baseUrl}/sandbox/execute`,
      sanitizedPayload,
      requestConfig,
    );
    return response?.data || response;
  } catch (error) {
    if (error?.response?.status !== 404) {
      throw error;
    }

    const fallbackResponse = await axios.post(
      `${baseUrl}/sandbox/execute`,
      sanitizedPayload,
      requestConfig,
    );
    return fallbackResponse?.data || fallbackResponse;
  }
}
