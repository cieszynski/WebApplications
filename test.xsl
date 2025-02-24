<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output encoding="utf-8" version="5" method="html" />

    <xsl:template match="/">
        <html>

        <head>
            <title>Stylesheet importieren - XSLT Code-Beispiel</title>

            <meta charset="utf-8" />
            <link rel="manifest" href="emr/manifest.json" />
        </head>

        <body>
            Hallo Welt! <xsl:apply-templates />
            <xsl:choose>
                <xsl:when test="element-available('xsl:message')">
                    <p>xsl:message is supported.</p>
                </xsl:when>
            </xsl:choose>
            <script>
                if ("serviceWorker" in navigator) {
                    navigator.serviceWorker.register("service-worker.js");
                }
            </script>
        </body>

        </html>
    </xsl:template>
</xsl:stylesheet>