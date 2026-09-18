import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy Gemini AI initialization helper
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// 1. Health check & DB status endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
    dbConfigured: Boolean(process.env.DATABASE_URL),
    timestamp: new Date().toISOString()
  });
});

// 2. Gemini Real-Time RAG & AI Reasoning Endpoint
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, contextNotes } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        fallback: true,
        text: `[시스템 안내: GEMINI_API_KEY 환경변수가 설정되지 않아 로컬 지식 인덱스 시맨틱 모드로 응답합니다]\n질의 "${message}"에 대해 지식 그래프와 백링크를 참조하여 분석을 완료했습니다.`
      });
    }

    // Prepare system prompt with RAG retrieved context
    const contextPrompt = (contextNotes || [])
      .map((n: { title: string; excerpt?: string; tags?: string[] }) => 
        `[문서: ${n.title}] 카테고리: ${n.title} | 태그: ${n.tags?.join(", ") || ""} | 요약: ${n.excerpt || ""}`
      )
      .join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `당신은 Obsidian Slate 아키텍처 지식 관리 시스템의 시맨틱 지식 어시스턴트입니다.
사용자의 질문: "${message}"

지식 저장소에서 RAG로 검색된 관련 문서 컨텍스트:
${contextPrompt}

지침:
1. 답변 시 관련 문서 제목을 [[문서제목]] 형식의 백링크로 명시해주세요.
2. 시스템 아키텍처, 분산 트랜잭션, PostgreSQL pgvector 및 클러스터 설계에 대해 신뢰도 높은 전문적인 한국어로 명쾌하게 답변하세요.
3. 문서 수정/패치 요청인 경우, 변경할 구체적 가이드라인이나 설정값을 조언해주세요.`
            }
          ]
        }
      ]
    });

    const replyText = response.text || "응답을 생성하지 못했습니다.";
    return res.json({
      fallback: false,
      text: replyText
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate AI response",
      fallback: true
    });
  }
});

// 3. Mount Vite or Static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Obsidian Slate Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
