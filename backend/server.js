import { Router, type IRouter, type Request, type Response } from "express";
import axios from "axios";
import { z } from "zod";

const router: IRouter = Router();

const AddMentoringBody = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  type: z.string().min(1),
});

router.post("/mentoring/add", async (req: Request, res: Response) => {
  const parsed = AddMentoringBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  const { title, date, type } = parsed.data;

  const notionSecret = process.env["NOTION_SECRET"];
  const notionDatabaseId = process.env["NOTION_DATABASE_ID"];

  if (!notionSecret || !notionDatabaseId) {
    res.status(500).json({ error: "Server is not properly configured" });
    return;
  }

  const match = date.match(/(\d{4})\.(\d{2})\.(\d{2}).*?(\d{2}):(\d{2}).*?(\d{2}):(\d{2})/);
  if (!match) {
    res.status(400).json({ error: "Invalid date format. Expected format: '2026.06.21 20:00시 ~ 22:00시'" });
    return;
  }
  const [, yyyy, mm, dd, startH, startM, endH, endM] = match;
  const startISO = `${yyyy}-${mm}-${dd}T${startH}:${startM}:00`;
  const endISO = `${yyyy}-${mm}-${dd}T${endH}:${endM}:00`;

  try {
    const response = await axios.post(
      "https://api.notion.com/v1/pages",
      {
        parent: { database_id: notionDatabaseId },
        properties: {
          "멘토링 이름": {
            title: [{ text: { content: title } }],
          },
          "일시": {
            date: { start: startISO, end: endISO, time_zone: "Asia/Seoul" },
          },
          "진행 방식": {
            rich_text: [{ text: { content: type } }],
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${notionSecret}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      },
    );

    res.status(201).json({ id: response.data.id, url: response.data.url });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      res.status(err.response?.status ?? 502).json({
        error: "Notion API error",
        details: err.response?.data,
      });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

const DeleteMentoringBody = z.object({
  title: z.string().min(1),
});

router.post("/mentoring/delete", async (req: Request, res: Response) => {
  const parsed = DeleteMentoringBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  const { title } = parsed.data;

  const notionSecret = process.env["NOTION_SECRET"];
  const notionDatabaseId = process.env["NOTION_DATABASE_ID"];

  if (!notionSecret || !notionDatabaseId) {
    res.status(500).json({ error: "Server is not properly configured" });
    return;
  }

  const notionHeaders = {
    Authorization: `Bearer ${notionSecret}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };

  try {
    const queryResponse = await axios.post(
      `https://api.notion.com/v1/databases/${notionDatabaseId}/query`,
      {
        filter: {
          property: "멘토링 이름",
          title: { equals: title },
        },
      },
      { headers: notionHeaders },
    );

    const pages: { id: string }[] = queryResponse.data.results;