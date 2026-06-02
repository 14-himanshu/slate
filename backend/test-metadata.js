const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta property="og:title" content="GitHub: Let’s build from here" />
  <meta property="og:image" content="https://github.githubassets.com/images/modules/site/social-cards/github-social.png" />
  <meta property="og:description" content="GitHub is where over 100 million developers shape the future of software, together." />
</head>
<body></body>
</html>`;

    const getMetaTag = (property) => {
      const regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i');
      const match = html.match(regex);
      if (match) return match[1];

      // Fallback: name attribute instead of property
      const regexName = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i');
      const matchName = html.match(regexName);
      if (matchName) return matchName[1];

      return null;
    };

    console.log("Title:", getMetaTag("og:title"));
    console.log("Image:", getMetaTag("og:image"));
    console.log("Desc:", getMetaTag("og:description"));
