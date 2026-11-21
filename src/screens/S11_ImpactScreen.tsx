import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, DollarSign, Calendar, Globe, Sparkles, PieChart } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const S11_ImpactScreen: React.FC = () => {
  const { setScreen, activeLearner } = useApp();
  const [activeTab, setActiveTab] = useState<'kpis' | 'unit_economics' | 'pilot_plan' | 'slide'>('kpis');

  // Interactive unit economics calculator state
  const [learnerScale, setLearnerScale] = useState<number>(500);
  const [offlineCachePercent, setOfflineCachePercent] = useState<number>(80);

  // Economic assumptions:
  const onlineInferencePerLearner = (1 - offlineCachePercent / 100) * 40 * 0.05;
  const hostingPerLearner = 2.0;
  const volunteerPartnerShare = 15.0;
  const totalCostPerLearner = Math.round((onlineInferencePerLearner + hostingPerLearner + volunteerPartnerShare) * 10) / 10;
  const totalMonthlySponsorship = Math.round(learnerScale * totalCostPerLearner);

  return (
    <div className="min-h-screen bg-[#F4F9F6] text-[#0F172A] flex flex-col pb-8">
      {/* Header */}
      <header className="bg-[#FFFFFF] text-[#0F172A] px-4 py-3 shadow-xs border-b border-[#D1E7DD] sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScreen(activeLearner ? 'S3_HOME' : 'S1_PICKER')}
              className="p-2 rounded-xl bg-[#F4F9F6] hover:bg-[#DCFCE7] text-[#0F172A] active:scale-95 border border-[#D1E7DD]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="font-bold text-base block leading-tight">స్పాన్సర్ & ఇంపాక్ట్ డాష్‌బోర్డ్</span>
              <span className="text-[11px] text-[#15803D] font-bold">Vidyapath Impact & Business Viability</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 flex flex-col gap-4">
        {/* Tab Navigation */}
        <div className="flex bg-[#FFFFFF] p-1 rounded-2xl border border-[#D1E7DD] shadow-xs">
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
                  ? 'bg-[#15803D] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Live Cohort KPIs */}
        {activeTab === 'kpis' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#D1E7DD] shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-[#D1E7DD] pb-2">
                <div>
                  <h3 className="font-bold text-sm text-[#0F172A]">
                    చిత్తూరు జిల్లా పైలట్ గ్రూప్ (Chittoor District Cohort)
                  </h3>
                  <p className="text-xs text-[#475569] font-medium">స్పాన్సర్: ACE CSR Foundation (B2B2C)</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#059669] border border-[#86EFAC]">
                  లైవ్ డేటా
                </span>
              </div>

              {/* KPI Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F4F9F6] p-3 rounded-2xl border border-[#D1E7DD]">
                  <div className="text-xs text-[#475569] font-semibold">క్రియాశీల విద్యార్థులు</div>
                  <div className="text-2xl font-black text-[#0F172A] mt-0.5">124</div>
                  <div className="text-[10px] text-[#059669] font-bold mt-1">గోప్యత: కనీసం 5గురు ✓</div>
                </div>

                <div className="bg-[#F4F9F6] p-3 rounded-2xl border border-[#D1E7DD]">
                  <div className="text-xs text-[#475569] font-semibold">సగటు నైపుణ్య పెరుగుదల</div>
                  <div className="text-2xl font-black text-[#059669] mt-0.5">+41.5%</div>
                  <div className="text-[10px] text-[#475569] font-medium mt-1">గత 4 వారాల్లో</div>
                </div>

                <div className="bg-[#F4F9F6] p-3 rounded-2xl border border-[#D1E7DD]">
                  <div className="text-xs text-[#475569] font-semibold">ఆఫ్‌లైన్ సాధన శాతం</div>
                  <div className="text-2xl font-black text-[#15803D] mt-0.5">78.2%</div>
                  <div className="text-[10px] text-[#475569] font-medium mt-1">జీరో డేటా ఖర్చుతో</div>
                </div>

                <div className="bg-[#F4F9F6] p-3 rounded-2xl border border-[#D1E7DD]">
                  <div className="text-xs text-[#475569] font-semibold">నెలవారీ ఖర్చు / విద్యార్థి</div>
                  <div className="text-2xl font-black text-[#15803D] mt-0.5">₹18.50</div>
                  <div className="text-[10px] text-[#059669] font-bold mt-1">అత్యల్ప యూనిట్ వ్యయం</div>
                </div>
              </div>
            </div>

            {/* Cohort Weak Topics */}
            <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#D1E7DD] shadow-xs">
              <h4 className="font-bold text-sm text-[#0F172A] mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#15803D]" />
                <span>గ్రూప్‌లో విద్యార్థులు ఎక్కువ తప్పులు చేసిన అంశాలు (Weak Topics):</span>
              </h4>
              <div className="space-y-2">
                {[
                  { topic: 'అంతమయ్యే దశాంశాలు (Terminating Decimals)', rate: 34 },
                  { topic: 'సమితుల భేదం (Difference A - B)', rate: 29 },
                  { topic: 'యూక్లిడ్ శేష న్యాయం (Euclid Division Lemma)', rate: 22 },
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#F4F9F6] p-3 rounded-xl border border-[#D1E7DD]">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-[#0F172A]">{item.topic}</span>
                      <span className="text-[#DC2626]">{item.rate}% తప్పు రేటు</span>
                    </div>
                    <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden border border-[#D1E7DD]">
                      <div
                        className="bg-[#DC2626] h-full rounded-full"
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#475569] mt-3 italic font-medium">
                * ఈ నివేదిక ఆధారంగా NGO వాలంటీర్లు ఆయా అంశాలపై ప్రత్యేక శ్రద్ధ వహించవచ్చు.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: Unit Economics & Explicit Assumptions */}
        {activeTab === 'unit_economics' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#D1E7DD] shadow-xs">
              <h3 className="font-bold text-sm text-[#0F172A] mb-1">
                యూనిట్ ఎకనామిక్స్ కాలిక్యులేటర్ (Interactive Model)
              </h3>
              <p className="text-xs text-[#475569] mb-4 font-medium">
                స్పష్టమైన అంచనాలు (Explicit Assumptions) & సమీకరణాలు
              </p>

              {/* Slider 1: Number of Active Learners */}
              <div className="mb-4 bg-[#F4F9F6] p-3.5 rounded-2xl border border-[#D1E7DD]">
                <div className="flex justify-between text-xs font-bold text-[#0F172A] mb-2">
                  <span>క్రియాశీల విద్యార్థుల సంఖ్య:</span>
                  <span className="text-[#15803D] text-sm font-black">{learnerScale} మంది</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="5000"
                  step="50"
                  value={learnerScale}
                  onChange={(e) => setLearnerScale(Number(e.target.value))}
                  className="w-full accent-[#15803D] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#475569] mt-1 font-mono">
                  <span>50</span>
                  <span>1000</span>
                  <span>5000</span>
                </div>
              </div>

              {/* Slider 2: Offline / Common Doubts Resolution % */}
              <div className="mb-4 bg-[#F4F9F6] p-3.5 rounded-2xl border border-[#D1E7DD]">
                <div className="flex justify-between text-xs font-bold text-[#0F172A] mb-2">
                  <span>ఆఫ్‌లైన్ కాష్ / కామన్ డౌట్స్ పరిష్కార శాతం:</span>
                  <span className="text-[#059669] text-sm font-black">{offlineCachePercent}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="95"
                  step="5"
                  value={offlineCachePercent}
                  onChange={(e) => setOfflineCachePercent(Number(e.target.value))}
                  className="w-full accent-[#059669] cursor-pointer"
                />
                <p className="text-[11px] text-[#475569] mt-1 font-medium">
                  ఆఫ్‌లైన్ కాష్ పెరిగే కొద్దీ సర్వర్ AI ఖర్చు 80% తగ్గుతుంది.
                </p>
              </div>

              {/* Cost Breakdown Table */}
              <div className="bg-[#F4F9F6] p-4 rounded-2xl border border-[#D1E7DD] space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#D1E7DD]">
                  <span className="text-[#475569]">AI మోడల్ ఇన్ఫరెన్స్ (క్లౌడ్ API):</span>
                  <span className="font-bold text-[#0F172A]">₹{onlineInferencePerLearner.toFixed(2)} / విద్యార్థి</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#D1E7DD]">
                  <span className="text-[#475569]">హోస్టింగ్ & సింక్ ఆర్కిటెక్చర్:</span>
                  <span className="font-bold text-[#0F172A]">₹{hostingPerLearner.toFixed(2)} / విద్యార్థి</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#D1E7DD]">
                  <span className="text-[#475569]">ఫీల్డ్ సపోర్ట్ & కంటెంట్ నిర్వహణ:</span>
                  <span className="font-bold text-[#0F172A]">₹{volunteerPartnerShare.toFixed(2)} / విద్యార్థి</span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-black text-[#0F172A]">
                  <span>మొత్తం ఖర్చు / విద్యార్థి / నెల:</span>
                  <span className="text-[#059669]">₹{totalCostPerLearner} / నెల</span>
                </div>
              </div>

              {/* Total Monthly Sponsorship Estimate */}
              <div className="mt-4 p-4 rounded-2xl bg-[#DCFCE7] border border-[#86EFAC] text-[#14532D] flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-xs text-[#14532D] font-bold">{learnerScale} మంది విద్యార్థులకు మొత్తం స్పాన్సర్‌షిప్:</div>
                  <div className="text-2xl font-black text-[#15803D] mt-0.5">₹{totalMonthlySponsorship.toLocaleString('en-IN')} / నెల</div>
                </div>
                <DollarSign className="w-8 h-8 text-[#15803D]" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 8-Week Pilot Plan & Scaling */}
        {activeTab === 'pilot_plan' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#D1E7DD] shadow-xs">
              <h3 className="font-bold text-sm text-[#0F172A] mb-1">
                8-వారాల గ్రౌండ్ పైలట్ ప్లాన్ (Pilot Implementation)
              </h3>
              <p className="text-xs text-[#475569] mb-4 font-medium">
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
                  <div key={idx} className="p-3 bg-[#F4F9F6] rounded-2xl border border-[#D1E7DD] text-xs">
                    <div className="font-bold text-[#15803D] mb-1 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#15803D]" />
                      <span>{p.week}</span>
                    </div>
                    <p className="text-[#475569] leading-relaxed font-semibold">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pack Scaling Story */}
            <div className="bg-[#FFFFFF] rounded-3xl p-5 border border-[#D1E7DD] shadow-xs">
              <div className="flex items-center gap-2 mb-2 font-bold text-sm text-[#15803D]">
                <Globe className="w-5 h-5 text-[#15803D]" />
                <span>కంటెంట్ ప్యాక్ స్కేలింగ్ (How Any Language Scales)</span>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed mb-3 font-medium">
                విద్యాపథ్ కోడ్‌లో ఎక్కడా ఏ భాష లేదా సిలబస్ హార్డ్ కోడ్ చేయబడలేదు. ప్రతి సబ్జెక్ట్ మరియు భాష ఒక JSON డేటా ప్యాక్ మాత్రమే.
              </p>
              <div className="p-3 rounded-xl bg-[#F4F9F6] border border-[#D1E7DD] text-xs text-[#0F172A] space-y-1.5 font-semibold">
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
            <div className="bg-[#FFFFFF] rounded-3xl p-5 border-2 border-[#15803D] shadow-md text-[#0F172A]">
              {/* Slide Title Bar */}
              <div className="flex items-center justify-between border-b-2 border-[#D1E7DD] pb-3 mb-4">
                <div>
                  <h2 className="text-lg font-black text-[#0F172A]">
                    Vidyapath: The Last-Mile Multilingual Learning Engine
                  </h2>
                  <p className="text-xs text-[#15803D] font-bold">
                    ACE Builders Hackathon 2026 · Problem Statement 3 · Business Viability Slide
                  </p>
                </div>
                <span className="text-2xl">🏮</span>
              </div>

              {/* 3 Pillars of the Business */}
              <div className="grid grid-cols-1 gap-3 text-xs mb-4">
                {/* 1. Who Pays */}
                <div className="bg-[#F4F9F6] p-3.5 rounded-2xl border border-[#D1E7DD]">
                  <div className="font-bold text-[#059669] mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-[#059669]" />
                    <span>Who Pays? (B2B2C Model — Free for Learners)</span>
                  </div>
                  <p className="text-[#475569] leading-relaxed font-semibold">
                    CSR Education Grants (Reliance, Tata, Wipro), State Education Departments (AP/TS Samagra Shiksha), and Philanthropic NGOs pay per-seat annual contracts based on verified learning gains.
                  </p>
                </div>

                {/* 2. Competitive Moat */}
                <div className="bg-[#F4F9F6] p-3.5 rounded-2xl border border-[#D1E7DD]">
                  <div className="font-bold text-[#15803D] mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#15803D]" />
                    <span>Competitive Moat vs Existing Ed-Tech</span>
                  </div>
                  <p className="text-[#475569] leading-relaxed font-semibold">
                    Traditional ed-tech is English-first and assumes dedicated personal smartphones with 4G/5G. Vidyapath is built for <strong>shared low-end basic phones</strong> with 0-data offline practice, deterministic wrong-math prevention, and pure data-pack swappability.
                  </p>
                </div>

                {/* 3. Unit Economics Summary */}
                <div className="bg-[#F4F9F6] p-3.5 rounded-2xl border border-[#D1E7DD]">
                  <div className="font-bold text-[#0D9488] mb-1 flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-[#0D9488]" />
                    <span>Radical Cost Efficiency: ₹18.50 / Learner / Month</span>
                  </div>
                  <p className="text-[#475569] leading-relaxed font-semibold">
                    80% of doubts and all practice scoring run locally on the client phone with zero cloud cost. Cloud AI inference is only triggered when unique new questions arise, delivering 10x lower operating cost than standard chatbots.
                  </p>
                </div>
              </div>

              {/* Roadmap Milestones */}
              <div className="border-t border-[#D1E7DD] pt-3">
                <div className="text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-2">
                  Roadmap: 18 Months to 5,000+ Learners
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-[10px] text-center font-bold">
                  <div className="bg-[#F4F9F6] p-2 rounded-xl text-[#475569] border border-[#D1E7DD]">Phase 1: Harden (AP Maths)</div>
                  <div className="bg-[#F4F9F6] p-2 rounded-xl text-[#475569] border border-[#D1E7DD]">Phase 2: Pilot (100 learners)</div>
                  <div className="bg-[#F4F9F6] p-2 rounded-xl text-[#475569] border border-[#D1E7DD]">Phase 3: Multi-pack (Hindi, Odia)</div>
                  <div className="bg-[#15803D] p-2 rounded-xl text-white shadow-xs">Phase 4: State Scale</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
