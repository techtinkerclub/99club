/* 99 Club Studio - minimal QR encoder.
 * Byte mode only, error correction L, fixed mask 0, versions 1-40.
 * Designed solely for local recreation links embedded in teacher answer sheets.
 * No network/service dependency is used at runtime.
 */
(function(global){
  'use strict';

  const MODE_BYTE=4, ECL_L=1, PAD0=0xEC, PAD1=0x11;
  const G15=(1<<10)|(1<<8)|(1<<5)|(1<<4)|(1<<2)|(1<<1)|1;
  const G18=(1<<12)|(1<<11)|(1<<10)|(1<<9)|(1<<8)|(1<<5)|(1<<2)|1;
  const G15_MASK=(1<<14)|(1<<12)|(1<<10)|(1<<4)|(1<<1);
  const PATTERN_POS=[
    [],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],
    [6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],
    [6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],
    [6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],
    [6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],
    [6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],
    [6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],
    [6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]
  ];
  const RS_L=[
    [1,26,19],[1,44,34],[1,70,55],[1,100,80],[1,134,108],[2,86,68],[2,98,78],[2,121,97],[2,146,116],[2,86,68,2,87,69],
    [4,101,81],[2,116,92,2,117,93],[4,133,107],[3,145,115,1,146,116],[5,109,87,1,110,88],[5,122,98,1,123,99],
    [1,135,107,5,136,108],[5,150,120,1,151,121],[3,141,113,4,142,114],[3,135,107,5,136,108],[4,144,116,4,145,117],
    [2,139,111,7,140,112],[4,151,121,5,152,122],[6,147,117,4,148,118],[8,132,106,4,133,107],[10,142,114,2,143,115],
    [8,152,122,4,153,123],[3,147,117,10,148,118],[7,146,116,7,147,117],[5,145,115,10,146,116],[13,145,115,3,146,116],
    [17,145,115],[17,145,115,1,146,116],[13,145,115,6,146,116],[12,151,121,7,152,122],[6,151,121,14,152,122],
    [17,152,122,4,153,123],[4,152,122,18,153,123],[20,147,117,4,148,118],[19,148,118,6,149,119]
  ];

  const EXP=new Array(512).fill(0), LOG=new Array(256).fill(0);
  for(let i=0;i<8;i++)EXP[i]=1<<i;
  for(let i=8;i<256;i++)EXP[i]=EXP[i-4]^EXP[i-5]^EXP[i-6]^EXP[i-8];
  for(let i=0;i<255;i++)LOG[EXP[i]]=i;
  for(let i=255;i<512;i++)EXP[i]=EXP[i-255];
  function gexp(n){while(n<0)n+=255;return EXP[n%255];}
  function glog(n){if(n<1)throw new Error('QR GF log');return LOG[n];}

  function rsBlocks(version){
    const row=RS_L[version-1]; if(!row)throw new Error('QR version');
    const out=[];
    for(let i=0;i<row.length;i+=3){for(let c=0;c<row[i];c++)out.push({total:row[i+1],data:row[i+2]});}
    return out;
  }
  function polyNormalize(a){let i=0;while(i<a.length-1&&a[i]===0)i++;return a.slice(i);}
  function polyMul(a,b){const out=new Array(a.length+b.length-1).fill(0);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){if(a[i]&&b[j])out[i+j]^=gexp(glog(a[i])+glog(b[j]));}return polyNormalize(out);}
  function polyMod(dividend,divisor){let num=polyNormalize(dividend.slice());while(num.length>=divisor.length){const ratio=glog(num[0])-glog(divisor[0]);const next=num.slice();for(let i=0;i<divisor.length;i++){if(divisor[i])next[i]^=gexp(glog(divisor[i])+ratio);}num=polyNormalize(next);}return num;}
  function errorPoly(ecCount){let p=[1];for(let i=0;i<ecCount;i++)p=polyMul(p,[1,gexp(i)]);return p;}

  class Bits{
    constructor(){this.bytes=[];this.length=0;}
    put(value,length){for(let i=length-1;i>=0;i--)this.bit(((value>>>i)&1)!==0);}
    bit(on){const idx=this.length>>3;if(this.bytes.length<=idx)this.bytes.push(0);if(on)this.bytes[idx]|=0x80>>(this.length&7);this.length++;}
  }
  function utf8(text){return Array.from(new TextEncoder().encode(String(text)));}
  function createBytes(buffer,blocks){
    let offset=0,maxD=0,maxE=0;const dc=[],ec=[];
    for(const b of blocks){
      const d=buffer.bytes.slice(offset,offset+b.data);offset+=b.data;const ecCount=b.total-b.data;maxD=Math.max(maxD,d.length);maxE=Math.max(maxE,ecCount);
      const ep=errorPoly(ecCount), raw=d.concat(new Array(ep.length-1).fill(0)), rem=polyMod(raw,ep);const e=new Array(ecCount).fill(0);const start=ecCount-rem.length;for(let i=0;i<rem.length;i++)e[start+i]=rem[i];dc.push(d);ec.push(e);
    }
    const out=[];for(let i=0;i<maxD;i++)for(const d of dc)if(i<d.length)out.push(d[i]);for(let i=0;i<maxE;i++)for(const e of ec)if(i<e.length)out.push(e[i]);return out;
  }
  function createData(version,text){
    const data=utf8(text),blocks=rsBlocks(version),limit=blocks.reduce((n,b)=>n+b.data*8,0),buf=new Bits();
    buf.put(MODE_BYTE,4);buf.put(data.length,version<10?8:16);for(const b of data)buf.put(b,8);
    if(buf.length>limit)throw new Error('QR overflow');
    for(let i=0;i<Math.min(4,limit-buf.length);i++)buf.bit(false);
    while(buf.length%8)buf.bit(false);
    let toggle=0;while(buf.length<limit){buf.put(toggle?PAD1:PAD0,8);toggle^=1;}
    return createBytes(buf,blocks);
  }
  function bchDigit(v){let d=0;while(v){d++;v>>>=1;}return d;}
  function bchTypeInfo(data){let d=data<<10;while(bchDigit(d)-bchDigit(G15)>=0)d^=G15<<(bchDigit(d)-bchDigit(G15));return ((data<<10)|d)^G15_MASK;}
  function bchTypeNumber(data){let d=data<<12;while(bchDigit(d)-bchDigit(G18)>=0)d^=G18<<(bchDigit(d)-bchDigit(G18));return (data<<12)|d;}
  function mask0(r,c){return (r+c)%2===0;}

  function makeMatrix(version,data){
    const n=version*4+17,m=Array.from({length:n},()=>Array(n).fill(null));
    function probe(row,col){for(let r=-1;r<=7;r++){if(row+r<0||row+r>=n)continue;for(let c=-1;c<=7;c++){if(col+c<0||col+c>=n)continue;const dark=(r>=0&&r<=6&&(c===0||c===6))||(c>=0&&c<=6&&(r===0||r===6))||(r>=2&&r<=4&&c>=2&&c<=4);m[row+r][col+c]=dark;}}}
    probe(0,0);probe(n-7,0);probe(0,n-7);
    const pos=PATTERN_POS[version-1];for(const row of pos)for(const col of pos){if(m[row][col]!==null)continue;for(let r=-2;r<=2;r++)for(let c=-2;c<=2;c++)m[row+r][col+c]=(Math.abs(r)===2||Math.abs(c)===2||(r===0&&c===0));}
    for(let r=8;r<n-8;r++)if(m[r][6]===null)m[r][6]=(r%2===0);for(let c=8;c<n-8;c++)if(m[6][c]===null)m[6][c]=(c%2===0);
    const typeBits=bchTypeInfo((ECL_L<<3)|0);for(let i=0;i<15;i++){const bit=((typeBits>>i)&1)!==0;if(i<6)m[i][8]=bit;else if(i<8)m[i+1][8]=bit;else m[n-15+i][8]=bit;if(i<8)m[8][n-i-1]=bit;else if(i<9)m[8][15-i]=bit;else m[8][15-i-1]=bit;}m[n-8][8]=true;
    if(version>=7){const bits=bchTypeNumber(version);for(let i=0;i<18;i++){const bit=((bits>>i)&1)!==0;m[Math.floor(i/3)][i%3+n-11]=bit;m[i%3+n-11][Math.floor(i/3)]=bit;}}
    let inc=-1,row=n-1,bitIndex=7,byteIndex=0;for(let col=n-1;col>0;col-=2){if(col===6)col--;while(true){for(let k=0;k<2;k++){const c=col-k;if(m[row][c]===null){let dark=byteIndex<data.length?(((data[byteIndex]>>>bitIndex)&1)!==0):false;if(mask0(row,c))dark=!dark;m[row][c]=dark;bitIndex--;if(bitIndex<0){byteIndex++;bitIndex=7;}}}row+=inc;if(row<0||row>=n){row-=inc;inc=-inc;break;}}}
    return m;
  }
  function make(text){
    for(let version=1;version<=40;version++){
      try{return {version,matrix:makeMatrix(version,createData(version,text)),text:String(text)};}catch(e){if(String(e.message||e)!=='QR overflow')throw e;}
    }
    throw new Error('QR content is too long');
  }
  function svg(result,opts={}){
    const matrix=result.matrix||result,n=matrix.length,quiet=Number.isFinite(opts.quiet)?opts.quiet:4,total=n+quiet*2;
    let d='';for(let r=0;r<n;r++){let c=0;while(c<n){while(c<n&&!matrix[r][c])c++;if(c>=n)break;const start=c;while(c<n&&matrix[r][c])c++;d+=`M${start+quiet} ${r+quiet}h${c-start}v1H${start+quiet}z`;}}
    return `<svg class="${opts.className||''}" viewBox="0 0 ${total} ${total}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${opts.label||'Recreation QR code'}"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#111"/></svg>`;
  }

  const api={make,svg};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.TT99QR=api;
})(typeof window!=='undefined'?window:globalThis);
