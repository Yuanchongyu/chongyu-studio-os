(()=>{
  const zh=()=>((typeof lang!=='undefined'?lang:'zh')==='zh');
  function ensureModal(){const modal=document.getElementById('modal');if(!modal)return null;modal.classList.remove('hidden');return modal;}
  async function compressImage(file){
    const bitmap=await createImageBitmap(file);
    const max=1800;const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
    const w=Math.max(1,Math.round(bitmap.width*scale));const h=Math.max(1,Math.round(bitmap.height*scale));
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{alpha:true});ctx.drawImage(bitmap,0,0,w,h);bitmap.close?.();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.88));
    if(!blob)throw new Error('Image compression failed.');
    const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);});
    return{data,mime_type:'image/webp',size:blob.size,width:w,height:h};
  }
  function isMp4(file){return file.type==='video/mp4'||/\.mp4$/i.test(file.name||'');}
  function formatBytes(n){if(n<1024*1024)return `${Math.max(1,Math.round(n/1024))} KB`;return `${(n/1024/1024).toFixed(1)} MB`;}

  window.openMediaUploader=function(){
    const modal=ensureModal();if(!modal)return;
    modal.innerHTML=`<div class="modal-card glass media-upload-card ai-intake-card">
      <div class="eyebrow cyan">AI MEDIA INBOX</div>
      <h2>${zh()?'把图片和视频直接扔给我':'Just drop images and videos here'}</h2>
      <p class="subtle">${zh()?'不用选学生、不用选第几节课、也不用判断用途。支持图片和 MP4；上传后直接在 ChatGPT 跟我说“处理我刚上传的素材”，剩下的分类、绑定和写回由我处理。':'No student, session or type fields. Images and MP4 are supported; after upload, tell ChatGPT “process my latest uploads” and classification/linking happens afterward.'}</p>
      <label class="dropzone ai-dropzone" for="uploadFiles">
        <input id="uploadFiles" type="file" accept="image/*,video/mp4,.mp4" multiple hidden onchange="previewUploadFiles(this)">
        <div id="uploadPreview"><b>${zh()?'拖入或选择图片 / MP4 视频':'Drop or choose images / MP4 video'}</b><small>${zh()?'JPG / PNG / WebP / MP4 · 图片自动压缩 · 视频直传私有存储':'JPG / PNG / WebP / MP4 · image auto-compression · direct private video upload'}</small></div>
      </label>
      <label class="intake-note"><span>${zh()?'可选：一句话告诉我这批素材是什么':'Optional batch note'}</span><textarea id="uploadNote" placeholder="${zh()?'例如：这是 Marcos 第 5 节课的数字形象、Kling 视频和个人网站素材。也可以完全不填。':'e.g. Marcos Session 5 avatar, Kling video and personal-site materials. You can leave this blank.'}"></textarea></label>
      <div id="uploadProgress" class="upload-progress hidden"><i></i><span id="uploadProgressText">${zh()?'处理中…':'Processing…'}</span></div>
      <div class="intake-hint">${zh()?'MP4 最大 120 MB。视频会从浏览器直接上传到 Supabase 私有 Storage，不经过 Vercel 大文件中转。':'MP4 up to 120 MB. Video uploads directly from your browser to private Supabase Storage, avoiding the Vercel request-size limit.'}</div>
      <div class="modal-actions"><button class="ghost" onclick="closeModal()">${zh()?'取消':'Cancel'}</button><button class="primary" onclick="submitMediaUpload()">${zh()?'上传这一批':'Upload batch'}</button></div>
    </div>`;
  };

  window.previewUploadFiles=function(input){
    const files=[...(input.files||[])];if(!files.length)return;
    const box=document.getElementById('uploadPreview');
    const items=files.slice(0,8).map(file=>{
      if(isMp4(file)){
        const url=URL.createObjectURL(file);return `<div class="intake-thumb"><video src="${url}" muted playsinline preload="metadata"></video><small>▶ ${file.name} · ${formatBytes(file.size)}</small></div>`;
      }
      const url=URL.createObjectURL(file);return `<div class="intake-thumb"><img src="${url}" alt="preview"><small>${file.name} · ${formatBytes(file.size)}</small></div>`;
    }).join('');
    box.innerHTML=`<div class="intake-preview-grid">${items}</div><b>${files.length} ${zh()?'个素材已选择':'files selected'}</b><small>${zh()?'图片和 MP4 会先进入素材箱，分类留给后续 AI 处理。':'Images and MP4 first land in the media inbox and are classified later by AI.'}</small>`;
  };

  async function uploadImage(file,note){
    const compressed=await compressImage(file);
    const r=await fetch('/api/upload-intake',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({file_name:file.name,mime_type:compressed.mime_type,data_base64:compressed.data,note})});
    const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`HTTP ${r.status}`);return data;
  }

  async function uploadVideo(file,note){
    if(file.size>120*1024*1024)throw new Error(zh()?'MP4 超过 120 MB':'MP4 exceeds 120 MB');
    const sign=await fetch('/api/upload-intake',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create_video_upload',file_name:file.name,mime_type:'video/mp4',size_bytes:file.size,note})});
    const signed=await sign.json().catch(()=>({}));if(!sign.ok)throw new Error(signed.error||`HTTP ${sign.status}`);

    const form=new FormData();
    form.append('cacheControl','3600');
    form.append('',file,file.name);
    const put=await fetch(signed.upload_url,{method:'PUT',headers:{'x-upsert':'false'},body:form});
    if(!put.ok){const detail=await put.text().catch(()=>'');throw new Error(`Video upload ${put.status}${detail?`: ${detail.slice(0,180)}`:''}`);}

    const fin=await fetch('/api/upload-intake',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'finalize_video_upload',file_name:file.name,mime_type:'video/mp4',storage_bucket:signed.storage_bucket,storage_path:signed.storage_path,note})});
    const finalData=await fin.json().catch(()=>({}));if(!fin.ok)throw new Error(finalData.error||`HTTP ${fin.status}`);return finalData;
  }

  window.submitMediaUpload=async function(){
    const input=document.getElementById('uploadFiles');const files=[...(input?.files||[])];if(!files.length){alert(zh()?'请先选择图片或 MP4':'Choose at least one image or MP4');return;}
    const invalid=files.find(f=>!f.type.startsWith('image/')&&!isMp4(f));if(invalid){alert(`${zh()?'暂不支持这个文件类型':'Unsupported file type'}: ${invalid.name}`);return;}
    const note=document.getElementById('uploadNote')?.value.trim()||'';
    const progress=document.getElementById('uploadProgress');const text=document.getElementById('uploadProgressText');progress?.classList.remove('hidden');
    let done=0;
    try{
      for(const file of files){
        if(text)text.textContent=zh()?`正在上传 ${done+1}/${files.length} · ${file.name}`:`Uploading ${done+1}/${files.length} · ${file.name}`;
        if(isMp4(file))await uploadVideo(file,note);else await uploadImage(file,note);
        done++;
      }
      alert(zh()?`已收到 ${done} 个素材。现在直接回 ChatGPT 说：“处理我刚上传的素材”。`:`Received ${done} files. Now tell ChatGPT: “process my latest uploads”.`);
      closeModal();
    }catch(e){console.error('Media upload failed:',e);alert(`${zh()?'上传失败':'Upload failed'} (${done}/${files.length}): ${e.message}`);}finally{progress?.classList.add('hidden');}
  };
})();
