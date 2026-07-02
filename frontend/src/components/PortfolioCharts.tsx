import { Bar, Line } from 'react-chartjs-2'
import { Chart as ChartJS,CategoryScale,LinearScale,PointElement,LineElement,BarElement,Tooltip,Legend,Filler } from 'chart.js'
import { useTheme } from '../contexts/ThemeContext'
import type { DashboardData } from '../types'
ChartJS.register(CategoryScale,LinearScale,PointElement,LineElement,BarElement,Tooltip,Legend,Filler)

const money=(value:number)=>`£${Intl.NumberFormat('en-GB',{notation:'compact'}).format(value)}`
export function RevenueChart({data}:{data:DashboardData}){
 const {theme}=useTheme(), dark=theme==='dark', labels=[...data.revenueSeries.map(x=>x.date),...data.forecasts.map(x=>x.date)]
 const actual=new Map(data.revenueSeries.map(x=>[x.date,x.revenue])), forecast=new Map(data.forecasts.map(x=>[x.date,x])), anomalies=new Map(data.anomalies.map(x=>[x.date,x.observed]))
 const options={responsive:true,maintainAspectRatio:false,interaction:{intersect:false,mode:'index' as const},plugins:{legend:{position:'bottom' as const,labels:{color:dark?'#d4d4d0':'#55554f',usePointStyle:true}},tooltip:{callbacks:{label:(ctx:{dataset:{label?:string};parsed:{y:number|null}})=>`${ctx.dataset.label}: ${ctx.parsed.y==null?'—':money(ctx.parsed.y)}`}}},scales:{x:{grid:{display:false},ticks:{color:dark?'#8f8f89':'#77776f',maxTicksLimit:8}},y:{grid:{color:dark?'#2d2e2b':'#e8e7e1'},ticks:{color:dark?'#8f8f89':'#77776f',callback:(v:string|number)=>money(Number(v))}}}}
 const chart={labels,datasets:[
  {label:'Revenue',data:labels.map(d=>actual.get(d)??null),borderColor:'#166b53',backgroundColor:'rgba(22,107,83,.10)',fill:true,tension:.25,pointRadius:0},
  {label:'30-day forecast',data:labels.map(d=>forecast.get(d)?.predicted??null),borderColor:'#b66b2c',borderDash:[5,5],backgroundColor:'transparent',pointRadius:0,tension:.25},
  {label:'90% interval',data:labels.map(d=>forecast.get(d)?.upperBound??null),borderColor:'transparent',backgroundColor:'rgba(182,107,44,.12)',fill:'+1',pointRadius:0},
  {label:'Lower interval',data:labels.map(d=>forecast.get(d)?.lowerBound??null),borderColor:'transparent',backgroundColor:'transparent',pointRadius:0},
  {label:'Anomaly',data:labels.map(d=>anomalies.get(d)??null),borderColor:'#b63b32',backgroundColor:'#b63b32',pointRadius:5,showLine:false}
 ]}
 return <div className="chart-frame"><Line data={chart} options={options}/></div>
}
export function CountryChart({rows}:{rows:DashboardData['countries']}){
 const {theme}=useTheme(),dark=theme==='dark'
 return <div className="chart-frame chart-small"><Bar data={{labels:rows.map(x=>x.country),datasets:[{label:'Revenue',data:rows.map(x=>x.revenue),backgroundColor:'#2f7d67',borderRadius:4}]}} options={{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:dark?'#2d2e2b':'#e8e7e1'},ticks:{color:dark?'#aaa':'#666',callback:(v)=>money(Number(v))}},y:{grid:{display:false},ticks:{color:dark?'#d4d4d0':'#444'}}}}}/></div>
}
