import assert from 'node:assert/strict'
import test from 'node:test'
import {dashboardPayload, type Artifact} from './_analytics'

const artifact:Artifact={
 metadata:{startDate:'2011-01-01',endDate:'2011-01-02',generatedAt:'2011-01-02T00:00:00Z'},
 daily:[{date:'2011-01-01',country:'UK',revenue:100,orders:2,customers:1,newCustomers:1,returningCustomers:0},{date:'2011-01-02',country:'UK',revenue:150,orders:3,customers:1,newCustomers:0,returningCustomers:1}],
 products:[{date:'2011-01-01',country:'UK',stock_code:'A',description:'Product A',revenue:100,units:2}],
 customers:[{date:'2011-01-01',country:'UK',invoice:'1',customer_id:'10',is_new:true},{date:'2011-01-02',country:'UK',invoice:'2',customer_id:'10',is_new:false}],
 forecasts:[{date:'2011-01-03',predicted:120,lowerBound:90,upperBound:150}],anomalies:[{date:'2011-01-01'}],insights:[],modelCard:{}
}
test('dashboard totals reconcile and full view includes model signals',()=>{const result=dashboardPayload(artifact,{}) as any;assert.equal(result.kpis[0].value,250);assert.equal(result.kpis[1].value,5);assert.equal(result.kpis[2].value,1);assert.equal(result.forecasts.length,1);assert.equal(result.anomalies.length,1)})
test('filtered slices withhold unvalidated forecast',()=>{const result=dashboardPayload(artifact,{from:'2011-01-01',to:'2011-01-01'}) as any;assert.equal(result.forecasts.length,0);assert.equal(result.kpis[0].value,100)})
test('market slices withhold anomalies detected on aggregate revenue',()=>{const result=dashboardPayload(artifact,{country:'UK'}) as any;assert.equal(result.anomalies.length,0)})
test('invalid ranges are rejected',()=>assert.throws(()=>dashboardPayload(artifact,{from:'2012-01-01'}),/INVALID_RANGE/))
