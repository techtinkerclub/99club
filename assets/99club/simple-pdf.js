/* Tiny dependency-free PDF writer for TTC 99 Club.
 * Uses PDF standard Helvetica fonts and optional JPEG XObject images.
 */
(function (global) {
  'use strict';
  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const LANDSCAPE_W = PAGE_H;
  const LANDSCAPE_H = PAGE_W;

  function asciiish(s) {
    return String(s == null ? '' : s)
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/\u2192/g, '->')
      .replace(/\u2194/g, '<->')
      .replace(/\u2212/g, '-')
      .replace(/\u2248/g, '~')
      .replace(/\u221A/g, 'sqrt ')
      .replace(/[^\x00-\xFF]/g, '?');
  }
  function pdfEscape(s) {
    return asciiish(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[\r\n]+/g, ' ');
  }
  function n(v) { return Number(v).toFixed(2).replace(/\.00$/, ''); }
  function rgb(c) { return c.map(v => Math.max(0, Math.min(255, v)) / 255).map(n).join(' '); }
  function dataUrlToBytes(dataUrl) {
    const base64 = String(dataUrl || '').split(',')[1] || '';
    const bin = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i) & 255;
    return out;
  }
  function bytesToBinary(bytes) {
    const chunk = 0x8000;
    let out = '';
    for (let i = 0; i < bytes.length; i += chunk) {
      const part = bytes.subarray(i, Math.min(bytes.length, i + chunk));
      out += String.fromCharCode.apply(null, part);
    }
    return out;
  }
  function binaryToBytes(s) {
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i += 1) out[i] = s.charCodeAt(i) & 255;
    return out;
  }

  class PDFDocument {
    constructor() {
      this.pages = [];
      this.images = {};
    }
    setJpeg(dataUrl, widthPx, heightPx, name = 'Im1') {
      if (!dataUrl) { delete this.images[name]; return; }
      this.images[name] = { bytes: dataUrlToBytes(dataUrl), width: widthPx, height: heightPx };
    }
    addPage(options = {}) {
      const orientation = options.orientation === 'landscape' ? 'landscape' : 'portrait';
      const width = orientation === 'landscape' ? LANDSCAPE_W : PAGE_W;
      const height = orientation === 'landscape' ? LANDSCAPE_H : PAGE_H;
      const cmds = [];
      this.pages.push({ cmds, width, height, orientation });
      return new PDFPage(cmds, width, height);
    }
    outputBytes() {
      if (!this.pages.length) this.addPage();
      const objects = [];
      const add = body => { objects.push(body); return objects.length; };
      const catalogId = add('');
      const pagesId = add('');
      const fontRegularId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
      const fontBoldId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
      // PDF's standard Symbol font gives us a proper radical glyph without
      // shipping a webfont or external dependency. It is used only for the
      // optional post-99 square-root question family.
      const fontSymbolId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Symbol >>');
      const imageIds = {};
      Object.entries(this.images).forEach(([name, im]) => {
        imageIds[name] = add(`<< /Type /XObject /Subtype /Image /Width ${im.width} /Height ${im.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>\nstream\n${bytesToBinary(im.bytes)}\nendstream`);
      });
      const pageIds = [];
      for (const entry of this.pages) {
        const cmds = Array.isArray(entry) ? entry : entry.cmds;
        const pageWidth = Array.isArray(entry) ? PAGE_W : entry.width;
        const pageHeight = Array.isArray(entry) ? PAGE_H : entry.height;
        const stream = cmds.join('\n') + '\n';
        const contentId = add(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
        const xObject = Object.keys(imageIds).length ? ` /XObject << ${Object.entries(imageIds).map(([name,id])=>`/${name} ${id} 0 R`).join(' ')} >>` : '';
        const resources = `<< /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R /F3 ${fontSymbolId} 0 R >>${xObject} >>`;
        const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${n(pageWidth)} ${n(pageHeight)}] /Resources ${resources} /Contents ${contentId} 0 R >>`);
        pageIds.push(pageId);
      }
      objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
      objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

      let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
      const offsets = [0];
      objects.forEach((body, i) => {
        offsets.push(pdf.length);
        pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
      });
      const xref = pdf.length;
      pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
      for (let i = 1; i <= objects.length; i += 1) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
      pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
      return binaryToBytes(pdf);
    }
    save(filename) {
      const blob = new Blob([this.outputBytes()], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename || 'worksheet.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
  }

  class PDFPage {
    constructor(cmds, width = PAGE_W, height = PAGE_H) { this.c = cmds; this.width = width; this.height = height; }
    text(x, topY, text, size = 10, opts = {}) {
      const font = opts.bold ? 'F2' : 'F1';
      const width = estimateTextWidth(text, size, opts.bold);
      let tx = x;
      if (opts.align === 'center') tx -= width / 2;
      if (opts.align === 'right') tx -= width;
      const y = this.height - topY;
      this.c.push(`BT /${font} ${n(size)} Tf ${opts.color ? rgb(opts.color) + ' rg ' : ''}1 0 0 1 ${n(tx)} ${n(y)} Tm (${pdfEscape(text)}) Tj ET`);
      return width;
    }
    // Draw one glyph from PDF's standard Symbol font. `code` is the
    // Symbol-encoding byte (214 = radical / square-root sign).
    symbol(x, topY, code, size = 10, opts = {}) {
      const y = this.height - topY;
      const byte = Math.max(0, Math.min(255, Number(code) || 0));
      const octal = byte.toString(8).padStart(3, '0');
      const width = size * (byte === 214 ? 0.549 : 0.6);
      let tx = x;
      if (opts.align === 'center') tx -= width / 2;
      if (opts.align === 'right') tx -= width;
      this.c.push(`BT /F3 ${n(size)} Tf ${opts.color ? rgb(opts.color) + ' rg ' : ''}1 0 0 1 ${n(tx)} ${n(y)} Tm (\\${octal}) Tj ET`);
      return width;
    }
    line(x1, y1Top, x2, y2Top, opts = {}) {
      const y1 = this.height - y1Top, y2 = this.height - y2Top;
      this.c.push(`${opts.color ? rgb(opts.color) + ' RG ' : ''}${n(opts.width || 0.7)} w ${n(x1)} ${n(y1)} m ${n(x2)} ${n(y2)} l S`);
    }
    rect(x, topY, w, h, opts = {}) {
      const y = this.height - topY - h;
      const parts = [];
      if (opts.fill) parts.push(`${rgb(opts.fill)} rg`);
      if (opts.stroke) parts.push(`${rgb(opts.stroke)} RG`);
      parts.push(`${n(opts.width || 0.7)} w`, `${n(x)} ${n(y)} ${n(w)} ${n(h)} re`);
      parts.push(opts.fill && opts.stroke ? 'B' : opts.fill ? 'f' : 'S');
      this.c.push(parts.join(' '));
    }
    image(x, topY, w, h, name = 'Im1') {
      const y = this.height - topY - h;
      this.c.push(`q ${n(w)} 0 0 ${n(h)} ${n(x)} ${n(y)} cm /${name} Do Q`);
    }
  }

  function estimateTextWidth(text, size, bold) {
    // Conservative Helvetica estimate; enough for alignment/layout in worksheets.
    const s = asciiish(text);
    let units = 0;
    for (const ch of s) {
      if (' ilI1.,:;!|'.includes(ch)) units += 0.28;
      else if ('MW@%'.includes(ch)) units += 0.9;
      else if ('mw'.includes(ch)) units += 0.78;
      else units += 0.53;
    }
    return units * size * (bold ? 1.03 : 1);
  }

  const api = { PDFDocument, PAGE_W, PAGE_H, LANDSCAPE_W, LANDSCAPE_H, estimateTextWidth, asciiish };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TT99SimplePDF = api;
}(typeof window !== 'undefined' ? window : globalThis));
