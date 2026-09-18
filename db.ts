import pg from "pg";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { NoteItem, ClassificationRule, TriageCardData, AgentPrompt, AgentType } from "./src/types";
import { INITIAL_NOTES, INITIAL_RULES } from "./src/data/mockData";

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://obsidian:slate_secure_pass@localhost:5432/knowledge_vault",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Helper: Extract [[wikilinks]] from text
export function extractWikiLinks(text: string): string[] {
  if (!text) return [];
  const regex = /\[\[(.*?)\]\]/g;
  const links = new Set<string>();
  let match;
  while ((match = regex.exec(text)) !== null) {
    const title = match[1].trim();
    if (title) links.add(title);
  }
  return Array.from(links);
}

// Generate 768-dim embedding using OpenAI-compatible API (prioritized) with Gemini fallback
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const openAIKey = process.env.OPENAI_API_KEY;
  const openAIBaseUrl = process.env.OPENAI_BASE_URL;
  const geminiKey = process.env.GEMINI_API_KEY;

  const isOpenAI = Boolean(
    (openAIKey && openAIKey !== "your-openai-or-custom-api-key") ||
    (openAIBaseUrl && !openAIBaseUrl.includes("api.openai.com")) ||
    (openAIKey && openAIBaseUrl)
  );

  // 1. Prioritize OpenAI-compatible embeddings endpoint
  if (isOpenAI) {
    try {
      const openai = new OpenAI({
        apiKey: openAIKey || "sk-no-key-required",
        baseURL: openAIBaseUrl || undefined,
      });
      const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
      const params: any = {
        model: embeddingModel,
        input: text.slice(0, 2048),
      };
      if (embeddingModel.includes("text-embedding-3")) {
        params.dimensions = 768;
      }

      const res = await openai.embeddings.create(params);
      const rawEmbedding = res.data?.[0]?.embedding;
      if (Array.isArray(rawEmbedding)) {
        const floatValues: number[] = rawEmbedding as number[];
        if (floatValues.length === 768) {
          return floatValues;
        } else if (floatValues.length > 768) {
          return floatValues.slice(0, 768);
        } else {
          return [...floatValues, ...new Array(768 - floatValues.length).fill(0)];
        }
      }
    } catch (err: any) {
      console.warn(`[OpenAI Embedding Warning] Failed to generate embedding (${err.message}). Checking Gemini fallback...`);
    }
  }

  // 2. Gemini fallback
  if (geminiKey && geminiKey !== "MY_GEMINI_API_KEY") {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text.slice(0, 2048),
        config: {
          outputDimensionality: 768
        }
      } as any);

      const values = response?.embeddings?.[0]?.values || (response as any)?.embedding?.values;
      if (values && Array.isArray(values)) {
        return values;
      }
    } catch (err: any) {
      console.warn(`[Gemini Embedding Warning] Failed to generate embedding: ${err.message}`);
    }
  }

  return null;
}

