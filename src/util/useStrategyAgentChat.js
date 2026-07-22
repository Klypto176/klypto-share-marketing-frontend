import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { generateStrategyAgent } from "../services/strategyAgentService";
import { getUser } from "../pages/auth/protected";
import { createAgentMessage } from "./strategyAgentUtils";

export default function useStrategyAgentChat({
  editorCode,
  selectedCurrency,
  strategyAgentSessionIdRef,
  timeframeValue,
}) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const clear = useCallback(() => {
    setMessages([]);
    setDraft("");
  }, []);

  const send = useCallback(
    async (promptText) => {
      const prompt = String(promptText || "").trim();
      if (!prompt || isLoading) return;

      const currentUser = getUser();
      const userId = currentUser?.id || currentUser?._id || "123";

      setMessages((prev) => [...prev, createAgentMessage("user", prompt)]);
      setDraft("");
      setIsLoading(true);

      try {
        const response = await generateStrategyAgent({
          prompt,
          session_id: strategyAgentSessionIdRef.current,
          user_id: userId,
          current_file_path: "strategy.py",
          current_editor_code: editorCode,
          open_files: [
            {
              path: "strategy.py",
              content: editorCode || "",
            },
          ],
          project_summary:
            "ChartLab strategy workspace for chart-driven code generation and iteration.",
          timeframe: timeframeValue,
          market: selectedCurrency?.symbol || selectedCurrency?.name,
          constraints: [
            "Be concise and actionable.",
            "When returning code, keep it runnable in ChartLab Python.",
            "Mention strategy assumptions when they materially affect the result.",
          ],
        });

        if (response?.session_id) {
          strategyAgentSessionIdRef.current = response.session_id;
        }

        const replyText =
          response?.reply ||
          response?.message ||
          "The strategy agent did not return a response.";
        const generatedCode =
          typeof response?.code === "string" && response.code.trim()
            ? response.code.trim()
            : "";

        setMessages((prev) => [
          ...prev,
          createAgentMessage("assistant", replyText, {
            code: generatedCode || undefined,
            replaceEditorCode: response?.replace_editor_code === true,
          }),
        ]);
      } catch (error) {
        console.error("Strategy agent chat failed:", error);
        const errorMessage =
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          error?.message ||
          "Unable to reach the strategy agent right now.";

        setMessages((prev) => [
          ...prev,
          createAgentMessage("assistant", errorMessage),
        ]);
        toast.error("Strategy agent request failed.");
      } finally {
        setIsLoading(false);
      }
    },
    [
      editorCode,
      isLoading,
      selectedCurrency,
      strategyAgentSessionIdRef,
      timeframeValue,
    ],
  );

  return {
    messages,
    draft,
    setDraft,
    isLoading,
    clear,
    send,
  };
}
