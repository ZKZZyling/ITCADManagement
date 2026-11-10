import test from 'node:test';
import assert from 'node:assert/strict';
import {makeBaseline,validateBaseline,parseSurveyLength,formatSurveyLength,solveLaserPoint,measurePlanPoint,validateSavedSurvey} from '../client/machine-survey.mjs';
const view={id:'floor-1',kind:'floor-plan',width:1000,height:2000,drawableHeight:1800,sourceImageSHA256:'a'.repeat(64)};
const proof={nameA:'Column A',nameB:'Column B',by:'Surveyor',instrument:'Manual laser',instrumentReference:'rear',horizontalConfirmed:true,source:'Measured between column center marks',at:'2026-11-10T00:00:00.000Z'};
const b=()=>makeBaseline(view,{...proof,a:[.2,.5],b:[.8,.5],distance:6000,unit:'mm'});
const observed=(more={})=>({distanceA:5000,distanceB:5000,unit:'mm',side:'left',horizontalConfirmed:true,instrumentReference:'rear',...more});
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} != ${expected}`);
test('independent 6-5-5 triangle oracle chooses visual left/right in non-square image',()=>{
 const baseline=b(),left=solveLaserPoint(view,baseline,observed()),right=solveLaserPoint(view,baseline,observed({side:'right'}));
 near(left.anchor[0],.5);near(left.anchor[1],.3);near(right.anchor[0],.5);near(right.anchor[1],.7);
 near(left.alongMm,3000);near(left.leftMm,4000);near(right.leftMm,-4000);assert.equal(left.unit,'mm');
 // A different orthogonal 3-4-5 oracle, not a copied solver formula.
 const baseline2=makeBaseline(view,{...proof,a:[.2,.5],b:[.6,.5],distance:4000,unit:'mm'});
 const p=solveLaserPoint(view,baseline2,observed({distanceA:3000,distanceB:5000}));near(p.anchor[0],.2);near(p.anchor[1],.35);
});
test('rotated baseline left is image east when A->B points down',()=>{
 const baseline=makeBaseline(view,{...proof,a:[.5,.2],b:[.5,.5],distance:6,unit:'m'});
 const p=solveLaserPoint(view,baseline,observed({distanceA:5,distanceB:5,unit:'m'}));near(p.anchor[0],.9);near(p.anchor[1],.35);near(p.leftMm,4000);
});
test('plan target distances are distinct calculated values and measured inverse returns target',()=>{
 const baseline=b(),target=[.5,.3],calculated=measurePlanPoint(view,baseline,target);
 assert.equal(calculated.source,'plan-derived');near(calculated.distanceAMm,5000);near(calculated.distanceBMm,5000);assert.equal(calculated.side,'left');
 const actual=solveLaserPoint(view,baseline,observed({distanceA:calculated.distanceAMm,distanceB:calculated.distanceBMm,side:calculated.side}));near(actual.anchor[0],target[0]);near(actual.anchor[1],target[1]);assert.equal(actual.source,'manual-laser');
 const record={source:'plan-target',baselineSnapshot:baseline,entered:{targetAnchor:target},result:calculated};assert.equal(validateSavedSurvey(view,record),record);
});
test('mm cm m normalize equally; comma decimal requires explicit separator and no grouping',()=>{
 assert.equal(parseSurveyLength('1.25','m'),1250);assert.equal(parseSurveyLength('125','cm'),1250);assert.equal(parseSurveyLength(1250,'mm'),1250);
 assert.equal(parseSurveyLength('1,25','m',','),1250);assert.throws(()=>parseSurveyLength('1,25','m'));assert.throws(()=>parseSurveyLength('1,234,567','mm',','));
 assert.equal(formatSurveyLength(1250,'m',3),'1.250 m');assert.equal(formatSurveyLength(-25,'cm',1),'-2.5 cm');
 for(const value of [0,-1,Infinity,NaN,'','1e3','0x10','3 mm','1 000'])assert.throws(()=>parseSurveyLength(value,'mm'));
 assert.throws(()=>parseSurveyLength(1,'inch'));assert.throws(()=>formatSurveyLength(1,'unknown'));
 const baseline=b(),m=solveLaserPoint(view,baseline,observed({distanceA:5,distanceB:5,unit:'m'})),cm=solveLaserPoint(view,baseline,observed({distanceA:500,distanceB:500,unit:'cm'}));assert.deepEqual(m.anchor,cm.anchor);
});
test('side, horizontal plane, instrument reference and valid triangle are mandatory',()=>{
 const baseline=b();for(const side of [undefined,'','auto','on-baseline'])assert.throws(()=>solveLaserPoint(view,baseline,observed({side})));
 for(const [distanceA,distanceB] of [[1,1],[3000,3000],[8000,2000],[0,6000],[Infinity,5000]])assert.throws(()=>solveLaserPoint(view,baseline,observed({distanceA,distanceB})));
 assert.throws(()=>solveLaserPoint(view,baseline,observed({horizontalConfirmed:false})));assert.throws(()=>solveLaserPoint(view,baseline,observed({instrumentReference:'front'})));
 assert.throws(()=>makeBaseline(view,{...proof,horizontalConfirmed:false,a:[.2,.5],b:[.8,.5],distance:6,unit:'m'}));
 assert.throws(()=>makeBaseline(view,{...proof,instrumentReference:'',a:[.2,.5],b:[.8,.5],distance:6,unit:'m'}));
});
test('schematic/footer/outside targets and coincident baselines are rejected',()=>{
 assert.throws(()=>makeBaseline({...view,kind:'schematic-reference'},{...proof,a:[.2,.5],b:[.8,.5],distance:6,unit:'m'}));
 for(const p of [[.2,.95],[-.1,.5],[.2,NaN]])assert.throws(()=>makeBaseline(view,{...proof,a:p,b:[.8,.5],distance:6,unit:'m'}));
 assert.throws(()=>makeBaseline(view,{...proof,a:[.2,.5],b:[.2,.5],distance:6,unit:'m'}));
 assert.throws(()=>solveLaserPoint(view,b(),observed({distanceA:10000,distanceB:10000,side:'right'})));
 assert.throws(()=>measurePlanPoint(view,b(),[.5,.91]));
});
test('optional third check reports residual without invented pass/tolerance',()=>{
 const r=solveLaserPoint(view,b(),observed({checkC:{point:[.5,.5],distance:3900,unit:'mm'}}));
 near(r.checkC.calculatedMm,4000);near(r.checkC.residualMm,100);assert.equal(r.checkC.pass,undefined);assert.equal(r.checkC.tolerance,undefined);
 assert.throws(()=>solveLaserPoint(view,b(),observed({checkC:{point:[.5,.99],distance:4000,unit:'mm'}})));
});
test('saved survey rejects altered image binding, scale, results, side and third check',()=>{
 const baseline=b(),entered=observed({checkC:{point:[.5,.5],distance:4,unit:'m'}}),r={source:'manual-laser',baselineSnapshot:baseline,entered,result:solveLaserPoint(view,baseline,entered)};
 assert.equal(validateSavedSurvey(view,r),r);assert.equal(validateBaseline(view,baseline),baseline);
 for(const v of [{...view,id:'floor-2'},{...view,width:2000},{...view,sourceImageSHA256:'b'.repeat(64)},{...view,drawableHeight:1700}])assert.throws(()=>validateSavedSurvey(v,r));
 for(const mutate of [q=>q.result.anchor[0]+=.01,q=>q.result.distanceAMm+=1,q=>q.result.side='right',q=>q.result.checkC.residualMm=100,q=>q.baselineSnapshot.mmPerPixel=42]){const q=structuredClone(r);mutate(q);assert.throws(()=>validateSavedSurvey(view,q));}
});
