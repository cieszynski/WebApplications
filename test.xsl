<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:common="http://exslt.org/common"
    xmlns:func="http://exslt.org/functions" xmlns:math="http://exslt.org/math"
    xmlns:random="http://exslt.org/random" xmlns:regexp="http://exslt.org/regular-expressions"
    xmlns:str="http://exslt.org/strings"
    xmlns:sets="http://exslt.org/sets"
    xmlns:fn="http://www.w3.org/2005/xpath-functions">
    <xsl:output encoding="utf-8" version="5" method="html" />

    <xsl:template match="/">
        <html>

        <head>
            <title>Stylesheet importieren - XSLT Code-Beispiel</title>

            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />

            <link rel="manifest" href="emr/manifest.json" />
        </head>

        <body>
            <h3>str</h3>
            <div>str:align <xsl:value-of select="function-available('str:align')"></xsl:value-of></div>
            <div>str:concat <xsl:value-of select="function-available('str:concat')"></xsl:value-of></div>
            <div>str:decode-uri <xsl:value-of select="function-available('str:decode-uri')"></xsl:value-of></div>
            <div>str:encode-uri <xsl:value-of select="function-available('str:encode-uri')"></xsl:value-of></div>
            <div>str:padding <xsl:value-of select="function-available('str:padding')"></xsl:value-of></div>
            <div>str:replace <xsl:value-of select="function-available('str:replace')"></xsl:value-of></div>
            <div>str:split <xsl:value-of select="function-available('str:split')"></xsl:value-of></div>
            <div>str:tokenize <xsl:value-of select="function-available('str:tokenize')"></xsl:value-of></div>

            <h3>common</h3>
            <div>common:node-set <xsl:value-of select="function-available('common:node-set')"></xsl:value-of></div>
            <div>common:object-type <xsl:value-of select="function-available('common:object-type')"></xsl:value-of></div>
            <div>common:document <xsl:value-of select="function-available('common:document')"></xsl:value-of></div>

            <h3>function</h3>
            <div>func:function <xsl:value-of select="element-available('func:function')"></xsl:value-of></div>
            <div>func:result <xsl:value-of select="element-available('func:result')"></xsl:value-of></div>
            <div>func:script <xsl:value-of select="element-available('func:script')"></xsl:value-of></div>

            <h3>Regular Expressions</h3>
            <div>regexp:test <xsl:value-of select="function-available('regexp:test')"></xsl:value-of></div>
            <div>regexp:match <xsl:value-of select="function-available('regexp:match')"></xsl:value-of></div>
            <div>regexp:replace <xsl:value-of select="function-available('regexp:replace')"></xsl:value-of></div>

            <h3>Sets</h3>
            <div>sets:has-same-node <xsl:value-of select="function-available('sets:has-same-node')"></xsl:value-of></div>

            <script>
                if ("serviceWorker" in navigator) {
                    navigator.serviceWorker.register("service-worker.js");
                }
            </script>
        </body>

        </html>
    </xsl:template>
</xsl:stylesheet>