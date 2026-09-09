(()=>{
  const zh=()=>((typeof lang!=='undefined'?lang:'zh')==='zh');
  function ensureModal(){const modal=document.getElementById('modal');if(!modal)return null;modal.classList.remove('hidden');return modal;}
  async function compressImage(file){
    const bitmap=await createImageBitmap(file);
    const max=1800;const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
    const w=Math.max(1,Math.round(bitmap.width*scale));const h=Math.max(1,Math.round(bitmap.height*scale));
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{alpha:true});ctx.drawImage(bitmap,0,0,w,h);
    bitmap.close?.();
    const type='image/webp';
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,type,.88));
    if(!blob) throw new Error('Image compression failed.');
    const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
    return {data,mime_type:type,size:blob.size,width:w,height:h};
  }

  window.openMediaUploader=function(){
    const modal=ensureModal();if(!modal)return;
    const students=(window.STUDIO_DATA?.students||[]).filter(s=>s.id);
    const selected=students.find(s=>s.id==='marcos')||students[0];
    modal.innerHTML=`<div class="modal-card glass media-upload-card">
      <div class="eyebrow cyan">EVIDENCE UPLOADER</div>
      <h2>${zh()?'上传课程素材':'Upload learning evidence'}</h2>
      <p class="subtle">${zh()?'图片会自动压缩后安全上传到 Supabase 私有 Storage，并绑定到学生档案。':'Images are compressed, securely uploaded to private Supabase Storage, and linked to the student profile.'}</p>
      <div class="upload-grid">
        <label><span>${zh()?'学生':'Student'}</span><select id="uploadStudent">${students.map(s=>`<option value="${s.id}" ${s.id===selected?.id?'selected':''}>${s.name}</option>`).join('')}</select></label>
        <label><span>${zh()?'素材类型':'Type'}</span><select id="uploadKind" onchange="document.getElementById('uploadSessionWrap').style.display=this.value==='portrait'?'none':'block'"><option value="lesson">${zh()?'课程图片':'Lesson image'}</option><option value="portrait">${zh()?'学生头像':'Student portrait'}</option></select></label>
        <label id="uploadSessionWrap"><span>${zh()?'课程节次':'Session'}</span><select id="uploadSession"><option value="1">Session 1</option><option value="2">Session 2</option><option value="3">Session 3</option><option value="4">Session 4</option></select></label>
        <label><span>${zh()?'标题':'Title'}</span><input id="uploadTitle" placeholder="${zh()?'例如：Minecraft 课堂实拍':'e.g. Minecraft classroom photo'}"></label>
      </div>
      <label class="dropzone" for="uploadFile"><input id="uploadFile" type="file" accept="image/*" hidden onchange="previewUploadFile(this)"><div id="uploadPreview"><b>${zh()?'选择图片':'Choose image'}</b><small>${zh()?'JPG / PNG / WebP · 自动压缩':'JPG / PNG / WebP · auto-compressed'}</small></div></label>
      <div id="uploadProgress" class="upload-progress hidden"><i></i><span>${zh()?'处理中…':'Processing…'}</span></div>
      <div class="modal-actions"><button class="ghost" onclick="closeModal()">${zh()?'取消':'Cancel'}</button><button class="primary" onclick="submitMediaUpload()">${zh()?'上传到 Supabase':'Upload to Supabase'}</button></div>
    </div>`;
  };

  window.previewUploadFile=function(input){const file=input.files?.[0];if(!file)return;const url=URL.createObjectURL(file);const box=document.getElementById('uploadPreview');box.innerHTML=`<img src="${url}" alt="preview"><div><b>${file.name}</b><small>${(file.size/1024/1024).toFixed(1)} MB</small></div>`;};

  window.submitMediaUpload=async function(){
    const input=document.getElementById('uploadFile');const file=input?.files?.[0];if(!file){alert(zh()?'请先选择图片':'Choose an image first');return;}
    const progress=document.getElementById('uploadProgress');progress?.classList.remove('hidden');
    try{
      const compressed=await compressImage(file);
      const payload={student_slug:document.getElementById('uploadStudent').value,kind:document.getElementById('uploadKind').value,session_number:document.getElementById('uploadSession')?.value||null,title:document.getElementById('uploadTitle').value,file_name:file.name,mime_type:compressed.mime_type,data_base64:compressed.data};
      const r=await fetch('/api/upload-media',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`HTTP ${r.status}`);
      alert(zh()?'上传成功，已经绑定到学生档案。':'Upload complete and linked to the student profile.');
      closeModal();
      if(window.connectStudioMemory)await window.connectStudioMemory(false);
    }catch(e){alert(`${zh()?'上传失败':'Upload failed'}: ${e.message}`);}finally{progress?.classList.add('hidden');}
  };
})();
