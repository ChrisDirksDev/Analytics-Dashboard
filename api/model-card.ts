import type {VercelRequest,VercelResponse} from '@vercel/node'
import {latestArtifact} from './_analytics'
export default async function handler(req:VercelRequest,res:VercelResponse){if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});try{return res.status(200).json((await latestArtifact()).modelCard)}catch(error){console.error(error);return res.status(503).json({error:'Model metadata unavailable'})}}
