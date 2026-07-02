import http from 'http'
import cors from 'cors'
import dotenv from 'dotenv'
import express, { NextFunction, Request, Response } from 'express'
import { initializeDatabase, pool, query } from './database/connection'

dotenv.config()
const app = express()
const port = Number(process.env.PORT || 5000)
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }))
app.use(express.json({ limit: '1mb' }))

type Daily = { date:string; country:string; revenue:number; orders:number; customers:number; newCustomers:number; returningCustomers:number }
type Product = { date:string; country:string; stock_code:string; description:string; revenue:number; units:number }
type Customer = { date:string;country:string;invoice:string;customer_id:string;is_new:boolean }
type Artifact = { metadata:Record<string, unknown>; daily:Daily[]; products:Product[]; customers:Customer[]; forecasts:unknown[]; anomalies:Array<{date:string}>; insights:unknown[]; modelCard:Record<string, unknown> }

async function artifact(): Promise<Artifact> {
  const result = await query('SELECT payload FROM analytics_artifacts ORDER BY generated_at DESC LIMIT 1')
  if (!result.rowCount) throw Object.assign(new Error('Analytics artifact unavailable'), { status: 503 })
  return result.rows[0].payload as Artifact
}

function dateValue(value: unknown, fallback: string): string {
  if (value === undefined) return fallback
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)))
    throw Object.assign(new Error('Dates must use YYYY-MM-DD'), { status: 400 })
  return value
}

function pct(current:number, previous:number) { return previous ? (current - previous) / previous * 100 : null }
function round(value:number, places=2) { const power=10**places; return Math.round(value*power)/power }
function sum<T>(rows:T[], pick:(row:T)=>number) { return rows.reduce((total,row)=>total+pick(row),0) }

async function dashboard(req:Request, res:Response) {
  const data = await artifact()
  const min = String(data.metadata.startDate), max = String(data.metadata.endDate)
  const from = dateValue(req.query.from, min), to = dateValue(req.query.to, max)
  if (from > to || from < min || to > max) return res.status(400).json({ error: `Date range must be between ${min} and ${max}` })
  const countries = [...new Set(data.daily.map(row=>row.country))].sort()
  const country = typeof req.query.country === 'string' && req.query.country !== 'All' ? req.query.country : null
  if (country && !countries.includes(country)) return res.status(400).json({ error: 'Unknown country' })
  const selected = data.daily.filter(row=>row.date>=from && row.date<=to && (!country || row.country===country))
  if (!selected.length) return res.status(404).json({ error:'No transactions match these filters' })
  const days = Math.round((Date.parse(to)-Date.parse(from))/86400000)+1
  const previousTo = new Date(Date.parse(from)-86400000).toISOString().slice(0,10)
  const previousFrom = new Date(Date.parse(from)-days*86400000).toISOString().slice(0,10)
  const previous = data.daily.filter(row=>row.date>=previousFrom && row.date<=previousTo && (!country || row.country===country))
  const customerRows = data.customers.filter(row=>row.date>=from&&row.date<=to&&(!country||row.country===country))
  const previousCustomerRows = data.customers.filter(row=>row.date>=previousFrom&&row.date<=previousTo&&(!country||row.country===country))
  const aggregate = (rows:Daily[], people:Customer[]) => {
    const revenue=sum(rows,r=>r.revenue), orders=sum(rows,r=>r.orders)
    return { revenue, orders, customers:new Set(people.map(r=>r.customer_id)).size, averageOrderValue:orders?revenue/orders:0 }
  }
  const current=aggregate(selected,customerRows), before=aggregate(previous,previousCustomerRows)
  const kpis = (['revenue','orders','customers','averageOrderValue'] as const).map(key=>({ key, value:round(current[key]), comparisonPercent:previous.length?pct(current[key],before[key]):null }))
  const byDate = new Map<string,Daily>()
  selected.forEach(row=>{ const current=byDate.get(row.date)||{date:row.date,country:'',revenue:0,orders:0,customers:0,newCustomers:0,returningCustomers:0}; Object.keys(current).forEach(()=>{}); current.revenue+=row.revenue; current.orders+=row.orders; current.customers+=row.customers; current.newCustomers+=row.newCustomers; current.returningCustomers+=row.returningCustomers; byDate.set(row.date,current) })
  const byCountry = new Map<string,{country:string;revenue:number;orders:number}>()
  data.daily.filter(row=>row.date>=from&&row.date<=to&&(!country||row.country===country)).forEach(row=>{const value=byCountry.get(row.country)||{country:row.country,revenue:0,orders:0};value.revenue+=row.revenue;value.orders+=row.orders;byCountry.set(row.country,value)})
  const productMap = new Map<string,{stockCode:string;name:string;revenue:number;units:number}>()
  data.products.filter(row=>row.date>=from&&row.date<=to&&(!country||row.country===country)).forEach(row=>{const value=productMap.get(row.stock_code)||{stockCode:row.stock_code,name:row.description,revenue:0,units:0};value.revenue+=row.revenue;value.units+=row.units;productMap.set(row.stock_code,value)})
  const fullRange = from===min && to===max && !country
  res.json({ meta:{...data.metadata,from,to,country:country||'All',generatedAt:data.metadata.generatedAt,isStale:false}, filters:{countries}, kpis,
    revenueSeries:[...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(({date,revenue})=>({date,revenue:round(revenue)})),
    forecasts:fullRange?data.forecasts:[], anomalies:data.anomalies.filter(row=>row.date>=from&&row.date<=to),
    countries:[...byCountry.values()].sort((a,b)=>b.revenue-a.revenue).slice(0,8).map(row=>({...row,revenue:round(row.revenue)})),
    customerMix:{new:customerRows.filter(r=>r.is_new).length,returning:customerRows.filter(r=>!r.is_new).length},
    products:[...productMap.values()].sort((a,b)=>b.revenue-a.revenue).slice(0,8).map(row=>({...row,revenue:round(row.revenue)})),
    insights:fullRange?data.insights:[] })
}

const asyncRoute=(handler:(req:Request,res:Response)=>Promise<unknown>)=>(req:Request,res:Response,next:NextFunction)=>Promise.resolve(handler(req,res)).catch(next)
app.get('/health',(_req,res)=>res.json({status:'ok',service:'api'}))
app.get('/api/health',(_req,res)=>res.json({status:'ok',service:'api'}))
app.get('/api/dashboard',asyncRoute(dashboard))
app.get('/api/model-card',asyncRoute(async(_req,res)=>res.json((await artifact()).modelCard)))
app.use('/api',(_req,res)=>res.status(404).json({error:'Endpoint not found'}))
app.use((error:Error&{status?:number},_req:Request,res:Response,_next:NextFunction)=>{console.error(error);res.status(error.status||500).json({error:error.status?error.message:'Internal server error'})})

let server:http.Server
initializeDatabase().then(()=>{server=app.listen(port,()=>console.log(`API listening on http://localhost:${port}`))}).catch(()=>process.exit(1))
async function shutdown(){if(server)await new Promise<void>(resolve=>server.close(()=>resolve()));await pool.end();process.exit(0)}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown)
