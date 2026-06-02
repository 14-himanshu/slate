import type { Request, Response } from "express";

export async function getLinkPreview(req: Request, res: Response): Promise<void> {
  const urlString = req.query["url"] as string;
  if (!urlString) {
    res.status(400).json({ error: "URL is required" });
    return;
  }

  try {
    const url = new URL(urlString);
    
    // Set a timeout using AbortController
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "SlateBot/1.0 (+https://slate.dev)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      res.status(response.status).json({ error: "Failed to fetch URL" });
      return;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("text/html")) {
      res.json({ title: null, description: null, image: null, url: url.toString() });
      return;
    }

    const html = await response.text();

    // Simple Regex Parsing for OpenGraph tags
    const getMetaTag = (property: string) => {
      const regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i');
      const match = html.match(regex);
      if (match) return match[1];

      // Fallback: name attribute instead of property
      const regexName = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i');
      const matchName = html.match(regexName);
      if (matchName) return matchName[1];

      return null;
    };

    const getTitleTag = () => {
      const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return match && match[1] ? match[1].trim() : null;
    };

    let title = getMetaTag("og:title") || getTitleTag();
    let description = getMetaTag("og:description") || getMetaTag("description");
    let image = getMetaTag("og:image");

    // Decode HTML entities (basic)
    const decode = (str: string | null | undefined) => {
      if (!str) return null;
      return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    };

    // Ensure absolute image URL
    if (image && !image.startsWith("http")) {
      if (image.startsWith("//")) {
        image = url.protocol + image;
      } else {
        const urlObj = new URL(url);
        if (image.startsWith("/")) {
          image = urlObj.origin + image;
        } else {
          image = urlObj.origin + urlObj.pathname.replace(/\/[^\/]*$/, '/') + image;
        }
      }
    }

    res.json({
      title: decode(title),
      description: decode(description),
      image,
      url: url.toString()
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to parse URL metadata";
    res.status(500).json({ error: msg });
  }
}