// Initialize tables if needed
export async function initDatabaseSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "vector";

      CREATE TABLE IF NOT EXISTS knowledge_documents (
          id VARCHAR(64) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          category VARCHAR(64) NOT NULL,
          category_full VARCHAR(128),
          tags TEXT[] DEFAULT '{}',
          content TEXT NOT NULL,
          excerpt TEXT,
          word_count INT DEFAULT 0,
          status_badge VARCHAR(64) DEFAULT '정제완료',
          badge_type VARCHAR(64) DEFAULT 'standard',
          backlinks_count INT DEFAULT 0,
          author VARCHAR(128),
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS knowledge_embeddings (
          chunk_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          doc_id VARCHAR(64) REFERENCES knowledge_documents(id) ON DELETE CASCADE,
          chunk_index INT NOT NULL,
          chunk_text TEXT NOT NULL,
          embedding vector(768),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS document_backlinks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          source_doc_id VARCHAR(64) REFERENCES knowledge_documents(id) ON DELETE CASCADE,
          target_doc_id VARCHAR(64),
          target_doc_title VARCHAR(255) NOT NULL,
          link_context TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_hnsw 
      ON knowledge_embeddings 
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);

      CREATE INDEX IF NOT EXISTS idx_doc_content_tsv
      ON knowledge_documents
      USING gin (to_tsvector('simple', title || ' ' || content));

      CREATE TABLE IF NOT EXISTS classification_rules (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          name_en VARCHAR(255),
          level VARCHAR(32) DEFAULT 'Standard',
          color VARCHAR(32) DEFAULT '#d2bbff',
          icon VARCHAR(64) DEFAULT 'code',
          enabled BOOLEAN DEFAULT true,
          tags TEXT[] DEFAULT '{}',
          detection_logic TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS triage_cards (
          id VARCHAR(64) PRIMARY KEY,
          category VARCHAR(64) NOT NULL,
          category_title VARCHAR(128),
          confidence VARCHAR(64),
          timestamp VARCHAR(64),
          raw_type VARCHAR(64),
          raw_subtitle VARCHAR(128),
          raw_content TEXT NOT NULL,
          ai_title VARCHAR(255) NOT NULL,
          ai_badge VARCHAR(64),
          ai_summary_points TEXT[] DEFAULT '{}',
          tags TEXT[] DEFAULT '{}',
          backlinks TEXT[] DEFAULT '{}',
          target_path VARCHAR(255),
          code_snippet JSONB,
          endpoint_spec JSONB,
          sql_recommendation JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS agent_prompts (
          id VARCHAR(64) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          agent_type VARCHAR(64) NOT NULL,
          role_description TEXT NOT NULL,
          system_prompt TEXT NOT NULL,
          user_prompt_template TEXT NOT NULL,
          variables TEXT[] DEFAULT '{}',
          model VARCHAR(64) DEFAULT 'gpt-4o-mini',
          temperature NUMERIC(3, 2) DEFAULT 0.2,
          is_active BOOLEAN DEFAULT false,
          version VARCHAR(32) DEFAULT '1.0.0',
          tags TEXT[] DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_agent_prompts_type_active ON agent_prompts (agent_type, is_active);
    `);

    // Ensure default AI agent prompts are seeded during database init
    const promptCountRes = await client.query(`SELECT COUNT(*)::int as count FROM agent_prompts`);
    if (promptCountRes.rows[0].count === 0) {
      console.log(`[DB Init] Seeding ${INITIAL_AGENT_PROMPTS.length} default agent prompts during database init...`);
      for (const p of INITIAL_AGENT_PROMPTS) {
        await client.query(`
          INSERT INTO agent_prompts (
            id, title, agent_type, role_description, system_prompt,
            user_prompt_template, variables, model, temperature, is_active, version, tags
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO NOTHING
        `, [
          p.id, p.title, p.agentType, p.roleDescription, p.systemPrompt,
          p.userPromptTemplate, p.variables, p.model, p.temperature, p.isActive, p.version, p.tags
        ]);
      }
      console.log(`[DB Init] Default agent prompts seeded successfully.`);
    }

    console.log("[DB] Database schema verified successfully.");
  } finally {
    client.release();
  }
}

// Map PostgreSQL row to NoteItem
export function rowToNoteItem(row: any, backlinks: string[] = []): NoteItem {
  const meta = row.metadata || {};
  const connectedNodes: string[] = Array.from(
    new Set([
      ...(meta.connectedNodes || []),
      ...backlinks.map((b) => (b.startsWith("[[") ? b : `[[${b}]]`)),
    ])
  );

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    categoryFull: row.category_full || row.category,
    tags: row.tags || [],
    content: row.content || "",
    excerpt: row.excerpt || (row.content ? row.content.slice(0, 150) : ""),
    wordCount: row.word_count || 0,
    charCount: meta.charCount || (row.content ? row.content.length : 0),
    readTime: meta.readTime || `${Math.max(1, Math.round((row.word_count || 100) / 300))}분 읽기`,
    statusBadge: row.status_badge || "정제완료",
    badgeType: row.badge_type || "ai-refined",
    backlinksCount: Math.max(row.backlinks_count || 0, connectedNodes.length),
    author: row.author || "Platform Architect",
    connectedNodes,
    codeSnippet: meta.codeSnippet,
    isPinned: Boolean(meta.isPinned),
    updatedAt: new Date(row.updated_at).toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }),
    updatedAtRaw: new Date(row.updated_at).getTime()
  };
}

// Fetch all notes with their backlinks from PostgreSQL
export async function getAllNotes(): Promise<NoteItem[]> {
  const client = await pool.connect();
  try {
    const docsRes = await client.query(`
      SELECT * FROM knowledge_documents 
      ORDER BY (metadata->>'isPinned')::boolean DESC NULLS LAST, updated_at DESC
    `);

    const linksRes = await client.query(`
      SELECT source_doc_id, target_doc_title FROM document_backlinks
    `);

    // Group links by source_doc_id
    const linksBySource = new Map<string, string[]>();
    for (const link of linksRes.rows) {
      const arr = linksBySource.get(link.source_doc_id) || [];
      arr.push(link.target_doc_title);
      linksBySource.set(link.source_doc_id, arr);
    }

    return docsRes.rows.map((row) =>
      rowToNoteItem(row, linksBySource.get(row.id) || [])
    );
  } finally {
    client.release();
  }
}

// Save or Update a note
export async function saveNote(note: Partial<NoteItem>): Promise<NoteItem> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const id = note.id || `note-${Date.now()}`;
    const title = note.title || "제목 없는 문서";
    const category = note.category || "소스코드";
    const categoryFull = note.categoryFull || category;
    const tags = note.tags || [];
    const content = note.content || note.excerpt || "";
    const excerpt = note.excerpt || content.slice(0, 160);
    const wordCount =
      note.wordCount ||
      content.trim().split(/\s+/).filter(Boolean).length ||
      0;
    const statusBadge = note.statusBadge || "AI 정제 완료";
    const badgeType = note.badgeType || "ai-refined";
    const author = note.author || "Platform Architect";

    // Extract backlinks
    const explicitLinks = extractWikiLinks(content);
    const existingConnected = (note.connectedNodes || []).map((t) =>
      t.replace(/\[\[|\]\]/g, "").trim()
    );
    const allBacklinkTitles = Array.from(new Set([...explicitLinks, ...existingConnected]));

    const metadata = {
      codeSnippet: note.codeSnippet,
      charCount: note.charCount || content.length,
      readTime: note.readTime,
      isPinned: Boolean(note.isPinned),
      connectedNodes: allBacklinkTitles.map((t) => `[[${t}]]`)
    };

    // Upsert knowledge_documents
    const upsertQuery = `
      INSERT INTO knowledge_documents (
        id, title, category, category_full, tags, content, excerpt,
        word_count, status_badge, badge_type, backlinks_count, author, metadata, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        category_full = EXCLUDED.category_full,
        tags = EXCLUDED.tags,
        content = EXCLUDED.content,
        excerpt = EXCLUDED.excerpt,
        word_count = EXCLUDED.word_count,
        status_badge = EXCLUDED.status_badge,
        badge_type = EXCLUDED.badge_type,
        backlinks_count = EXCLUDED.backlinks_count,
        author = EXCLUDED.author,
        metadata = EXCLUDED.metadata,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const res = await client.query(upsertQuery, [
      id,
      title,
      category,
      categoryFull,
      tags,
      content,
      excerpt,
      wordCount,
      statusBadge,
      badgeType,
      allBacklinkTitles.length,
      author,
      JSON.stringify(metadata)
    ]);

    // Update backlinks in document_backlinks table
    await client.query(`DELETE FROM document_backlinks WHERE source_doc_id = $1`, [id]);
    for (const linkTitle of allBacklinkTitles) {
      await client.query(
        `INSERT INTO document_backlinks (source_doc_id, target_doc_title, link_context)
         VALUES ($1, $2, $3)`,
        [id, linkTitle, `Mentioned in ${title}`]
      );
    }

    await client.query("COMMIT");

    // Asynchronously generate and store vector embedding for pgvector
    (async () => {
      try {
        const textToEmbed = `${title}\n${excerpt}\n${content}`;
        const vector = await generateEmbedding(textToEmbed);
        if (vector && vector.length === 768) {
          const embClient = await pool.connect();
          try {
            await embClient.query(
              `DELETE FROM knowledge_embeddings WHERE doc_id = $1`,
              [id]
            );
            const vectorString = `[${vector.join(",")}]`;
            await embClient.query(
              `INSERT INTO knowledge_embeddings (doc_id, chunk_index, chunk_text, embedding)
               VALUES ($1, $2, $3, $4::vector)`,
              [id, 0, textToEmbed.slice(0, 1000), vectorString]
            );
            console.log(`[pgvector] Successfully indexed vector embedding for doc: "${title}"`);
          } finally {
            embClient.release();
          }
        }
      } catch (err: any) {
        console.warn(`[pgvector] Embedding indexing error for ${id}:`, err.message);
      }
    })();

    return rowToNoteItem(res.rows[0], allBacklinkTitles);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Delete a note
export async function deleteNote(id: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const res = await client.query(`DELETE FROM knowledge_documents WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  } finally {
    client.release();
  }
}

// Seed initial mock data if database is empty
export async function seedInitialDataIfNeeded(): Promise<number> {
  const client = await pool.connect();
  try {
    const countRes = await client.query(`SELECT COUNT(*)::int as count FROM knowledge_documents`);
    const count = countRes.rows[0].count;

    if (count > 0) {
      console.log(`[DB] Database already contains ${count} documents. Skipping seed.`);
      return count;
    }

    console.log(`[DB] Empty database detected. Seeding ${INITIAL_NOTES.length} initial documents...`);
    for (const note of INITIAL_NOTES) {
      await saveNote(note);
    }

    console.log(`[DB] Seeding completed successfully!`);
    return INITIAL_NOTES.length;
  } finally {
    client.release();
  }
}

// Get DB statistics
export async function getDatabaseStats() {
  const client = await pool.connect();
  try {
    const docCount = await client.query(`SELECT COUNT(*)::int as count FROM knowledge_documents`);
    const embCount = await client.query(`SELECT COUNT(*)::int as count FROM knowledge_embeddings`);
    const linkCount = await client.query(`SELECT COUNT(*)::int as count FROM document_backlinks`);

    return {
      documentsCount: docCount.rows[0].count,
      embeddingsCount: embCount.rows[0].count,
      backlinksCount: linkCount.rows[0].count
    };
  } finally {
    client.release();
  }
}

// -------------------------------------------------------------
// Classification Rules Persistence
// -------------------------------------------------------------
export async function getAllRules(): Promise<ClassificationRule[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT * FROM classification_rules ORDER BY created_at ASC`);
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      nameEn: r.name_en || r.name,
      level: r.level || 'Standard',
      color: r.color || '#d2bbff',
      icon: r.icon || 'code',
      enabled: r.enabled !== false,
      tags: r.tags || [],
      detectionLogic: r.detection_logic || ''
    }));
  } finally {
    client.release();
  }
}

export async function saveRule(rule: Partial<ClassificationRule>): Promise<ClassificationRule> {
  const client = await pool.connect();
  try {
    const id = rule.id || `rule-${Date.now()}`;
    const name = rule.name || '신규 분류 규칙';
    const nameEn = rule.nameEn || name;
    const level = rule.level || 'Standard';
    const color = rule.color || '#d2bbff';
    const icon = rule.icon || 'code';
    const enabled = rule.enabled !== false;
    const tags = rule.tags || [];
    const detectionLogic = rule.detectionLogic || '';

    const query = `
      INSERT INTO classification_rules (id, name, name_en, level, color, icon, enabled, tags, detection_logic, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        name_en = EXCLUDED.name_en,
        level = EXCLUDED.level,
        color = EXCLUDED.color,
        icon = EXCLUDED.icon,
        enabled = EXCLUDED.enabled,
        tags = EXCLUDED.tags,
        detection_logic = EXCLUDED.detection_logic,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const res = await client.query(query, [id, name, nameEn, level, color, icon, enabled, tags, detectionLogic]);
    const r = res.rows[0];
    return {
      id: r.id,
      name: r.name,
      nameEn: r.name_en,
      level: r.level,
      color: r.color,
      icon: r.icon,
      enabled: r.enabled,
      tags: r.tags || [],
      detectionLogic: r.detection_logic
    };
  } finally {
    client.release();
  }
}

export async function toggleRule(id: string): Promise<ClassificationRule | null> {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `UPDATE classification_rules SET enabled = NOT enabled, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      name: r.name,
      nameEn: r.name_en,
      level: r.level,
      color: r.color,
      icon: r.icon,
      enabled: r.enabled,
      tags: r.tags || [],
      detectionLogic: r.detection_logic
    };
  } finally {
    client.release();
  }
}

export async function deleteRule(id: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const res = await client.query(`DELETE FROM classification_rules WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  } finally {
    client.release();
  }
}

export async function seedInitialRulesIfNeeded(): Promise<number> {
  const client = await pool.connect();
  try {
    const countRes = await client.query(`SELECT COUNT(*)::int as count FROM classification_rules`);
    const count = countRes.rows[0].count;
    if (count > 0) return count;

    console.log(`[DB] Seeding ${INITIAL_RULES.length} initial architecture classification rules...`);
    for (const rule of INITIAL_RULES) {
      await saveRule(rule);
    }
    console.log(`[DB] Rules seeding completed.`);
    return INITIAL_RULES.length;
  } finally {
    client.release();
  }
}

// -------------------------------------------------------------
// Triage Cards Persistence
// -------------------------------------------------------------
export async function getAllTriageCards(): Promise<TriageCardData[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT * FROM triage_cards ORDER BY created_at DESC`);
    return res.rows.map((r) => ({
      id: r.id,
      category: r.category,
      categoryTitle: r.category_title,
      confidence: r.confidence,
      timestamp: r.timestamp,
      rawType: r.raw_type,
      rawSubtitle: r.raw_subtitle,
      rawContent: r.raw_content,
      aiTitle: r.ai_title,
      aiBadge: r.ai_badge,
      aiSummaryPoints: r.ai_summary_points || [],
      tags: r.tags || [],
      backlinks: r.backlinks || [],
      targetPath: r.target_path,
      codeSnippet: r.code_snippet,
      endpointSpec: r.endpoint_spec,
      sqlRecommendation: r.sql_recommendation
    }));
  } finally {
    client.release();
  }
}

