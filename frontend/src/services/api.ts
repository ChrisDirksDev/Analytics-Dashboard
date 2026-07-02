import type {DashboardData,ModelCard} from '../types'
const base=import.meta.env.VITE_API_URL||'/api'
async function request<T>(path:string,params?:Record<string,string|undefined>):Promise<T>{const query=params?`?${new URLSearchParams(Object.entries(params).filter((entry):entry is [string,string]=>Boolean(entry[1]))).toString()}`:'';const response=await fetch(`${base}${path}${query}`,{headers:{Accept:'application/json'}});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||`Request failed (${response.status})`);return body}
export const getDashboard=(filters?:{from?:string;to?:string;country?:string})=>request<DashboardData>('/dashboard',filters)
export const getModelCard=()=>request<ModelCard>('/model-card')
export const errorMessage=(error:unknown)=>error instanceof Error?error.message:'Something went wrong'
