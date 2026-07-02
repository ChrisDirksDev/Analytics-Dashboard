export type KpiKey = 'revenue' | 'orders' | 'customers' | 'averageOrderValue'
export interface DashboardData {
  meta: { name:string; doi:string; license:string; sourceUrl:string; startDate:string; endDate:string; from:string; to:string; country:string; generatedAt:string; cleanTransactions:number; isStale:boolean }
  filters: { countries:string[] }
  kpis: Array<{key:KpiKey;value:number;comparisonPercent:number|null}>
  revenueSeries:Array<{date:string;revenue:number}>
  forecasts:Array<{date:string;predicted:number;lowerBound:number;upperBound:number}>
  anomalies:Array<{date:string;observed:number;expected:number;deviationPercent:number;severity:'medium'|'high';method:string}>
  countries:Array<{country:string;revenue:number;orders:number}>
  customerMix:{new:number;returning:number}
  products:Array<{stockCode:string;name:string;revenue:number;units:number}>
  insights:Array<{id:string;kind:'trend'|'anomaly'|'forecast';title:string;summary:string;evidence:string;period:string;modelVersion:string}>
}
export interface ModelCard { version:string;algorithm:string;trainingWindow:string;forecastHorizonDays:number;mae:number;wape:number;baselineMae:number;baselineWape:number;lastTrainedAt:string;baseline:string;limitations:string[] }