export async function saveTriageCard(card: Partial<TriageCardData>): Promise<TriageCardData> {
  const client = await pool.connect();
  try {
    const id = card.id || `triage-${Date.now()}`;
    const category = card.category || 'code';
    const categoryTitle = card.categoryTitle || '소스코드 및 구현 정보';
    const rawContent = card.rawContent || '';
    const confidence =
      card.confidence ||
      `${(88 + (rawContent.length % 10) + ((rawContent.charCodeAt(0) || 7) % 5) * 0.4).toFixed(1)}% 일치`;
    const timestamp = card.timestamp || '방금 전';
    const rawType = card.rawType || '클립보드 메모';
    const rawSubtitle = card.rawSubtitle || 'Quick Memo';
    const aiTitle = card.aiTitle || '신규 정제 규격';
    const aiBadge = card.aiBadge || 'Gemini 실시간 추출';
    const aiSummaryPoints = card.aiSummaryPoints || [];
    const tags = card.tags || [];
    const backlinks = card.backlinks || [];
    const targetPath = card.targetPath || '';
    const codeSnippet = card.codeSnippet ? JSON.stringify(card.codeSnippet) : null;
    const endpointSpec = card.endpointSpec ? JSON.stringify(card.endpointSpec) : null;
    const sqlRecommendation = card.sqlRecommendation ? JSON.stringify(card.sqlRecommendation) : null;

    const query = `
      INSERT INTO triage_cards (
        id, category, category_title, confidence, timestamp, raw_type, raw_subtitle,
        raw_content, ai_title, ai_badge, ai_summary_points, tags, backlinks,
        target_path, code_snippet, endpoint_spec, sql_recommendation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO UPDATE SET
        category = EXCLUDED.category,
        category_title = EXCLUDED.category_title,
        confidence = EXCLUDED.confidence,
        raw_content = EXCLUDED.raw_content,
        ai_title = EXCLUDED.ai_title,
        ai_summary_points = EXCLUDED.ai_summary_points,
        tags = EXCLUDED.tags,
        backlinks = EXCLUDED.backlinks
      RETURNING *;
    `;

    const res = await client.query(query, [
      id, category, categoryTitle, confidence, timestamp, rawType, rawSubtitle,
      rawContent, aiTitle, aiBadge, aiSummaryPoints, tags, backlinks,
      targetPath, codeSnippet, endpointSpec, sqlRecommendation
    ]);

    const r = res.rows[0];
    return {
      id: r.id,
      category: r.category,
      categoryTitle: r.category_title,
      confidence: r.confidence,
      timestamp: r.timestamp,
      rawType: r.raw_type,
      rawSubtitle: r.raw_subtitle,
      rawContent: r.raw_content,
      aiTitle: r.ai_title,
      aiBadge: r.ai_badge,
      aiSummaryPoints: r.ai_summary_points || [],
      tags: r.tags || [],
      backlinks: r.backlinks || [],
      targetPath: r.target_path,
      codeSnippet: r.code_snippet,
      endpointSpec: r.endpoint_spec,
      sqlRecommendation: r.sql_recommendation
    };
  } finally {
    client.release();
  }
}

