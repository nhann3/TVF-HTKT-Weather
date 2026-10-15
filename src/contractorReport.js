/* Local text parser: no network, no automatic save or package selection. */
const ContractorReport = (() => {
 const numberFields=['bchCount','workerCount','totalCount','chiefCount','engineerCount','qaCount','qsCount'];
 const textFields=['reportDate','manpowerScope','bchName','chiefName','engineerName','qaName','qsName','workAreas','workContent','reportText','equipment'];
 const headers=['Ngày báo cáo Nhà thầu','Phạm vi quân số','BCH (người)','Công nhân (người)','Tổng quân số','Tên BCH','CBKT (người)','Tên CBKT','QA/QC (người)','Tên QA/QC','QS (người)','Tên QS','Khu vực công việc','Công việc thi công trong ngày','Báo cáo gốc Nhà thầu','Máy móc, thiết bị'];
 const keys=['reportDate','manpowerScope','bchCount','workerCount','totalCount','bchName','engineerCount','engineerName','qaCount','qaName','qsCount','qsName','workAreas','workContent','reportText','equipment'];
 const fold=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
 function clean(r={}){if(!r||typeof r!=='object')r={};const out={};for(const k of numberFields){const v=r[k];if(v!==''&&v!==null&&v!==undefined){const n=Number(v);if(!Number.isInteger(n)||n<0||n>100000)throw Error('Quân số phải là số nguyên từ 0 đến 100000.');out[k]=n}}for(const k of textFields){if(r[k])out[k]=String(r[k]).trim()}if(out.bchCount===undefined&&out.chiefCount!==undefined)out.bchCount=out.chiefCount;if(!out.bchName&&out.chiefName)out.bchName=out.chiefName;return out}
 // Recover boundaries when copy/paste collapses a report into one line.
 function splitReport(raw){
  const text=raw.normalize('NFC'), f=fold(text), cuts=new Set([0,text.length]);
  const marker=/(?:^|[\s.;,])((?:[-*•]\s*|\d+\s*[/.]\s*)?(?:may moc(?:\s*[,/]?\s*thiet bi)?|may thi cong|thiet bi(?: thi cong)?|mmtb|bch|ban chi huy|dtc|doi thi cong|ns|sn|nc|cn|cong nhan|nhan cong|cbch|cht|chi huy truong|can bo chi huy|cbkt|ktht|can bo ky thuat(?:\s*\(cbkt\))?|(?:shop\s*[,/]?\s*)?(?:(?:can bo|cb)\s*)?qa\s*[/\-]?\s*qc|(?:(?:can bo|cb)\s*)?qs|tong\s*(?:quan so|nhan su|so nguoi|dtc|ns|sn|nc|cn|nhan cong|cong nhan)|(?:cong viec|noi dung)(?: thi cong)?(?: trong ngay)?|ngay\s*\d{1,2}\/\d{1,2}\/\d{4})\s*[:：])/g;
  for(const m of f.matchAll(marker))cuts.add(m.index+m[0].length-m[1].length);
  for(const m of text.matchAll(/\s+[-*•]\s+/g))cuts.add(m.index+m[0].search(/[-*•]/));
  const indexes=[...cuts].sort((a,b)=>a-b),lines=[];
  for(let i=0;i<indexes.length-1;i++)lines.push(...text.slice(indexes[i],indexes[i+1]).split(/\r?\n/).map(x=>x.trim()).filter(Boolean));
  return lines;
 }
 function resolve(c={}){
  const explicit=clean(c.report),source=String(c.note||explicit.reportText||'').trim();
  if(!source)return explicit;
  // Pure read: exporting old journals never writes back or changes history.
  let derived={};try{derived=parse(source).report}catch(e){return explicit}
  return {...derived,...explicit,reportText:source};
 }
 function parse(raw){if(typeof raw!=='string'||!raw.trim())throw Error('Dán báo cáo Nhà thầu trước khi tách.');if(raw.length>6000)throw Error('Báo cáo quá dài; tối đa 6000 ký tự.');const report={reportText:raw.trim(),manpowerScope:'Riêng gói thầu này'},warnings=[],work=[],equipment=[];const lines=splitReport(raw);
 for(const original of lines){const base=original.replace(/^[\s*•\-–|]+/,'').replace(/[\s*|]+$/,'').trim(),line=/^\d{1,2}\/\d{1,2}\/\d{4}\b/.test(base)?base:base.replace(/^\d+\s*[\/.)]\s*/,'').trim(),f=fold(line);let m;
  if((m=line.match(/(?:ngày\s*)?(\d{1,2})\/(\d{1,2})\/(\d{4})/i))&&!report.reportDate){const y=+m[3],mo=+m[2],da=+m[1],dt=new Date(Date.UTC(y,mo-1,da));if(dt.getUTCFullYear()===y&&dt.getUTCMonth()===mo-1&&dt.getUTCDate()===da)report.reportDate=`${y}-${String(mo).padStart(2,'0')}-${String(da).padStart(2,'0')}`;else warnings.push('Ngày trong báo cáo không hợp lệ.');}
  // Equipment stays as reported text: do not infer quantity, model or operating state.
  const equipmentHeading=/^(?:may moc(?:\s*[,/]?\s*thiet bi)?|may thi cong|thiet bi(?: thi cong)?|mmtb)\s*[:：]/;
  const equipmentName='(?:may\\s+(?:dao|xuc|lu|ui|san|khoan|bom|phat dien|tron|dam|cat|han|nen khi|dong coc|ep coc|cau)|bua\\s+(?:rung|dong)|cau\\s+(?:banh xich|thap|banh lop)|xe\\s+(?:lu|dao|xuc|ui|cau|ben|tai|bon|van chuyen)|o to(?:\\s+(?:tai|ben|van chuyen))?)';
  const equipmentItem=new RegExp('^(?:\\d+\\s*(?:cai|chiec|bo)\\s+)?'+equipmentName+'(?=\\s|[:：,.;(]|$)|^\\d+\\s*'+equipmentName+'(?=\\s|[:：,.;(]|$)');
  if(equipmentHeading.test(f)){
   const content=line.slice(line.search(/[:：]/)+1).trim();
   if(content&&!/^(?:khong (?:co|ghi nhan)|chua (?:co|ghi nhan))\s*[.;]?$/.test(fold(content)))equipment.push(content);
   continue;
  }
  if(/^(?:may moc(?:\s*[,/]?\s*thiet bi)?|may thi cong|thiet bi(?: thi cong)?|mmtb)\s*$/.test(f))continue;
  if(equipmentItem.test(f)){
   // A work sentence such as "Máy đào đang đào đất ..." belongs in daily work.
   const countReported=/^\d+\s*/.test(f)||/[:：=]\s*\d+/.test(f)||/\b\d+\s*(?:cai|chiec|bo|xe|may)\b/.test(f);
   if(countReported){equipment.push(line);continue;}
  }
  // Contractor shorthand: quantity precedes the role, e.g. "1 CHT".
  const shortTotal=f.match(/^tong\s*(?:(?:quan so|nhan su|so nguoi|dtc|ns|sn|nc|cn|nhan cong|cong nhan)\s*)?[:：]?\s*(\d{1,5})\s*(?:ns|sn|nc|cn|dtc|nhan su|nhan cong|cong nhan|nguoi)?\s*[.;]?$/);
  if(shortTotal){report.totalCount=+shortTotal[1];continue;}
  const countFirst=f.match(/^(\d{1,5})\s*(?:nguoi\s+)?(bch|ban chi huy|can bo bch|cht|cbch|chi huy truong|cbkt|ktht|can bo ky thuat|(?:can bo\s+)?qa\s*[/\-]?\s*qc|(?:can bo\s+)?qs|nhan cong|cong nhan|dtc|ns|sn|nc|cn)(?=\s|[(:.;,]|$)/);
  if(countFirst){
   const label=countFirst[2],key=/^(?:bch|ban chi huy|can bo bch)$/.test(label)?'bch':/^(?:cht|cbch|chi huy truong)$/.test(label)?'chief':/^(?:cbkt|ktht|can bo ky thuat)$/.test(label)?'engineer':/qa/.test(label)?'qa':/qs/.test(label)?'qs':'worker';
   const field=key+'Count',quantity=+countFirst[1];
   if(report[field]!==undefined&&report[field]!==quantity)warnings.push('Có nhiều số người khác nhau cho '+label.toUpperCase()+'. Giữ số đầu để kiểm tra.');else report[field]=quantity;
   const bracket=line.match(/\(([^)]*)\)/);if(bracket&&['chief','engineer','qa','qs'].includes(key)&&!report[key+'Name'])report[key+'Name']=bracket[1].trim();
   const remainder=line.slice(countFirst[0].length).replace(/\([^)]*\)/,'').replace(/^[\s:;,.-]+|[\s.;]+$/g,'').trim();if(remainder)work.push(remainder);
   continue;
  }
  if(/^(?:quan so(?: gom)?|nhan su(?: gom)?)\s*[:：]?\s*$/.test(f))continue;
  if(/^(?:bch|ban chi huy|can bo bch)\s*[:：]/.test(f)){m=f.match(/[:：]\s*(\d{1,5})\b/);if(m)report.bchCount=+m[1];continue}
  if((m=f.match(/^(?:dtc|doi thi cong|ns|sn|nc|cn|cong nhan|nhan cong)\s*[:：=\-]?\s*(\d{1,5})\b/))){report.workerCount=+m[1];continue}
  if(/^tong\s*(?:quan so|nhan su|so nguoi)\s*[:：]/.test(f)){m=f.match(/[:：]\s*(\d{1,5})\b/);if(m)report.totalCount=+m[1];continue}
  const roles=[
   ['chief',/^(?:(?:cbch|cht)(?:\s*\/\s*(?:cbch|cht))?|chi huy truong|can bo chi huy)\s*[:：]/],
   ['engineer',/^(?:cbkt|ktht|can bo ky thuat)(?:\s*\(cbkt\))?\s*[:：]/],
   ['qa',/^(?:shop\s*[,/]?\s*)?(?:(?:can bo|cb)\s*)?qa\s*[/\-]?\s*qc\s*[:：]|^cbqa\s*[/\-]?\s*qc\s*[:：]/],
   ['qs',/^(?:(?:can bo|cb)\s*)?qs\s*[:：]/]
  ];let role=false;
  for(const [key,pattern] of roles){if(pattern.test(f)){
   const tail=line.slice(line.search(/[:：]/)+1).trim(),count=tail.match(/^(\d{1,5})\b/),bracket=tail.match(/\(([^)]*)\)/);
   let name=bracket?bracket[1].trim():tail.replace(/^\d{1,5}\b\s*/,'').replace(/^(?:người|cán bộ|cb)(?=\s|\(|$)\s*/i,'').replace(/^[\s,;\-]+|[\s.;]+$/g,'').trim();
   if(count){const number=+count[1];if(report[key+'Count']!==undefined&&report[key+'Count']!==number)warnings.push('Có nhiều dòng '+({chief:'CHT',engineer:'CBKT',qa:'QA/QC',qs:'QS'})[key]+' với số người khác nhau. Giữ dòng đầu, kiểm tra báo cáo gốc.');else report[key+'Count']=number;}
   if(name){if(report[key+'Name']&&report[key+'Name']!==name)warnings.push('Có nhiều tên cho cùng chức danh; giữ tên đầu để bạn kiểm tra.');else report[key+'Name']=name;}
   role=true;break;
  }}if(role)continue;
  if(/^(?:chua (?:ghi nhan|co|nhan duoc) bao cao|khong (?:co|ghi nhan|nhan duoc) bao cao|khong du (?:du lieu|thong tin)|khong ghi nhan)(?:\b|$)/.test(f)||/^[|\s:\-]+$/.test(line))continue;
  // Ignore greetings and report headings, keep the remaining content as daily work.
  if(/^(?:kinh gui|tran trong|xin cam on|bao cao (?:nhan su|quan so)|nha thau.*(?:bao cao|xin gui)|ngay\s*\d)/.test(f)||/^\d{1,2}\/\d{1,2}\/\d{4}\s*[:：.]?$/.test(f))continue;
  if(/^(?:cong viec|noi dung)(?: thi cong)?(?: trong ngay)?\s*[:：]/.test(f)){const content=line.slice(line.search(/[:：]/)+1).trim();if(content)work.push(content);continue;}
  if(line)work.push(line);
 }
 if(equipment.length)report.equipment=equipment.join('\n');
 if(report.bchCount===undefined&&report.chiefCount!==undefined){report.bchCount=report.chiefCount;warnings.push('BCH lấy theo số CHT/CBCH được báo; không cộng CBKT, QA/QC, QS vào BCH khi chưa có tổng BCH.');}
 if(work.length){report.workContent=work.join('\n');const areas=[];for(const t of work){for(const m of t.matchAll(/\b(?:[VTCUN]\d+[A-Z]?|Plaza\s*\d+)\b/gi)){const a=m[0].toUpperCase();if(!areas.includes(a))areas.push(a)}}if(areas.length)report.workAreas=areas.join(', ')}
 if(!numberFields.some(k=>report[k]!==undefined))warnings.push('Chưa nhận diện được quân số. Bạn có thể nhập các trường thủ công.');
 if(!report.workContent)warnings.push('Chưa tách được công việc; kiểm tra nội dung báo cáo gốc.');
 if(report.totalCount===undefined)warnings.push('Không có tổng quân số trong báo cáo; để trống, không tự suy đoán.');
 return {report:clean(report),warnings};
 }
 function cells(report){const r=clean(report);return keys.map(k=>r[k]??(k==='workContent'?'Không đủ dữ liệu':(numberFields.includes(k)||['bchName','engineerName','qaName','qsName','workAreas','reportDate','manpowerScope','equipment'].includes(k))?'Không ghi nhận':''))}
 return {parse,resolve,clean,numberFields,textFields,headers,keys,cells};
})();
