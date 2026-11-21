import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, Users, DollarSign, Calendar, Globe, Shield, Sparkles, PieChart, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const S11_ImpactScreen: React.FC = () => {
  const { setScreen, activeLearner } = useApp();
  const [activeTab, setActiveTab] = useState<'kpis' | 'unit_economics' | 'pilot_plan' | 'slide'>('kpis');

  // Interactive unit economics calculator state
  const [learnerScale, setLearnerScale] = useState<number>(500);
  const [offlineCachePercent, setOfflineCachePercent] = useState<number>(80);

  // Economic assumptions:
  // Inference: 20 sessions/mo x 2 AI doubts/session = 40 doubts.
  // With 80% answered offline/cached, only 8 online AI calls/mo.
  // Model inference cost per 1k tokens = ₹0.15. 1 doubt ~ 300 tokens = ₹0.045.
  // Online inference = 8 x 0.045 = ₹0.36 / learner / mo.
  // Cloudflare CDN + DB = ₹2.00 / learner / mo.
  // Field partner / Volunteer upkeep share = ₹15.00 / learner / mo.
  const onlineInferencePerLearner = (1 - offlineCachePercent / 100) * 40 * 0.05;
  const hostingPerLearner = 2.0;
  const volunteerPartnerShare = 15.0;
  const totalCostPerLearner = Math.round((onlineInferencePerLearner + hostingPerLearner + volunteerPartnerShare) * 10) / 10;
  const totalMonthlySponsorship = Math.round(learnerScale * totalCostPerLearner);

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col pb-8">
      {/* Header */}
      <header className="bg-indigo-brand text-white px-4 py-3 shadow-md sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScreen(activeLearner ? 'S3_HOME' : 'S1_PICKER')}
              className="p-2 rounded-xl bg-indigo-light hover:bg-indigo-dark text-white active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="font-bold text-base block leading-tight">స్పాన్సర్ & ఇంపాక్ట్ డాష్‌బోర్డ్</span>
              <span className="text-[11px] text-amber-300">Vidyapath Impact & Business Viability</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 flex flex-col gap-4">
        {/* Tab Navigation */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
          {[
            { id: 'kpis', label: 'సమిష్టి గణాంకాలు (KPIs)' },
            { id: 'unit_economics', label: 'ఖర్చు మోడల్' },
            { id: 'pilot_plan', label: 'పైలట్ ప్లాన్' },
            { id: 'slide', label: 'బిజినెస్ స్లైడ్' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all text-center whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-brand text-amber-300 shadow-xs'
                  : 'text-slate-600 hover:text-indigo-brand'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Live Cohort KPIs */}
        {activeTab === 'kpis' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-5 border-2 border-indigo-100 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="font-bold text-sm text-indigo-brand">
                    చిత్తూరు జిల్లా పైలట్ గ్రూప్ (Chittoor District Cohort)
                  </h3>
                  <p className="text-xs text-slate-500">స్పాన్సర్: ACE CSR Foundation (B2B2C)</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  లైవ్ డేటా
                </span>
              </div>

              {/* KPI Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-cream-50 p-3 rounded-2xl border border-cream-200">
                  <div className="text-xs text-slate-500 font-semibold">క్రియాశీల విద్యార్థులు</div>
                  <div className="text-2xl font-black text-indigo-brand mt-0.5">124</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-1">గోప్యత: కనీసం 5గురు ✓</div>
                </div>

                <div className="bg-cream-50 p-3 rounded-2xl border border-cream-200">
                  <div className="text-xs text-slate-500 font-semibold">సగటు నైపుణ్య పెరుగుదల</div>
                  <div className="text-2xl font-black text-emerald-600 mt-0.5">+41.5%</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-1">గత 4 వారాల్లో</div>
                </div>

                <div className="bg-cream-50 p-3 rounded-2xl border border-cream-200">
                  <div className="text-xs text-slate-500 font-semibold">ఆఫ్‌లైన్ సాధన శాతం</div>
                  <div className="text-2xl font-black text-amber-600 mt-0.5">78.2%</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-1">జీరో డేటా ఖర్చుతో</div>
                </div>

                <div className="bg-cream-50 p-3 rounded-2xl border border-cream-200">
                  <div className="text-xs text-slate-500 font-semibold">నెలవారీ ఖర్చు / విద్యార్థి</div>
                  <div className="text-2xl font-black text-indigo-brand mt-0.5">₹18.50</div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-1">అత్యల్ప యూనిట్ వ్యయం</div>
                </div>
              </div>
            </div>

            {/* Cohort Weak Topics (Helps NGOs deploy targeted teachers) */}
            <div className="bg-white rounded-3xl p-5 border-2 border-amber-200 shadow-xs">
              <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span>గ్రూప్‌లో విద్యార్థులు ఎక్కువ తప్పులు చేసిన అంశాలు (Weak Topics):</span>
              </h4>
              <div className="space-y-2">
                {[
                  { topic: 'అంతమయ్యే దశాంశాలు (Terminating Decimals)', rate: 34 },
                  { topic: 'సమితుల భేదం (Difference A - B)', rate: 29 },
                  { topic: 'యూక్లిడ్ శేష న్యాయం (Euclid Division Lemma)', rate: 22 },
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-800">{item.topic}</span>
                      <span className="text-coral-brand">{item.rate}% తప్పు రేటు</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-coral-brand h-full rounded-full"
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-3 italic">
                * ఈ నివేదిక ఆధారంగా NGO వాలంటీర్లు ఆయా అంశాలపై ప్రత్యేక శ్రద్ధ వహించవచ్చు.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: Unit Economics & Explicit Assumptions */}
        {activeTab === 'unit_economics' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-5 border-2 border-indigo-100 shadow-xs">
              <h3 className="font-bold text-sm text-indigo-brand mb-1">
                యూనిట్ ఎకనామిక్స్ కాలిక్యులేటర్ (Interactive Model)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                స్పష్టమైన అంచనాలు (Explicit Assumptions) & సమీకరణాలు
              </p>

              {/* Slider 1: Number of Active Learners */}
              <div className="mb-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex justify-between text-xs font-bold text-slate-800 mb-2">
                  <span>క్రియాశీల విద్యార్థుల సంఖ్య:</span>
                  <span className="text-indigo-brand text-sm">{learnerScale} మంది</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="5000"
                  step="50"
                  value={learnerScale}
                  onChange={(e) => setLearnerScale(Number(e.target.value))}
                  className="w-full accent-indigo-brand cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>50</span>
                  <span>1000</span>
                  <span>5000</span>
                </div>
              </div>

              {/* Slider 2: Offline / Common Doubts Resolution % */}
              <div className="mb-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex justify-between text-xs font-bold text-slate-800 mb-2">
                  <span>ఆఫ్‌లైన్ కాష్ / కామన్ డౌట్స్ పరిష్కార శాతం:</span>
                  <span className="text-emerald-700 text-sm">{offlineCachePercent}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="95"
                  step="5"
                  value={offlineCachePercent}
                  onChange={(e) => setOfflineCachePercent(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  ఆఫ్‌లైన్ కాష్ పెరిగే కొద్దీ సర్వర్ AI ఖర్చు 80% తగ్గుతుంది.
                </p>
              </div>

              {/* Cost Breakdown Table */}
              <div className="bg-cream-50 p-4 rounded-2xl border border-cream-200 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-cream-200/80">
                  <span className="text-slate-600">AI మోడల్ ఇన్ఫరెన్స్ (క్లౌడ్ API):</span>
                  <span className="font-bold text-slate-900">₹{onlineInferencePerLearner.toFixed(2)} / విద్యార్థి</span>
                </div>
                <div className="flex justify-between py-1 border-b border-cream-200/80">
                  <span className="text-slate-600">హోస్టింగ్ & సింక్ ఆర్కిటెక్చర్:</span>
                  <span className="font-bold text-slate-900">₹{hostingPerLearner.toFixed(2)} / విద్యార్థి</span>
                </div>
                <div className="flex justify-between py-1 border-b border-cream-200/80">
                  <span className="text-slate-600">ఫీల్డ్ సపోర్ట్ & కంటెంట్ నిర్వహణ:</span>
                  <span className="font-bold text-slate-900">₹{volunteerPartnerShare.toFixed(2)} / విద్యార్థి</span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-black text-indigo-brand">
                  <span>మొత్తం ఖర్చు / విద్యార్థి / నెల:</span>
                  <span className="text-emerald-700">₹{totalCostPerLearner} / నెల</span>
                </div>
              </div>

              {/* Total Monthly Sponsorship Estimate */}
              <div className="mt-4 p-4 rounded-2xl bg-indigo-brand text-white flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-xs text-amber-300 font-semibold">{learnerScale} మంది విద్యార్థులకు మొత్తం స్పాన్సర్‌షిప్:</div>
                  <div className="text-2xl font-black mt-0.5">₹{totalMonthlySponsorship.toLocaleString('en-IN')} / నెల</div>
                </div>
                <DollarSign className="w-8 h-8 text-amber-400" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 8-Week Pilot Plan & Scaling */}
        {activeTab === 'pilot_plan' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-5 border-2 border-indigo-100 shadow-xs">
              <h3 className="font-bold text-sm text-indigo-brand mb-1">
                8-వారాల గ్రౌండ్ పైలట్ ప్లాన్ (Pilot Implementation)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                1 జిల్లా · 100 మంది విద్యార్థులు · భాగస్వామ్య NGO ద్వారా పరీక్ష
              </p>

              <div className="space-y-3">
                {[
                  {
                    week: 'వారం 1-2: ప్రి-టెస్ట్ & ఆన్‌బోర్డింగ్',
                    desc: '100 మంది ప్రభుత్వ పాఠశాల విద్యార్థులకు బేస్‌లైన్ గణిత పరీక్ష. ఉమ్మడి ఫోన్లలో యాప్ ఇన్‌స్టాలేషన్.',
                  },
                  {
                    week: 'వారం 3-6: అడాప్టివ్ సాధన & వాలంటీర్ మానిటరింగ్',
                    desc: 'రోజూ 5 ప్రశ్నల అడాప్టివ్ సెషన్లు. వారపు సింక్ ద్వారా వీక్ టాపిక్స్ గుర్తించి టీచర్లతో గైడెన్స్.',
                  },
                  {
                    week: 'వారం 7-8: పోస్ట్-టెస్ట్ & ఇంపాక్ట్ రిపోర్టింగ్',
                    desc: 'తుది పరీక్ష ద్వారా గణిత మార్కుల పెరుగుదల నమోదు. CSR స్పాన్సర్‌కు అధికారిక ప్రగతి నివేదిక సమర్పణ.',
                  },
                ].map((p, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                    <div className="font-bold text-indigo-brand mb-1 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-lantern" />
                      <span>{p.week}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed font-medium">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pack Scaling Story */}
            <div className="bg-linear-to-br from-indigo-950 to-indigo-brand text-white rounded-3xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2 font-bold text-sm text-amber-300">
                <Globe className="w-5 h-5 text-lantern" />
                <span>కంటెంట్ ప్యాక్ స్కేలింగ్ (How Any Language Scales)</span>
              </div>
              <p className="text-xs text-indigo-100 leading-relaxed mb-3">
                విద్యాపథ్ కోడ్‌లో ఎక్కడా ఏ భాష లేదా సిలబస్ హార్డ్ కోడ్ చేయబడలేదు. ప్రతి సబ్జెక్ట్ మరియు భాష ఒక JSON డేటా ప్యాక్ మాత్రమే.
              </p>
              <div className="p-3 rounded-xl bg-white/10 text-xs text-amber-200 space-y-1 font-medium">
                <div>✓ కొత్త భాష (ఉదా: హిందీ, ఒడియా) జోడించడానికి కేవలం 2 వారాలు.</div>
                <div>✓ కోడ్ మార్చాల్సిన అవసరం లేకుండానే కొత్త అధ్యాయాలు ఆటోమేటిక్‌గా లోడ్ అవుతాయి.</div>
                <div>✓ స్థానిక ఉపాధ్యాయులు సులభంగా ప్యాక్ ఎడిటర్ ద్వారా ప్రశ్నలు రూపొందించవచ్చు.</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: 1-Page Business Viability Slide */}
        {activeTab === 'slide' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-5 border-4 border-indigo-brand shadow-lg text-slate-900">
              {/* Slide Title Bar */}
              <div className="flex items-center justify-between border-b-2 border-indigo-brand pb-3 mb-4">
                <div>
                  <h2 className="text-lg font-black text-indigo-brand">
                    Vidyapath: The Last-Mile Multilingual Learning Engine
                  </h2>
                  <p className="text-xs text-slate-500 font-bold">
                    ACE Builders Hackathon 2026 · Problem Statement 3 · Business Viability Slide
                  </p>
                </div>
                <span className="text-2xl">🏮</span>
              </div>

              {/* 3 Pillars of the Business */}
              <div className="grid grid-cols-1 gap-3 text-xs mb-4">
                {/* 1. Who Pays */}
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                  <div className="font-bold text-indigo-brand mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Who Pays? (B2B2C Model — Free for Learners)</span>
                  </div>
                  <p className="text-slate-700 leading-tight font-medium">
                    CSR Education Grants (Reliance, Tata, Wipro), State Education Departments (AP/TS Samagra Shiksha), and Philanthropic NGOs pay per-seat annual contracts based on verified learning gains.
                  </p>
                </div>

                {/* 2. Competitive Moat */}
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-lantern" />
                    <span>Competitive Moat vs Existing Ed-Tech</span>
                  </div>
                  <p className="text-slate-700 leading-tight font-medium">
                    Traditional ed-tech is English-first and assumes dedicated personal smartphones with 4G/5G. Vidyapath is built for <strong>shared low-end basic phones</strong> with 0-data offline practice, deterministic wrong-math prevention, and pure data-pack swappability.
                  </p>
                </div>

                {/* 3. Unit Economics Summary */}
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <div className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-emerald-700" />
                    <span>Radical Cost Efficiency: ₹18.50 / Learner / Month</span>
                  </div>
                  <p className="text-slate-700 leading-tight font-medium">
                    80% of doubts and all practice scoring run locally on the client phone with zero cloud cost. Cloud AI inference is only triggered when unique new questions arise, delivering 10x lower operating cost than standard chatbots.
                  </p>
                </div>
              </div>

              {/* Roadmap Milestones */}
              <div className="border-t border-slate-200 pt-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Roadmap: 18 Months to 5,000+ Learners
                </div>
                <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-bold">
                  <div className="bg-slate-100 p-1.5 rounded-lg text-slate-700">Phase 1: Harden (AP Maths)</div>
                  <div className="bg-slate-100 p-1.5 rounded-lg text-slate-700">Phase 2: Pilot (100 learners)</div>
                  <div className="bg-slate-100 p-1.5 rounded-lg text-slate-700">Phase 3: Multi-pack (Hindi, Odia)</div>
                  <div className="bg-indigo-brand p-1.5 rounded-lg text-amber-300">Phase 4: State Scale</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
