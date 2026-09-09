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

  window.openMediaUploader=function(){
    const modal=ensureModal();if(!modal)return;
    modal.innerHTML=`<div class="modal-card glass media-upload-card ai-intake-card">
      <div class="eyebrow cyan">AI MEDIA INBOX</div>
      <h2>${zh()?'把素材直接扔给我':'Just drop the files here'}</h2>
      <p class="subtle">${zh()?'不用选学生、不用选第几节课、也不用判断用途。一次可以上传多张图；上传后直接在 ChatGPT 跟我说“处理我刚上传的素材”，剩下的分类、绑定和写回由我处理。':'No student, session or type fields. Upload multiple images at once, then tell ChatGPT “process my latest uploads”; classification and linking happen afterward.'}</p>
      <label class="dropzone ai-dropzone" for="uploadFiles">
        <input id="uploadFiles" type="file" accept="image/*" multiple hidden onchange="previewUploadFiles(this)">
        <div id="uploadPreview"><b>${zh()?'拖入或选择多张图片':'Drop or choose multiple images'}</b><small>${zh()?'JPG / PNG / WebP · 自动压缩 · 私有存储':'JPG / PNG / WebP · auto-compressed · private storage'}</small></div>
      </label>
      <label class="intake-note"><span>${zh()?'可选：一句话告诉我这批素材是什么':'Optional batch note'}</span><textarea id="uploadNote" placeholder="${zh()?'例如：这是 Marcos 前四节课图片和头像。也可以完全不填。':'e.g. Marcos sessions 1–4 plus portrait. You can leave this blank.'}"></textarea></label>
      <div id="uploadProgress" class="upload-progress hidden"><i></i><span id="uploadProgressText">${zh()?'处理中…':'Processing…'}</span></div>
      <div class="intake-hint">${zh()?'上传后，这些文件先进入 AI Media Inbox，不会因为你点错选项而绑错学生。':'Files first land in the AI Media Inbox, so nothing can be misassigned by a wrong dropdown.'}</div>
      <div class="modal-actions"><button class="ghost" onclick="closeModal()">${zh()?'取消':'Cancel'}</button><button class="primary" onclick="submitMediaUpload()">${zh()?'上传这一批':'Upload batch'}</button></div>
    </div>`;
  };

  window.previewUploadFiles=function(input){
    const files=[...(input.files||[])];if(!files.length)return;
    const box=document.getElementById('uploadPreview');
    const items=files.slice(0,8).map(file=>{const url=URL.createObjectURL(file);return `<div class="intake-thumb"><img src="${url}" alt="preview"><small>${file.name}</small></div>`}).join('');
    box.innerHTML=`<div class="intake-preview-grid">${items}</div><b>${files.length} ${zh()?'张图片已选择':'images selected'}</b><small>${zh()?'我会先原样接收，分类留给后续处理。':'They will be ingested first and classified later.'}</small>`;
  };

  window.submitMediaUpload=async function(){
    const input=document.getElementById('uploadFiles');const files=[...(input?.files||[])];if(!files.length){alert(zh()?'请先选择图片':'Choose at least one image');return;}
    const note=document.getElementById('uploadNote')?.value.trim()||'';
    const progress=document.getElementById('uploadProgress');const text=document.getElementById('uploadProgressText');progress?.classList.remove('hidden');
    let done=0;
    try{
      for(const file of files){
        if(text)text.textContent=zh()?`正在上传 ${done+1}/${files.length}…`:`Uploading ${done+1}/${files.length}…`;
        const compressed=await compressImage(file);
        const r=await fetch('/api/upload-intake',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({file_name:file.name,mime_type:compressed.mime_type,data_base64:compressed.data,note})});
        const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`HTTP ${r.status}`);done++;
      }
      alert(zh()?`已收到 ${done} 张图片。现在直接回 ChatGPT 说：“处理我刚上传的素材”。`:`Received ${done} images. Now tell ChatGPT: “process my latest uploads”.`);
      closeModal();
    }catch(e){alert(`${zh()?'上传失败':'Upload failed'} (${done}/${files.length}): ${e.message}`);}finally{progress?.classList.add('hidden');}
  };
})();
