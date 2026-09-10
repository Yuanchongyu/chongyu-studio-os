import { runLessonWorkflow } from '../lib/lesson-workflow.js';

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed.'});
  const expected=process.env.STUDIO_ACCESS_TOKEN||'';
  const supplied=req.headers['x-studio-access-token']||'';
  if(!expected||supplied!==expected)return res.status(401).json({error:'Studio access token is missing or invalid.'});
  try{
    const rawNote=String(req.body?.raw_note||'').trim();
    if(!rawNote)return res.status(400).json({error:'raw_note is required.'});
    const result=await runLessonWorkflow(rawNote,{force:Boolean(req.body?.force)});
    return res.status(200).json({ok:true,...result});
  }catch(error){
    console.error('Post-class workflow failed',error);
    return res.status(500).json({error:error.message||'Post-class workflow failed.'});
  }
}
