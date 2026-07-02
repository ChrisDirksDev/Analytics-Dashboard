import { getDatabase } from './db'

export type Daily={date:string;country:string;revenue:number;orders:number;customers:number;newCustomers:number;returningCustomers:number}
export type Product={date:string;country:string;stock_code:string;description:string;revenue:number;units:number}
export type Customer={date:string;country:string;invoice:string;customer_id:string;is_new:boolean}
export type Artifact={metadata:Record<string,unknown>;daily:Daily[];products:Product[];customers:Customer[];forecasts:unknown[];anomalies:Array<{date:string}>;insights:unknown[];modelCard:Record<string,unknown>}
export async function latestArtifact():Promise<Artifact>{const db=await getDatabase();const document=await db.collection<{payload:Artifact}>('analytics_artifacts').findOne({}, {sort:{generatedAt:-1},projection:{payload:1}});if(!document)throw new Error('ARTIFACT_UNAVAILABLE');return document.payload}
const sum=<T>(rows:T[],pick:(row:T)=>number)=>rows.reduce((total,row)=>total+pick(row),0)
const round=(value:number)=>Math.round(value*100)/100
const validDate=(value:unknown,fallback:string)=>{if(value===undefined)return fallback;if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(Date.parse(value)))throw new Error('INVALID_DATE');return value}

export function dashboardPayload(data:Artifact,queryParams:Record<string,string|string[]|undefined>){
 const min=String(data.metadata.startDate),max=String(data.metadata.endDate),from=validDate(queryParams.from,min),to=validDate(queryParams.to,max)
 if(from>to||from<min||to>max)throw new Error('INVALID_RANGE')
 const countries=[...new Set(data.daily.map(row=>row.country))].sort(),requested=typeof queryParams.country==='string'?queryParams.country:'All',country=requested==='All'?null:requested
 if(country&&!countries.includes(country))throw new Error('INVALID_COUNTRY')
 const match=(row:{date:string;country:string})=>row.date>=from&&row.date<=to&&(!country||row.country===country)
 const selected=data.daily.filter(match);if(!selected.length)throw new Error('EMPTY')
 const days=Math.round((Date.parse(to)-Date.parse(from))/86400000)+1,previousTo=new Date(Date.parse(from)-86400000).toISOString().slice(0,10),previousFrom=new Date(Date.parse(from)-days*86400000).toISOString().slice(0,10)
 const previous=data.daily.filter(row=>row.date>=previousFrom&&row.date<=previousTo&&(!country||row.country===country)),customersNow=data.customers.filter(match),customersBefore=data.customers.filter(row=>row.date>=previousFrom&&row.date<=previousTo&&(!country||row.country===country))
 const aggregate=(rows:Daily[],people:Customer[])=>{const revenue=sum(rows,r=>r.revenue),orders=sum(rows,r=>r.orders);return{revenue,orders,customers:new Set(people.map(r=>r.customer_id)).size,averageOrderValue:orders?revenue/orders:0}}
 const current=aggregate(selected,customersNow),before=aggregate(previous,customersBefore),pct=(a:number,b:number)=>b?(a-b)/b*100:null
 const dates=new Map<string,{date:string;revenue:number}>();selected.forEach(row=>{const value=dates.get(row.date)||{date:row.date,revenue:0};value.revenue+=row.revenue;dates.set(row.date,value)})
 const markets=new Map<string,{country:string;revenue:number;orders:number}>();selected.forEach(row=>{const value=markets.get(row.country)||{country:row.country,revenue:0,orders:0};value.revenue+=row.revenue;value.orders+=row.orders;markets.set(row.country,value)})
 const products=new Map<string,{stockCode:string;name:string;revenue:number;units:number}>();data.products.filter(match).forEach(row=>{const value=products.get(row.stock_code)||{stockCode:row.stock_code,name:row.description,revenue:0,units:0};value.revenue+=row.revenue;value.units+=row.units;products.set(row.stock_code,value)})
 const full=from===min&&to===max&&!country
 return{meta:{...data.metadata,from,to,country:country||'All',isStale:false},filters:{countries},kpis:(['revenue','orders','customers','averageOrderValue'] as const).map(key=>({key,value:round(current[key]),comparisonPercent:previous.length?pct(current[key],before[key]):null})),revenueSeries:[...dates.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(x=>({...x,revenue:round(x.revenue)})),forecasts:full?data.forecasts:[],anomalies:country?[]:data.anomalies.filter(row=>row.date>=from&&row.date<=to),countries:[...markets.values()].sort((a,b)=>b.revenue-a.revenue).slice(0,8),customerMix:{new:customersNow.filter(x=>x.is_new).length,returning:customersNow.filter(x=>!x.is_new).length},products:[...products.values()].sort((a,b)=>b.revenue-a.revenue).slice(0,8),insights:full?data.insights:[]}
}