export async function deleteTriageCard(id: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const res = await client.query(`DELETE FROM triage_cards WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  } finally {
    client.release();
  }
}

export async function clearAllTriageCards(): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM triage_cards`);
    return true;
  } finally {
    client.release();
  }
}

// -------------------------------------------------------------
// AI Agent Prompts Orchestration Hub Persistence
// -------------------------------------------------------------

const DEFAULT_PROMPT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export const INITIAL_AGENT_PROMPTS: AgentPrompt[] = [
  {
    id: 'prompt-refinery-default',
    title: 'Refinery Document Ingestion Agent v2.3',
    agentType: 'refinery-ingestion',
    roleDescription: '비정형 텍스트·코드·클립보드 스크랩을 분석하여 정규 아키텍처 위키 문서 규격으로 정제',
    systemPrompt: `당신은 Obsidian Slate 분산 아키텍처의 엔터프라이즈 정제 엔진(Refinery Engine)입니다.
입력된 비정형 원시 텍스트나 소스코드를 정밀 분석하여 아키텍처 지식 문서 표준으로 정제하고 JSON 형식으로 응답하세요.

반드시 다음 JSON 규격으로만 응답해야 합니다 (마크다운 코드블록이나 불필요한 서두 없이 순수 JSON만 반환):
{
  "category": "DB" | "연계" | "인프라" | "소스코드" | "워크플로우",
  "categoryTitle": "DB 및 pgvector 영속 계층" 등 카테고리 상세명,
  "confidence": "94.8% 일치" 등 일치율,
  "rawType": "클립보드 메모" | "설정 파일" | "SQL 스키마" | "Java 코드" 등,
  "rawSubtitle": "영문 소제목",
  "aiTitle": "정제된 정식 아키텍처 문서 제목",
  "aiBadge": "정제 배지 문구",
  "aiSummaryPoints": [
    "핵심 요약 1",
    "핵심 요약 2",
    "핵심 요약 3"
  ],
  "tags": ["#Tag1", "#Tag2"],
  "backlinks": ["[[참조문서1]]", "[[참조문서2]]"],
  "targetPath": "/architecture/... 경로",
  "codeSnippet": { "language": "언어명", "code": "소스코드 내용" },
  "endpointSpec": { "method": "POST", "path": "/api/...", "desc": "설명" },
  "sqlRecommendation": { "type": "SELECT/INSERT", "query": "SQL문", "comment": "설명" }
}`,
    userPromptTemplate: `다음 원시 데이터를 분석하여 Obsidian Slate 규격 JSON으로 정제하세요:

원시 데이터:
{{sourceContent}}`,
    variables: ['sourceContent'],
    model: DEFAULT_PROMPT_MODEL,
    temperature: 0.1,
    isActive: true,
    version: '2.3.0',
    tags: ['#Refinery', '#Ingestion', '#Structure']
  },
  {
    id: 'prompt-rag-default',
    title: 'RAG Architecture Knowledge Synthesizer v3.2',
    agentType: 'rag-synthesizer',
    roleDescription: '저장소의 백링크 및 pgvector 임베딩 지식을 참조하여 사용자 질의에 전문적 아키텍처 답변 제공',
    systemPrompt: `당신은 Obsidian Slate 아키텍처 지식 관리 시스템의 시맨틱 지식 어시스턴트입니다.

지침:
1. 답변 시 관련 문서 제목을 [[문서제목]] 형식의 백링크로 명시해주세요.
2. 시스템 아키텍처, 분산 트랜잭션, PostgreSQL pgvector 및 클러스터 설계에 대해 신뢰도 높은 전문적인 한국어로 명쾌하게 답변하세요.
3. 문서 수정/패치 요청인 경우, 변경할 구체적 가이드라인이나 설정값을 조언해주세요.
4. 마크다운(테이블, 불릿, 코드블록 등)을 적절히 활용하여 시각적으로 가독성 높게 전달하세요.`,
    userPromptTemplate: `사용자의 질문: "{{userQuery}}"

지식 저장소에서 RAG로 검색된 관련 문서 컨텍스트:
{{contextNotes}}`,
    variables: ['userQuery', 'contextNotes'],
    model: DEFAULT_PROMPT_MODEL,
    temperature: 0.2,
    isActive: true,
    version: '3.2.0',
    tags: ['#RAG', '#Knowledge', '#Backlink']
  },
  {
    id: 'prompt-diff-default',
    title: 'Git-Style Architecture Diff Proposer v1.8',
    agentType: 'diff-proposer',
    roleDescription: '기존 아키텍처 문서와 사용자 수정 요청을 비교하여 정밀 라인 단위 Diff 및 변경 사유 도출',
    systemPrompt: `당신은 아키텍처 지식 저장소의 패치 및 Diff 생성기입니다.
원본 문서와 사용자의 수정 요구사항을 비교하여 정밀한 unified diff 라인 목록과 변경 사유를 JSON으로 반환하세요.

응답 형식 (순수 JSON):
{
  "summary": "간략한 변경 요약",
  "reason": "변경 필요성 및 배경",
  "addedCount": 3,
  "removedCount": 1,
  "ruleCheckNote": "보안/아키텍처 규칙 검증 메모",
  "lines": [
    { "type": "context", "content": "라인 내용" },
    { "type": "added", "content": "+ 추가된 라인" },
    { "type": "removed", "content": "- 삭제된 라인" }
  ],
  "updatedFullContent": "수정 완료된 전체 마크다운 문서 내용"
}`,
    userPromptTemplate: `문서 ID: {{docId}}
문서 제목: {{docTitle}}

원본 문서 내용:
{{docContent}}

사용자 수정 요청:
{{request}}`,
    variables: ['docId', 'docTitle', 'docContent', 'request'],
    model: DEFAULT_PROMPT_MODEL,
    temperature: 0.2,
    isActive: true,
    version: '1.8.0',
    tags: ['#Diff', '#Patch', '#VersionControl']
  },
  {
    id: 'prompt-security-default',
    title: 'Architecture Rule & Security Auditor v2.0',
    agentType: 'security-auditor',
    roleDescription: '금융 보안 규제, 망분리, PII 암호화, MSA 거버넌스 룰에 대한 위반 여부 자동 감사',
    systemPrompt: `당신은 금융 및 클라우드 아키텍처 보안 거버넌스 감사관입니다.
지정된 아키텍처 규정(규정명, 감지 로직, 태그)을 기반으로 대상 문서나 소스코드가 규정을 위반하는지 점검하고 준수 여부와 위험 요인을 JSON으로 반환하세요.

응답 형식 (순수 JSON):
{
  "compliant": true,
  "confidence": "96%",
  "violationLevel": "None",
  "summary": "점검 결과 요약",
  "matchedKeywords": ["감지된 키워드"],
  "remediation": "위반 해결을 위한 권장 조치"
}`,
    userPromptTemplate: `감사 대상 규정:
규정명: {{ruleName}}
심각도: {{ruleLevel}}
감지 로직: {{detectionLogic}}

점검 대상 문서:
{{targetContent}}`,
    variables: ['ruleName', 'ruleLevel', 'detectionLogic', 'targetContent'],
    model: DEFAULT_PROMPT_MODEL,
    temperature: 0.1,
    isActive: true,
    version: '2.0.1',
    tags: ['#Security', '#Governance', '#Compliance']
  },
  {
    id: 'prompt-backlink-default',
    title: 'Semantic Backlink & Wiki Topology Recommender v1.4',
    agentType: 'backlink-recommender',
    roleDescription: '새 문서 내용과 기존 문서 간의 시맨틱 유사도를 파악하여 적절한 [[위키링크]] 후보군 자동 추천',
    systemPrompt: `당신은 지식 그래프 토폴로지 엔지니어입니다.
주어진 문서 내용과 시스템 전체 문서 목록을 분석하여, 상호 참조(위키링크)해야 할 가장 가치 있는 연결 고리 3~5개를 선별하여 JSON으로 반환하세요.

응답 형식 (순수 JSON):
{
  "recommendations": [
    {
      "targetTitle": "문서명",
      "targetDocId": "ID",
      "relevanceScore": 0.95,
      "reason": "연결 추천 사유",
      "suggestedWikilink": "[[문서명]]"
    }
  ]
}`,
    userPromptTemplate: `현재 문서 제목: {{docTitle}}
현재 문서 내용:
{{docContent}}

전체 시스템 문서 목록:
{{existingDocs}}`,
    variables: ['docTitle', 'docContent', 'existingDocs'],
    model: DEFAULT_PROMPT_MODEL,
    temperature: 0.2,
    isActive: true,
    version: '1.4.0',
    tags: ['#Graph', '#Wikilink', '#Topology']
  },
  {
    id: 'prompt-mermaid-default',
    title: 'Mermaid Diagram & System Topology Architect v1.5',
    agentType: 'mermaid-architect',
    roleDescription: '아키텍처 텍스트 설명을 읽고 Mermaid Flowchart/Sequence/C4 다이어그램 코드로 변환',
    systemPrompt: `당신은 엔터프라이즈 시스템 다이어그램 설계 전문가입니다.
아키텍처 및 데이터 흐름 설명을 바탕으로 문법적으로 완벽한 Mermaid.js 마크다운 다이어그램 코드를 생성하세요.

응답 형식 (순수 JSON):
{
  "diagramType": "flowchart TD",
  "mermaidCode": "flowchart TD\\n    Client[Web Client] --> Gateway[API Gateway]\\n    Gateway --> Service[Payment Service]\\n    Service --> DB[(PostgreSQL)]",
  "explanation": "다이어그램 구조 설명",
  "entities": ["Web Client", "API Gateway", "Payment Service", "PostgreSQL"]
}`,
    userPromptTemplate: `시스템 설명:
{{systemDescription}}

요청 다이어그램 형식:
{{diagramType}}`,
    variables: ['systemDescription', 'diagramType'],
    model: DEFAULT_PROMPT_MODEL,
    temperature: 0.2,
    isActive: true,
    version: '1.5.0',
    tags: ['#Mermaid', '#Diagram', '#Architecture']
  }
];

