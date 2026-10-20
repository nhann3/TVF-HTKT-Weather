// Independent weather authentication and API; no dependencies or changes to TVGS.
const WeatherCloud=(()=>{
 const base='https://vdyogxzqozhtoylepsdq.supabase.co',key='sb_publishable_vv4ALEv1iQ06hkehXuJgcQ_4K_4Yh0A',sessionKey='tvf-weather-session-v1',bucket='tvf-weather-photos';
 let session=null,refreshPromise=null,localRecords=[],ready=false,busy=false,recovery=null;
 const ui=id=>document.getElementById(id),status=text=>ui('cloudStatus').textContent=text;
 function readSession(){try{return JSON.parse(localStorage.getItem(sessionKey)||'null')}catch{return null}}
 function storeSession(s){session=s;if(s)localStorage.setItem(sessionKey,JSON.stringify(s));else localStorage.removeItem(sessionKey)}
 function hidePasswords(){for(const id of ['cloudPassword','cloudNewPassword','cloudConfirmPassword']){ui(id).type='password';const button=ui(id+'Toggle');button.textContent='Hiện mật khẩu';button.setAttribute('aria-pressed','false')}}
 function setupPasswordToggles(){for(const id of ['cloudPassword','cloudNewPassword','cloudConfirmPassword'])ui(id+'Toggle').onclick=()=>{const input=ui(id),show=input.type==='password';input.type=show?'text':'password';ui(id+'Toggle').textContent=show?'Ẩn mật khẩu':'Hiện mật khẩu';ui(id+'Toggle').setAttribute('aria-pressed',String(show))};hidePasswords()}
 function readRecovery(){
  const p=new URLSearchParams(location.hash.slice(1));
  if(!p.has('access_token')&&!p.has('error'))return '';
  // Remove credentials from the address bar; keep recovery tokens in memory only.
  history.replaceState(null,'',location.pathname+location.search);
  if(p.has('error'))return 'Liên kết khôi phục không hợp lệ hoặc đã hết hạn. Gửi email khôi phục mới rồi mở liên kết mới nhất.';
  if(p.get('type')!=='recovery')return '';
  const access_token=p.get('access_token'),refresh_token=p.get('refresh_token');
  if(!access_token||!refresh_token)return 'Liên kết khôi phục chưa đầy đủ. Gửi email khôi phục mới.';
  const seconds=Number(p.get('expires_in'))||3600;
  recovery={access_token,refresh_token,expires_at:Number(p.get('expires_at'))||Math.floor(Date.now()/1000)+seconds};
  return '';
 }
 async function resetPassword(e){
  e.preventDefault();if(!recovery||busy||saveBusy||photoBusy)return;
  const password=ui('cloudNewPassword').value,confirmPassword=ui('cloudConfirmPassword').value;
  if(password.length<8){status('Mật khẩu mới cần ít nhất 8 ký tự.');return;}
  if(password!==confirmPassword){status('Hai mật khẩu chưa trùng nhau. Vui lòng nhập lại.');return;}
  if(recovery.expires_at*1000<=Date.now()){status('Liên kết khôi phục đã hết hạn. Gửi email khôi phục mới.');return;}
  busy=true;buttons();ui('cloudResetButton').disabled=true;
  try{
   const user=await request('/auth/v1/user',{auth:false,method:'PUT',headers:{Authorization:'Bearer '+recovery.access_token},body:{password}});
   // Only replace this browser's session after Supabase confirms the change.
   storeSession({...recovery,user});recovery=null;ready=false;
   ui('cloudNewPassword').value='';ui('cloudConfirmPassword').value='';ui('cloudPassword').value='';hidePasswords();
   ui('cloudReset').hidden=true;
   status('Đã đổi mật khẩu. Đăng nhập bằng tài khoản và mật khẩu mới để tiếp tục.');
  }catch(e){
   status(e.status===401||e.status===403||e.code==='session_not_found'?'Liên kết khôi phục không còn hợp lệ. Gửi email khôi phục mới.':message(e));
  }finally{busy=false;ui('cloudResetButton').disabled=false;buttons();}
 }
 async function request(path,{method='GET',body,auth=true,headers={}}={}){
  if(auth)await access();const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{const resp=await fetch(base+path,{method,headers:{apikey:key,...(auth?{Authorization:'Bearer '+session.access_token}:{}),...(body&&!(body instanceof Blob)?{'Content-Type':'application/json'}:{}),...headers},body:body?(body instanceof Blob?body:JSON.stringify(body)):undefined,signal:controller.signal});const data=resp.status===204?null:await resp.json().catch(()=>null);if(!resp.ok){const err=Error(data?.message||data?.msg||data?.error_description||'Kết nối Supabase chưa thành công.');err.status=resp.status;err.code=data?.error_code||data?.code||'';throw err}return data}catch(e){if(e.name==='AbortError')throw Error('Kết nối quá thời gian. Chưa xác nhận lưu; bấm Đồng bộ để kiểm tra trước khi lưu lại.');throw e}finally{clearTimeout(timer)}
 }
 async function access(){if(!session)throw Error('Đăng nhập trước khi lưu nhật ký.');if(session.expires_at*1000>Date.now()+60000)return;if(refreshPromise)return refreshPromise;
  const run=async()=>{for(let attempt=0;attempt<2;attempt++){
   const latest=readSession();if(latest&&latest.user?.id===session?.user?.id)session=latest;
   if(!session)throw Error('Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.');
   if(session.expires_at*1000>Date.now()+60000)return;
   const token=session.refresh_token;
   try{const result=await request('/auth/v1/token?grant_type=refresh_token',{auth:false,method:'POST',body:{refresh_token:token}});result.expires_at=result.expires_at||Math.floor(Date.now()/1000)+result.expires_in;storeSession(result);return}
   catch(e){
    const invalid=(e.status===400||e.status===401)&&/refresh.?token.*(?:not.?found|already.?used|invalid)|invalid.*refresh.?token/i.test(String(e.code)+' '+e.message);
    if(!invalid)throw e;
    const newer=readSession();
    if(newer?.refresh_token&&newer.refresh_token!==token&&newer.user?.id===session?.user?.id){session=newer;if(attempt===0)continue;throw Error('Phiên đăng nhập vừa thay đổi ở tab khác. Bấm Đồng bộ để thử lại.');}
    storeSession(null);ready=false;
    throw Error('Phiên đăng nhập trên trình duyệt này không còn hợp lệ. Vui lòng nhập lại tài khoản và mật khẩu. Nội dung đang nhập được giữ nguyên.');
   }
  }};
  refreshPromise=(navigator.locks?navigator.locks.request('tvf-weather-auth-refresh',run):run()).finally(()=>refreshPromise=null);return refreshPromise;
 }
 function payload(r){const result={};for(const k of ['date','weather','weatherMorning','weatherAfternoon','start','end','impact','note','pauseStart','pauseEnd','halfDay'])result[k]=r[k]||'';result.contractors=(r.contractors||[]).map(c=>({name:c.name||'',packageName:c.packageName||'',status:c.status||'Chưa xác nhận',note:c.note||'',report:ContractorReport.clean(c.report)}));result.photos=(r.photos||[]).map(p=>({name:p.name||'Ảnh thời tiết',...(p.path?{path:p.path}:{data:p.data})}));return result}
 async function signPhotos(list){const paths=[...new Set(list.flatMap(r=>(r.photos||[]).map(p=>p.path).filter(Boolean)))];const urls=new Map();for(let i=0;i<paths.length;i+=100){const data=await request('/storage/v1/object/sign/'+bucket,{method:'POST',body:{paths:paths.slice(i,i+100),expiresIn:3600}});for(const p of data||[]){const u=p.signedURL||p.signedUrl;if(u)urls.set(p.path,u.startsWith('http')?u:base+'/storage/v1'+u)}}return list.map(r=>({...r,photos:(r.photos||[]).map(p=>({...p,url:urls.get(p.path)||p.url}))}))}
 async function readAll(){let result=[];for(let offset=0;;offset+=1000){const page=await request('/rest/v1/tvf_weather_journal?select=payload,version&order=day.desc&limit=1000&offset='+offset);result.push(...page.map(x=>({...x.payload,__version:x.version})));if(page.length<1000)break}return signPhotos(result)}
 function safePhotoURL(p){if(p.data&&/^data:image\/(jpeg|png|webp);base64,/.test(p.data))return p.data;try{const u=new URL(p.url);return u.origin===base&&u.pathname.startsWith('/storage/v1/')?u.href:''}catch{return ''}}
 async function save(r,expected){if(!ready)throw Error('Chưa đồng bộ dữ liệu. Đăng nhập rồi bấm Đồng bộ trước khi lưu.');const data=payload(r);for(let i=0;i<data.photos.length;i++){const p=data.photos[i];if(p.path)continue;if(!safePhotoURL(p))throw Error('Ảnh không hợp lệ. Chọn lại ảnh.');const blob=await(await fetch(p.data)).blob();if(blob.size>5242880)throw Error('Ảnh vượt 5 MB. Chọn ảnh nhỏ hơn.');const ext=blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg',path='tvf-weather/'+session.user.id+'/'+r.date+'/'+crypto.randomUUID()+'.'+ext;await request('/storage/v1/object/'+bucket+'/'+path,{method:'POST',body:blob,headers:{'Content-Type':blob.type,'x-upsert':'false'}});data.photos[i]={name:p.name,path}}
  const result=await request('/rest/v1/rpc/tvf_weather_save',{method:'POST',body:{p_day:r.date,p_payload:data,p_expected:expected??null}});const signed=await signPhotos([{...result.payload,__version:result.version}]).catch(()=>[{...result.payload,__version:result.version}]);status('Đã lưu lên đám mây · '+r.date);return signed[0];
 }
 async function checkMember(){const user=await request('/auth/v1/user');session.user=user;const rows=await request('/rest/v1/tvf_weather_members?select=can_write&user_id=eq.'+encodeURIComponent(user.id));if(!rows.length||!rows[0].can_write)throw Error('Tài khoản này chưa được cấp quyền nhật ký thời tiết.');return user}
 function buttons(){ui('cloudLogin').hidden=!!recovery||!!session&&ready;ui('cloudLogout').hidden=!!recovery||!session;ui('cloudRefresh').disabled=!!recovery||!session||busy;ui('cloudImport').disabled=!!recovery||!ready||busy||!localRecords.length;ui('saveJournal').disabled=!!recovery||!ready||busy}
 async function refresh(){if(busy||saveBusy||photoBusy)return;busy=true;buttons();try{await checkMember();const list=await readAll();records=list;ready=true;render();status('Đã đồng bộ '+list.length+' ngày · '+session.user.email.split('@')[0]);}catch(e){ready=false;status(message(e))}finally{busy=false;buttons()}}
 function message(e){if(e.code==='invalid_credentials'||/invalid login credentials/i.test(e.message))return 'Tài khoản hoặc mật khẩu chưa đúng. Kiểm tra mật khẩu trình duyệt tự điền và nhập lại.';if(String(e.message).includes('WEATHER_CONFLICT'))return 'Ngày này đã có bản mới trên đám mây. Nội dung đang nhập giữ nguyên. Bấm Đồng bộ rồi Sửa bản mới để đối chiếu.';if(e.status===404||e.status===400&&/tvf_weather/.test(e.message))return 'Chưa có bảng thời tiết. Chạy file SQL 01_weather_cloud.sql trước.';return e.message||'Chưa kết nối được. Nội dung đang nhập được giữ nguyên.'}
 async function init(local){const recoveryError=readRecovery();setupPasswordToggles();localRecords=JSON.parse(JSON.stringify(local));session=readSession();ui('cloudReset').onsubmit=resetPassword;ui('localCount').textContent=local.length+' ngày đang có trên thiết bị này. Chuyển dữ liệu cũ sẽ bỏ qua ngày đã có trên đám mây.';
  ui('cloudLogin').onsubmit=async e=>{e.preventDefault();if(busy||saveBusy||photoBusy)return;busy=true;buttons();ui('cloudLoginButton').disabled=true;let signedIn=false;try{const name=ui('cloudUsername').value.trim().toLowerCase();const result=await request('/auth/v1/token?grant_type=password',{auth:false,method:'POST',body:{email:name==='admin01'?'nha.a2z.hv.qs@gmail.com':name.includes('@')?name:name+'@tvgs-congtruong.local',password:ui('cloudPassword').value}});result.expires_at=result.expires_at||Math.floor(Date.now()/1000)+result.expires_in;storeSession(result);ready=false;signedIn=true;ui('cloudPassword').value='';hidePasswords();}catch(e){status(message(e))}finally{busy=false;ui('cloudLoginButton').disabled=false;buttons()}if(signedIn)await refresh()};
  ui('cloudRefresh').onclick=refresh;
  ui('cloudLogout').onclick=async()=>{if(busy||saveBusy||photoBusy)return;if(!confirm('Đăng xuất app thời tiết? Nội dung chưa lưu trên biểu mẫu sẽ được bỏ.'))return;busy=true;buttons();try{await request('/auth/v1/logout?scope=local',{method:'POST'})}catch{}storeSession(null);ready=false;records=[];editingDate=null;$('form').reset();pendingPhotos=[];loadContractors();showPhotos();setJournalMode(null);syncImpact();syncWeather();render();busy=false;buttons();status('Đã đăng xuất app thời tiết. Dự báo vẫn xem được.');};
  ui('cloudImport').onclick=async()=>{if(busy||saveBusy||photoBusy||!ready)return;if(!confirm('Chuyển '+localRecords.length+' ngày từ thiết bị này lên đám mây? Ngày đã có sẽ bỏ qua; bản gốc trên thiết bị được giữ nguyên.'))return;busy=true;buttons();let added=0,skipped=0;try{const latest=await readAll(),dates=new Set(latest.map(r=>r.date));for(const r of localRecords){if(dates.has(r.date)){skipped++;continue}status('Đang chuyển ngày '+r.date+'…');try{const saved=await save(r,null);dates.add(saved.date);added++}catch(e){if(/WEATHER_CONFLICT/.test(e.message)){skipped++;continue}throw e}}records=await readAll();render();status('Đã chuyển '+added+' ngày; bỏ qua '+skipped+' ngày đã có. Bản cũ vẫn được giữ trên thiết bị.');}catch(e){status('Đã chuyển '+added+' ngày. '+message(e)+' Có thể chuyển lại; ngày đã có sẽ bỏ qua.')}finally{busy=false;buttons()}};
  ui('cloudBackup').onclick=()=>{const blob=new Blob([JSON.stringify({format:'tvf-weather-backup-v1',records:localRecords},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='TVF_ThoiTiet_BanCu_ThietBi.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)};
  buttons();if(recovery){ui('cloudReset').hidden=false;status('Nhập mật khẩu mới bên dưới, tối thiểu 8 ký tự.');ui('cloudPanel').scrollIntoView?.({block:'start'});ui('cloudNewPassword').focus?.();}else if(recoveryError)status(recoveryError);else if(session)await refresh();else status('Đăng nhập admin01 để lưu và đồng bộ. Nhật ký cũ trên thiết bị được giữ nguyên.');
 }
 return {init,save,payload,message,safePhotoURL,get ready(){return ready},get available(){return ready&&!busy}};
})();
