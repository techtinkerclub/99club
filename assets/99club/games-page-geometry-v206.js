/* 99 Club Studio · shared A4 games page geometry v2.06
 * One coordinate system for the direct PDF exporter and the browser preview.
 * Values are PDF points; the preview treats one point as one CSS px, then scales
 * the complete sheet as a single unit to fit the available screen width.
 */
(function(global){
  'use strict';
  const P=global.TT99SimplePDF||{};
  const geometry={
    pageWidth:Number(P.PAGE_W)||595.28,
    pageHeight:Number(P.PAGE_H)||841.89,
    margin:34,
    headerTop:21,
    headerRuleY:94,
    bodyTop:110,
    bodyBottom:42,
    activityGap:12,
    footerRuleBottom:28
  };
  global.TT99GamesPageGeometry=Object.freeze(geometry);
})(typeof globalThis!=='undefined'?globalThis:this);
