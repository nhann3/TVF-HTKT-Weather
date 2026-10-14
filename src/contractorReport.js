/* Local text parser: no network, no automatic save or package selection. */
const ContractorReport = (() => {
 const numberFields=['bchCount','workerCount','totalCount','chiefCount','engineerCount','qaCount'];
 const textFields=['reportDate','manpowerScope','chiefName','engineerName','qaName','workAreas','workContent','reportText'];
 const headers=['Ngày báo cáo Nhà thầu','Phạm vi quân số','BCH (người)','Công nhân (người)','Tổng quân số','CHT (người)','Tên CHT','KTHT (người)','Tên KTHT','Shop QA/QC (người)','Tên Shop QA/QC','Khu vực công việc','Nội dung công việc','Báo cáo gốc Nhà thầu'];
 const keys=['reportDate','manpowerScope','bchCount','workerCount','totalCount','chiefCount','chiefName','engineerCount','engineerName','qaCount','qaName','workAreas','workContent','reportText'];
 const fold=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
 function clean(r={}){if(!r||typeof r!=='object')r={};const out={};for(const k of numberFields){const v=r[k];if(v!==''&&v!==null&&v!==undefined){const n=Number(v);if(!Number.isInteger(n)||n<0||n>100000)throw Error('Quân số phải là số nguyên từ 0 đến 100000.');out[k]=n}}for(const k of textFields){if(r[k])out[k]=String(r[k]).trim()}return out}
 function parse(raw){if(typeof raw!=='string'||!raw.trim())throw Error('Dán báo cáo Nhà thầu trước khi tách.');if(raw.length>6000)throw Error('Báo cáo quá dài; tối đa 6000 ký tự.');const report={reportText:raw.trim(),manpowerScope:'Riêng gói thầu này'},warnings=[],work=[];let inWork=false;const lines=raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 for(const original of lines){const line=original.replace(/^[\s*•\-–]+/,'').replace(/^\d+\s*[\/.)]\s*/,'').trim(),f=fold(line);let m;
  if((m=line.match(/(?:ngày\s*)?(\d{1,2})\/(\d{1,2})\/(\d{4})/i))&&!report.reportDate){const y=+m[3],mo=+m[2],da=+m[1],dt=new Date(Date.UTC(y,mo-1,da));if(dt.getUTCFullYear()===y&&dt.getUTCMonth()===mo-1&&dt.getUTCDate()===da)report.reportDate=`${y}-${String(mo).padStart(2,'0')}-${String(da).padStart(2,'0')}`;else warnings.push('Ngày trong báo cáo không hợp lệ.');}
  if(/^bch\s*[:：]/.test(f)){m=f.match(/[:：]\s*(\d{1,5})\b/);if(m)report.bchCount=+m[1];continue}
  if(/^dtc\s*[:：]/.test(f)||/^(?:cong nhan|cn)\s*[:：]/.test(f)){m=f.match(/[:：]\s*(\d{1,5})\b/);if(m)report.workerCount=+m[1];inWork=true;continue}
  if(/^tong\s*(?:quan so|nhan su|so nguoi)\s*[:：]/.test(f)){m=f.match(/[:：]\s*(\d{1,5})\b/);if(m)report.totalCount=+m[1];inWork=false;continue}
  const roles=[['chief',/^cht\s*[:：]/],['engineer',/^ktht\s*[:：]/],['qa',/^(?:shop\s*[,/]?\s*)?qa\s*\/?\s*qc\s*[:：]/]];let role=false;
  for(const [key,pattern] of roles){if(pattern.test(f)){m=line.match(/[:：]\s*(\d{1,5})\s*(?:\(([^)]*)\))?/);if(m){report[key+'Count']=+m[1];if(m[2])report[key+'Name']=m[2].trim()}role=true;break}}if(role)continue;
  if(inWork||(/^[*•\-–]/.test(original)&&!/^nha thau|^kinh gui/.test(f)))work.push(line);
 }
 if(work.length){report.workContent=work.join('\n');const areas=[];for(const t of work){for(const m of t.matchAll(/\b(?:[VTCUN]\d+[A-Z]?|Plaza\s*\d+)\b/gi)){const a=m[0].toUpperCase();if(!areas.includes(a))areas.push(a)}}if(areas.length)report.workAreas=areas.join(', ')}
 if(report.bchCount!==undefined&&report.workerCount!==undefined&&report.totalCount!==undefined&&report.bchCount+report.workerCount!==report.totalCount)warnings.push('BCH + công nhân khác tổng quân số báo cáo. Giữ số gốc để bạn kiểm tra.');
 const roleCount=['chiefCount','engineerCount','qaCount'].filter(k=>report[k]!==undefined).reduce((s,k)=>s+report[k],0);if(report.bchCount!==undefined&&roleCount>report.bchCount)warnings.push('Quân số các chức danh lớn hơn BCH; kiểm tra khả năng kiêm nhiệm.');
 if(!numberFields.some(k=>report[k]!==undefined))warnings.push('Chưa nhận diện được quân số. Bạn có thể nhập các trường thủ công.');
 if(!report.workContent)warnings.push('Chưa tách được công việc; kiểm tra nội dung báo cáo gốc.');
 if(report.totalCount===undefined)warnings.push('Không có tổng quân số trong báo cáo; để trống, không tự suy đoán.');
 return {report:clean(report),warnings};
 }
 function cells(report){const r=clean(report);return keys.map(k=>r[k]??'')}
 return {parse,clean,numberFields,textFields,headers,keys,cells};
})();
