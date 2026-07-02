import type {VercelRequest,VercelResponse} from '@vercel/node'
import {dashboardPayload,latestArtifact} from './_analytics'
export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'})
 try{return res.status(200).json(dashboardPayload(await latestArtifact(),req.query))}catch(error){const code=error instanceof Error?error.message:'';if(code==='ARTIFACT_UNAVAILABLE')return res.status(503).json({error:'Analytics artifact unavailable'});if(code==='EMPTY')return res.status(404).json({error:'No transactions match these filters'});if(code.startsWith('INVALID_'))return res.status(400).json({error:'Invalid dashboard filters'});console.error(error);return res.status(500).json({error:'Internal server error'})}
}
