<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <title><xsl:value-of select="rss/channel/title"/></title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@500;700&amp;family=Noto+Sans+JP:wght@400;500&amp;display=swap" />
        <style>
          :root { color-scheme: light dark; }
          body { font-family: "Noto Sans JP", system-ui, sans-serif; max-width: 720px; margin: 0 auto; padding: 2rem 1.2rem; background: #f3efe5; color: #2a2018; }
          @media (prefers-color-scheme: dark) {
            body { background: #1a1814; color: #ece5d8; }
            article { background: #25221c; border-color: #3d362c; }
            a { color: #e07d65; }
          }
          h1 { font-family: "Noto Serif JP", serif; font-size: 1.8rem; margin: 0 0 0.4rem; }
          .lede { color: #6b5d4f; margin: 0 0 1.5rem; font-size: 0.92rem; line-height: 1.7; }
          .badge { display: inline-block; background: #1d2a3d; color: #f3efe5; padding: 2px 10px; border-radius: 999px; font-size: 0.75rem; margin-right: 0.4rem; }
          article { background: #fbf8f0; border: 1px solid #d8cdb8; border-radius: 10px; padding: 1.1rem 1.3rem; margin: 0 0 0.9rem; }
          article h2 { font-family: "Noto Serif JP", serif; font-size: 1.1rem; margin: 0 0 0.3rem; }
          article h2 a { color: inherit; text-decoration: none; }
          article h2 a:hover { text-decoration: underline; }
          article p { margin: 0.2rem 0; font-size: 0.92rem; line-height: 1.7; }
          .meta { font-size: 0.78rem; color: #94887a; font-family: "SF Mono", monospace; letter-spacing: 0.05em; }
          footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #d8cdb8; font-size: 0.85rem; color: #6b5d4f; }
        </style>
      </head>
      <body>
        <h1><xsl:value-of select="rss/channel/title"/></h1>
        <p class="lede"><xsl:value-of select="rss/channel/description"/></p>
        <p>
          <span class="badge">RSS</span>
          このページは RSS フィードのプレビューです。RSS リーダー（Inoreader, Feedly, Reeder など）に <code><xsl:value-of select="rss/channel/atom:link/@href"/></code> を登録すると、新教材の更新を自動で受け取れます。
        </p>
        <xsl:for-each select="rss/channel/item">
          <article>
            <h2>
              <a href="{link}"><xsl:value-of select="title"/></a>
            </h2>
            <p class="meta">
              <xsl:value-of select="author"/>
              <xsl:text> ／ </xsl:text>
              <xsl:value-of select="pubDate"/>
            </p>
            <p><xsl:value-of select="description"/></p>
          </article>
        </xsl:for-each>
        <footer>
          ©︎ project_procopios contributors — 編集物 CC BY 4.0 ／ 原文パブリックドメイン
        </footer>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