function rowToAgentPrompt(r: any): AgentPrompt {
  return {
    id: r.id,
    title: r.title,
    agentType: r.agent_type as AgentType,
    roleDescription: r.role_description,
    systemPrompt: r.system_prompt,
    userPromptTemplate: r.user_prompt_template,
    variables: r.variables || [],
    model: r.model || DEFAULT_PROMPT_MODEL,
    temperature: typeof r.temperature === 'number' ? r.temperature : parseFloat(r.temperature) || 0.2,
    isActive: Boolean(r.is_active),
    version: r.version || '1.0.0',
    tags: r.tags || [],
    updatedAt: r.updated_at ? new Date(r.updated_at).toLocaleString('ko-KR') : undefined,
    createdAt: r.created_at ? new Date(r.created_at).toLocaleString('ko-KR') : undefined
  };
}

export async function getAllAgentPrompts(): Promise<AgentPrompt[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT * FROM agent_prompts ORDER BY agent_type ASC, is_active DESC, updated_at DESC`);
    return res.rows.map(rowToAgentPrompt);
  } finally {
    client.release();
  }
}

export async function getActiveAgentPrompt(agentType: AgentType): Promise<AgentPrompt | null> {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT * FROM agent_prompts WHERE agent_type = $1 AND is_active = true LIMIT 1`,
      [agentType]
    );
    if (res.rows.length === 0) return null;
    return rowToAgentPrompt(res.rows[0]);
  } finally {
    client.release();
  }
}

