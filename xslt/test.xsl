<xsl:transform xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    version="1.0">

    <xsl:import href="modul1.xsl"/>

    <xsl:template match="/">
        <html>
            <head></head>
            <body>
        Hallo
                <xsl:apply-templates/>
            </body>
        </html>
    </xsl:template>

    <xsl:output media-type="text/html"
        method="html"
        version="5" />
</xsl:transform>