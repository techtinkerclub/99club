/* 99 Club Studio · local QR generator v1.56
 * Fixed QR Version 10-L byte-mode encoder. Capacity: 271 ASCII bytes, enough for
 * the compact self-contained challenge links. No network service is used.
 */
(function(global){
'use strict';
const VERSION=10,SIZE=57,DATA_CODEWORDS=274,EC_PER_BLOCK=18,BLOCK_DATA=[68,68,69,69],ALIGN=[6,28,50],MASK=0;
const GF_EXP=new Uint8Array(512),GF_LOG=new Uint8Array(256);
(function initGF(){let x=1;for(let i=0;i<255;i++){GF_EXP[i]=x;GF_LOG[x]=i;x<<=1;if(x&0x100)x^=0x11d;}for(let i=255;i<512;i++)GF_EXP[i]=GF_EXP[i-255];})();
function mul(a,b){return a&&b?GF_EXP[GF_LOG[a]+GF_LOG[b]]:0;}
function rsGenerator(degree){let poly=[1];for(let i=0;i<degree;i++){const next=new Array(poly.length+1).fill(0),r=GF_EXP[i];for(let j=0;j<poly.length;j++){next[j]^=poly[j];next[j+1]^=mul(poly[j],r);}poly=next;}return poly;}
const RS_GEN=rsGenerator(EC_PER_BLOCK);
function rsRemainder(data){const work=data.concat(new Array(EC_PER_BLOCK).fill(0));for(let i=0;i<data.length;i++){const factor=work[i];if(!factor)continue;for(let j=0;j<RS_GEN.length;j++)work[i+j]^=mul(RS_GEN[j],factor);}return work.slice(data.length);}
function utf8Bytes(text){const s=unescape(encodeURIComponent(String(text)));return Array.from(s,ch=>ch.charCodeAt(0));}
function appendBits(out,val,len){for(let i=len-1;i>=0;i--)out.push((val>>>i)&1);}
function dataCodewords(text){
  const bytes=utf8Bytes(text);if(bytes.length>271)throw new Error(`Challenge link is too long for the local QR (${bytes.length}/271 bytes).`);
  const bits=[];appendBits(bits,0b0100,4);appendBits(bits,bytes.length,16);for(const b of bytes)appendBits(bits,b,8);
  const capacity=DATA_CODEWORDS*8;for(let i=0;i<Math.min(4,capacity-bits.length);i++)bits.push(0);while(bits.length%8)bits.push(0);
  const out=[];for(let i=0;i<bits.length;i+=8){let v=0;for(let j=0;j<8;j++)v=(v<<1)|bits[i+j];out.push(v);}let pad=0;while(out.length<DATA_CODEWORDS)out.push((pad++&1)?0x11:0xec);return out;
}
function finalCodewords(text){
  const data=dataCodewords(text),blocks=[],ecc=[],starts=[0];for(const n of BLOCK_DATA)starts.push(starts.at(-1)+n);
  for(let i=0;i<BLOCK_DATA.length;i++){const b=data.slice(starts[i],starts[i+1]);blocks.push(b);ecc.push(rsRemainder(b));}
  const out=[],max=Math.max(...BLOCK_DATA);for(let i=0;i<max;i++)for(const b of blocks)if(i<b.length)out.push(b[i]);for(let i=0;i<EC_PER_BLOCK;i++)for(const e of ecc)out.push(e[i]);return out;
}
function bitLength(n){let l=0;while(n){l++;n>>>=1;}return l;}
function bch(data,shift,poly){let rem=data<<shift;const top=bitLength(poly)-1;while(bitLength(rem)-1>=top){rem^=poly<<(bitLength(rem)-1-top);}return (data<<shift)|rem;}
function formatBits(){return bch((1<<3)|MASK,10,0x537)^0x5412;}
function versionBits(){return bch(VERSION,12,0x1f25);}
function make(text){
  const m=Array.from({length:SIZE},()=>Array(SIZE).fill(false)),f=Array.from({length:SIZE},()=>Array(SIZE).fill(false));
  function set(r,c,dark){if(r<0||c<0||r>=SIZE||c>=SIZE)return;m[r][c]=!!dark;f[r][c]=true;}
  function finder(cx,cy){for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const dist=Math.max(Math.abs(dx),Math.abs(dy));set(cy+dy,cx+dx,dist!==2&&dist!==4);}}
  function align(cx,cy){for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(cy+dy,cx+dx,Math.max(Math.abs(dx),Math.abs(dy))!==1);}
  finder(3,3);finder(SIZE-4,3);finder(3,SIZE-4);
  for(let i=8;i<SIZE-8;i++){if(!f[6][i])set(6,i,i%2===0);if(!f[i][6])set(i,6,i%2===0);}
  for(const cy of ALIGN)for(const cx of ALIGN){if((cx===6&&cy===6)||(cx===6&&cy===SIZE-7)||(cx===SIZE-7&&cy===6))continue;align(cx,cy);}
  const fmt=formatBits();
  for(let i=0;i<=5;i++)set(i,8,(fmt>>>i)&1);set(7,8,(fmt>>>6)&1);set(8,8,(fmt>>>7)&1);set(8,7,(fmt>>>8)&1);for(let i=9;i<15;i++)set(8,14-i,(fmt>>>i)&1);
  for(let i=0;i<8;i++)set(8,SIZE-1-i,(fmt>>>i)&1);for(let i=8;i<15;i++)set(SIZE-15+i,8,(fmt>>>i)&1);set(SIZE-8,8,true);
  const ver=versionBits();for(let i=0;i<18;i++){const bit=(ver>>>i)&1,a=SIZE-11+(i%3),b=Math.floor(i/3);set(b,a,bit);set(a,b,bit);}
  const cw=finalCodewords(text),bits=[];for(const v of cw)appendBits(bits,v,8);let bi=0;
  for(let right=SIZE-1;right>=1;right-=2){if(right===6)right=5;for(let vert=0;vert<SIZE;vert++){const upward=((right+1)&2)===0,row=upward?SIZE-1-vert:vert;for(let j=0;j<2;j++){const col=right-j;if(f[row][col])continue;let bit=bi<bits.length?bits[bi++]:0;if(((row+col)&1)===0)bit^=1;m[row][col]=!!bit;}}}
  return m;
}
function drawToCanvas(text,canvas,pixels=240){const matrix=make(text),quiet=4,total=SIZE+quiet*2,scale=Math.max(1,Math.floor(pixels/total)),actual=total*scale;canvas.width=actual;canvas.height=actual;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#fff';ctx.fillRect(0,0,actual,actual);ctx.fillStyle='#183f43';for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(matrix[r][c])ctx.fillRect((c+quiet)*scale,(r+quiet)*scale,scale,scale);return canvas;}
function dataUrl(text,pixels=240){const c=document.createElement('canvas');drawToCanvas(text,c,pixels);return c.toDataURL('image/png');}
global.TT99PlayQR={version:'1.56',make,drawToCanvas,dataUrl,size:SIZE,maxBytes:271};
})(typeof globalThis!=='undefined'?globalThis:this);