export async function saveAgentPrompt(prompt: Partial<AgentPrompt> & { id?: string }): Promise<AgentPrompt> {
  const client = await pool.connect();
  try {
    const id = prompt.id || `prompt-${Date.now()}`;
    const title = prompt.title || '새 에이전트 프롬프트';
    const agentType = prompt.agentType || 'refinery-ingestion';
    const roleDescription = prompt.roleDescription || '';
    const systemPrompt = prompt.systemPrompt || '';
    const userPromptTemplate = prompt.userPromptTemplate || '';
    const variables = prompt.variables || [];
    const model = prompt.model || DEFAULT_PROMPT_MODEL;
    const temperature = typeof prompt.temperature === 'number' ? prompt.temperature : 0.2;
    const isActive = Boolean(prompt.isActive);
    const version = prompt.version || '1.0.0';
    const tags = prompt.tags || [];

    if (isActive) {
      // Deactivate others for same agentType
      await client.query(`UPDATE agent_prompts SET is_active = false WHERE agent_type = $1 AND id != $2`, [agentType, id]);
    }

    const query = `
      INSERT INTO agent_prompts (
        id, title, agent_type, role_description, system_prompt,
        user_prompt_template, variables, model, temperature, is_active, version, tags, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        agent_type = EXCLUDED.agent_type,
        role_description = EXCLUDED.role_description,
        system_prompt = EXCLUDED.system_prompt,
        user_prompt_template = EXCLUDED.user_prompt_template,
        variables = EXCLUDED.variables,
        model = EXCLUDED.model,
        temperature = EXCLUDED.temperature,
        is_active = EXCLUDED.is_active,
        version = EXCLUDED.version,
        tags = EXCLUDED.tags,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const res = await client.query(query, [
      id, title, agentType, roleDescription, systemPrompt,
      userPromptTemplate, variables, model, temperature, isActive, version, tags
    ]);
    return rowToAgentPrompt(res.rows[0]);
  } finally {
    client.release();
  }
}

export async function activateAgentPrompt(id: string, agentType: AgentType): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`UPDATE agent_prompts SET is_active = false WHERE agent_type = $1`, [agentType]);
    await client.query(`UPDATE agent_prompts SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
  } finally {
    client.release();
  }
}

export async function deleteAgentPrompt(id: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const res = await client.query(`DELETE FROM agent_prompts WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  } finally {
    client.release();
  }
}

export async function seedInitialPromptsIfNeeded(): Promise<number> {
  const client = await pool.connect();
  try {
    const countRes = await client.query(`SELECT COUNT(*)::int as count FROM agent_prompts`);
    const count = countRes.rows[0].count;
    if (count > 0) return count;

    console.log(`[DB] Seeding ${INITIAL_AGENT_PROMPTS.length} default AI agent prompts...`);
    for (const prompt of INITIAL_AGENT_PROMPTS) {
      await saveAgentPrompt(prompt);
    }
    console.log(`[DB] Agent prompts seeding completed successfully.`);
    return INITIAL_AGENT_PROMPTS.length;
  } finally {
    client.release();
  }
}
