import React, { useState } from 'react';
import { useClient } from '../../context/ClientContext';
import { api } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  ShieldAlert,
  ShieldCheck,
  Layers,
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Sliders,
  DollarSign,
  Calendar,
  Globe,
  Instagram,
  Facebook,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import {
  CampaignWorkflowStatus,
  BudgetOwnershipLevel,
  BudgetType,
  CampaignValidationResult
} from '../../types';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { activeClient } = useClient();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<CampaignValidationResult | null>(null);

  // Step 1: Campaign & Objective
  const [name, setName] = useState('Q4_TOFU_Advantage_Acquisition_V1');
  const [objective, setObjective] = useState<string>('OUTCOME_SALES');
  const [budgetLevel, setBudgetLevel] = useState<BudgetOwnershipLevel>('CAMPAIGN');
  const [budgetType, setBudgetType] = useState<BudgetType>('DAILY');
  const [budgetAmount, setBudgetAmount] = useState<number>(120);
  const [specialCategory, setSpecialCategory] = useState<string>('NONE');

  // Step 2: Ad Set Settings & Audience Targeting
  const [adSetName, setAdSetName] = useState('Core Advantage+ Audience (Broad Interests)');
  const [destinationType, setDestinationType] = useState('WEBSITE');
  const [optimizationGoal, setOptimizationGoal] = useState('OFFSITE_CONVERSIONS');
  const [ageMin, setAgeMin] = useState(21);
  const [ageMax, setAgeMax] = useState(55);
  const [gender, setGender] = useState<'ALL' | 'MEN' | 'WOMEN'>('WOMEN');
  const [locations, setLocations] = useState<string[]>(['US']);
  const [selectedInterests, setSelectedInterests] = useState<Array<{ id: string; name: string }>>([
    { id: '6003140510344', name: 'Skin care' },
    { id: '6003139268393', name: 'Natural skincare' }
  ]);
  const [advantagePlusAudience, setAdvantagePlusAudience] = useState(true);
  const [advantagePlusPlacements, setAdvantagePlusPlacements] = useState(true);
  const [platforms, setPlatforms] = useState<string[]>(['facebook', 'instagram']);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  // Step 3: Identity & Creative
  const [pageName, setPageName] = useState(activeClient?.name || 'Lumina Skin Co.');
  const [pageId, setPageId] = useState('page_lumina_official');
  const [instagramHandle, setInstagramHandle] = useState(activeClient?.instagram_handle || '@luminaskin');
  const [creativeName, setCreativeName] = useState('72hr Barrier Serum UGC Motion Hook');
  const [headline, setHeadline] = useState('Repair Your Moisture Barrier in 72 Hours');
  const [primaryText, setPrimaryText] = useState(
    'Stop masking chronic redness with heavy foundation. Our clinical lipid-matrix serum restores your lipid barrier with biocompatible ceramides and botanical bakuchiol.'
  );
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('VIDEO');
  const [mediaUrl, setMediaUrl] = useState(
    'https://assets.mixkit.co/videos/preview/mixkit-girl-applying-cream-on-her-face-in-front-of-a-40618-large.mp4'
  );
  const [destinationUrl, setDestinationUrl] = useState('https://luminaskin.com/products/barrier-serum');
  const [cta, setCta] = useState('SHOP_NOW');

  // Available targeting interests from verified registry
  const AVAILABLE_INTERESTS = [
    { id: '6003140510344', name: 'Skin care' },
    { id: '6003362140411', name: 'Cosmetics' },
    { id: '6003139268393', name: 'Natural skincare' },
    { id: '6003012948624', name: 'Beauty salons' },
    { id: '6003087265814', name: 'Physical fitness' },
    { id: '6003192049182', name: 'Dermatology' }
  ];

  const handleToggleInterest = (item: { id: string; name: string }) => {
    if (selectedInterests.some(i => i.id === item.id)) {
      setSelectedInterests(prev => prev.filter(i => i.id !== item.id));
    } else {
      setSelectedInterests(prev => [...prev, item]);
    }
  };

  const handleValidateSettings = async () => {
    setValidating(true);
    try {
      const payload = assembleDraftPayload();
      const res = await api.validateCampaign(payload);
      setValidationResult(res);
    } catch (err: any) {
      console.error("Validation error:", err);
    } finally {
      setValidating(false);
    }
  };

  const assembleDraftPayload = () => {
    return {
      client_id: activeClient?.id || 'cli_lumina_glow',
      name,
      objective: objective as any,
      budget_level: budgetLevel,
      budget_type: budgetType,
      daily_budget_usd: budgetType === 'DAILY' ? Number(budgetAmount) : 50.0,
      lifetime_budget_usd: budgetType === 'LIFETIME' ? Number(budgetAmount) : undefined,
      special_ad_category: specialCategory,
      ad_sets: [
        {
          name: adSetName,
          optimization_goal: optimizationGoal,
          billing_event: 'IMPRESSIONS',
          destination_type: destinationType,
          bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
          status: 'PAUSED',
          targeting: {
            age_min: ageMin,
            age_max: ageMax,
            genders: gender,
            locations,
            interests: selectedInterests,
            advantage_plus_audience: advantagePlusAudience
          },
          placements: {
            advantage_plus_placements: advantagePlusPlacements,
            platforms,
            facebook_positions: ['feed', 'story', 'reels'],
            instagram_positions: ['stream', 'story', 'reels', 'explore']
          },
          start_time: startDate,
          end_time: endDate || undefined
        }
      ],
      creatives: [
        {
          name: creativeName,
          page_id: pageId,
          page_name: pageName,
          instagram_actor_id: '17841400000000001',
          instagram_handle: instagramHandle,
          headline,
          primary_text: primaryText,
          call_to_action: cta,
          media_type: mediaType,
          media_url: mediaUrl,
          destination_url: destinationUrl
        }
      ],
      ads: [
        {
          name: `Ad 01 - ${creativeName.slice(0, 25)}`,
          status: 'PAUSED'
        }
      ]
    };
  };

  const handleSubmit = async () => {
    if (!activeClient) return;
    setSubmitting(true);
    try {
      const payload = assembleDraftPayload();
      await api.createCampaign(payload);
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      alert(`Campaign creation error: ${err.message || 'Validation failed'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setValidationResult(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Meta Campaign Builder"
      description="Create multi-tier Campaign -> Ad Set -> Ad Creative hierarchy with strict PAUSED enforcement"
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Step {currentStep} of 4:</span>
            <span>
              {currentStep === 1 && 'Objective & Budget'}
              {currentStep === 2 && 'Ad Set & Targeting'}
              {currentStep === 3 && 'Identity & Creative'}
              {currentStep === 4 && 'Pre-flight Validation & Review'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
              >
                Back
              </Button>
            )}

            {currentStep < 4 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (currentStep === 3) {
                    handleValidateSettings();
                  }
                  setCurrentStep((prev) => (prev + 1) as any);
                }}
              >
                Continue to Step {currentStep + 1}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                isLoading={submitting}
                icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
                onClick={handleSubmit}
              >
                Save PAUSED Campaign Draft
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-xs">
        {/* Step Progress Indicators */}
        <div className="grid grid-cols-4 gap-2 border-b border-slate-800 pb-4">
          {[
            { num: 1, title: 'Campaign & Goal' },
            { num: 2, title: 'Ad Set & Audience' },
            { num: 3, title: 'Creative & Identity' },
            { num: 4, title: 'Validation & Save' }
          ].map(s => (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num === 4) handleValidateSettings();
                setCurrentStep(s.num as any);
              }}
              className={`text-left p-2 rounded-lg border transition-all ${
                currentStep === s.num
                  ? 'border-indigo-500/80 bg-indigo-500/10 text-indigo-300'
                  : currentStep > s.num
                  ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400'
                  : 'border-slate-800 bg-slate-900/50 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                {currentStep > s.num ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span>{s.num}.</span>
                )}
                <span>{s.title}</span>
              </div>
            </button>
          ))}
        </div>

        {/* STEP 1: CAMPAIGN & OBJECTIVE */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <p className="leading-snug">
                Safety Guarantee: All new campaigns created through MetaPilot AI are initialized with status <strong className="text-amber-400 font-mono">PAUSED</strong>. Zero advertising spend will occur without separate human approval sign-off.
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-200 block mb-1">Campaign Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Q4_TOFU_Advantage_Acquisition_V1"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-200 block mb-1">
                  Meta Campaign Objective (ODAX)
                </label>
                <select
                  value={objective}
                  onChange={e => {
                    const obj = e.target.value;
                    setObjective(obj);
                    if (obj === 'OUTCOME_SALES') {
                      setOptimizationGoal('OFFSITE_CONVERSIONS');
                      setDestinationType('WEBSITE');
                    } else if (obj === 'OUTCOME_LEADS') {
                      setOptimizationGoal('LEAD_GENERATION');
                      setDestinationType('ON_AD');
                    } else if (obj === 'OUTCOME_TRAFFIC') {
                      setOptimizationGoal('LINK_CLICKS');
                      setDestinationType('WEBSITE');
                    } else if (obj === 'OUTCOME_ENGAGEMENT') {
                      setOptimizationGoal('MESSAGING_CONVERSATIONS');
                      setDestinationType('WHATSAPP');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="OUTCOME_SALES">Sales / Conversions (Catalog &amp; Web)</option>
                  <option value="OUTCOME_LEADS">Leads &amp; Instant Forms</option>
                  <option value="OUTCOME_TRAFFIC">Traffic &amp; Link Clicks</option>
                  <option value="OUTCOME_ENGAGEMENT">Engagement &amp; Messaging</option>
                  <option value="OUTCOME_AWARENESS">Brand Awareness &amp; Reach</option>
                  <option value="OUTCOME_APP_PROMOTION">App Promotion &amp; Installs</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-200 block mb-1">
                  Special Ad Category (Policy Compliance)
                </label>
                <select
                  value={specialCategory}
                  onChange={e => setSpecialCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="NONE">None (Standard Commercial)</option>
                  <option value="HOUSING">Housing (Real Estate / Rental)</option>
                  <option value="EMPLOYMENT">Employment (Job Offer / Hiring)</option>
                  <option value="CREDIT">Credit (Credit Cards / Personal Loans)</option>
                </select>
              </div>
            </div>

            {/* Budget Ownership & Type */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <span className="font-bold text-slate-200 block">Budget Configuration</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Budget Allocation Level</label>
                  <select
                    value={budgetLevel}
                    onChange={e => setBudgetLevel(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-200"
                  >
                    <option value="CAMPAIGN">Campaign Budget (Advantage+ CBO)</option>
                    <option value="AD_SET">Ad Set Level (ABO)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Budget Pacing Type</label>
                  <select
                    value={budgetType}
                    onChange={e => setBudgetType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-200"
                  >
                    <option value="DAILY">Daily Budget</option>
                    <option value="LIFETIME">Lifetime Budget</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    Amount ({activeClient?.monthly_budget_usd ? 'USD' : '$'})
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400">$</span>
                    <input
                      type="number"
                      min={budgetLevel === 'CAMPAIGN' ? 10 : 5}
                      step={5}
                      value={budgetAmount}
                      onChange={e => setBudgetAmount(Number(e.target.value))}
                      className="w-full pl-6 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-100 font-mono font-semibold"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Meta requires a minimum of $10.00/day for Campaign Budget Optimization or $5.00/day for individual Ad Sets.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: AD SET & AUDIENCE TARGETING */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <label className="font-semibold text-slate-200 block mb-1">Ad Set Name</label>
              <input
                type="text"
                required
                value={adSetName}
                onChange={e => setAdSetName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-200 block mb-1">Conversion Destination</label>
                <select
                  value={destinationType}
                  onChange={e => setDestinationType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                >
                  <option value="WEBSITE">Website (Shopify / Landing Page)</option>
                  <option value="WHATSAPP">WhatsApp Direct Conversations</option>
                  <option value="ON_AD">Instant Form (On-Meta Lead Gen)</option>
                  <option value="MESSENGER">Facebook Messenger</option>
                  <option value="INSTAGRAM_DIRECT">Instagram Direct Message</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-200 block mb-1">Optimization Goal</label>
                <select
                  value={optimizationGoal}
                  onChange={e => setOptimizationGoal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                >
                  <option value="OFFSITE_CONVERSIONS">Purchases / Conversions</option>
                  <option value="LEAD_GENERATION">Lead Submissions</option>
                  <option value="LINK_CLICKS">Link Clicks</option>
                  <option value="LANDING_PAGE_VIEWS">Landing Page Views</option>
                  <option value="MESSAGING_CONVERSATIONS">Conversations Started</option>
                </select>
              </div>
            </div>

            {/* Audience Demographics & Targeting */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-400" />
                  Audience Demographics &amp; Targeting
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={advantagePlusAudience}
                    onChange={e => setAdvantagePlusAudience(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600"
                  />
                  <span>Advantage+ Audience AI</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Age Range</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={18}
                      max={65}
                      value={ageMin}
                      onChange={e => setAgeMin(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-center text-slate-200"
                    />
                    <span className="text-slate-500">to</span>
                    <input
                      type="number"
                      min={18}
                      max={65}
                      value={ageMax}
                      onChange={e => setAgeMax(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-center text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                  >
                    <option value="ALL">All Genders</option>
                    <option value="WOMEN">Women</option>
                    <option value="MEN">Men</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Location</label>
                  <input
                    type="text"
                    value={locations.join(', ')}
                    onChange={e => setLocations(e.target.value.split(',').map(s => s.trim()))}
                    placeholder="US, CA, UK"
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1.5">
                  Verified Meta Detailed Targeting Interests
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_INTERESTS.map(item => {
                    const isSelected = selectedInterests.some(i => i.id === item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleInterest(item)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          isSelected
                            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {item.name}
                        <span className="text-[10px] text-slate-500 ml-1">({item.id})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Placements & Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Placements</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 text-[11px]">
                    <input
                      type="checkbox"
                      checked={advantagePlusPlacements}
                      onChange={e => setAdvantagePlusPlacements(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600"
                    />
                    <span>Advantage+ (Automatic)</span>
                  </label>
                </div>
                <div className="flex items-center gap-3 text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Facebook className="w-3.5 h-3.5 text-blue-400" /> Feeds &amp; Stories
                  </span>
                  <span className="flex items-center gap-1">
                    <Instagram className="w-3.5 h-3.5 text-pink-400" /> Reels &amp; Explore
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <span className="font-bold text-slate-200">Flight Schedule</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200"
                  />
                  <span className="text-slate-500">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    placeholder="Ongoing"
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: IDENTITY & CREATIVE */}
        {currentStep === 3 && (
          <div className="space-y-4">
            {/* Page & Instagram Identity */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                  <Facebook className="w-3.5 h-3.5 text-blue-400" /> Facebook Page Identity
                </label>
                <input
                  type="text"
                  value={pageName}
                  onChange={e => setPageName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-pink-400" /> Instagram Account Actor
                </label>
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={e => setInstagramHandle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-200">Ad Headline</label>
                <span className={`text-[10px] ${headline.length > 255 ? 'text-red-400' : 'text-slate-500'}`}>
                  {headline.length}/255 chars
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={255}
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                placeholder="e.g. Restore Your Skin Barrier in 72 Hours"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-200">Primary Ad Text (Copy / Hook)</label>
                <span className={`text-[10px] ${primaryText.length > 2000 ? 'text-red-400' : 'text-slate-500'}`}>
                  {primaryText.length}/2000 chars
                </span>
              </div>
              <textarea
                rows={3}
                required
                maxLength={2000}
                value={primaryText}
                onChange={e => setPrimaryText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-200 block mb-1">Call to Action (CTA)</label>
                <select
                  value={cta}
                  onChange={e => setCta(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                >
                  <option value="SHOP_NOW">Shop Now</option>
                  <option value="LEARN_MORE">Learn More</option>
                  <option value="SIGN_UP">Sign Up</option>
                  <option value="GET_OFFER">Get Offer</option>
                  <option value="SEND_WHATSAPP_MESSAGE">Send WhatsApp Message</option>
                  <option value="CONTACT_US">Contact Us</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-200 block mb-1">Destination URL</label>
                <input
                  type="url"
                  required
                  value={destinationUrl}
                  onChange={e => setDestinationUrl(e.target.value)}
                  placeholder="https://yourstore.com/product"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-200 block mb-1">Media Asset URL (Image or Video)</label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  required
                  value={mediaUrl}
                  onChange={e => setMediaUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                />
                <select
                  value={mediaType}
                  onChange={e => setMediaType(e.target.value as any)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                >
                  <option value="IMAGE">Image</option>
                  <option value="VIDEO">Video</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PRE-FLIGHT VALIDATION & REVIEW */}
        {currentStep === 4 && (
          <div className="space-y-4">
            {/* Validation Banner */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              validationResult?.is_valid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              {validationResult?.is_valid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold text-slate-100 block">
                  {validationResult?.is_valid
                    ? 'Graph API v21.0 Compatibility Verified'
                    : 'Compatibility Alerts Detected'}
                </span>
                <p className="text-xs mt-0.5 text-slate-300">
                  {validationResult?.is_valid
                    ? 'All parameters comply with official Meta Marketing API specifications. Campaign will be stored as a PAUSED draft ready for security approval.'
                    : validationResult?.errors.join('. ')}
                </p>
              </div>
            </div>

            {/* Campaign Hierarchy Tree View */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <span className="font-bold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                4-Tier Campaign Hierarchy Visualizer
              </span>

              <div className="space-y-2 font-mono text-[11px]">
                {/* Level 1: Campaign */}
                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-bold rounded text-[10px]">
                      CAMPAIGN
                    </span>
                    <span className="text-slate-200 font-semibold">{name}</span>
                    <span className="text-slate-400">({objective})</span>
                  </div>
                  <Badge variant="warning">STATUS: PAUSED</Badge>
                </div>

                {/* Level 2: Ad Set */}
                <div className="ml-5 p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 font-bold rounded text-[10px]">
                      AD SET
                    </span>
                    <span className="text-slate-200">{adSetName}</span>
                    <span className="text-slate-400">
                      (${budgetAmount}/day • {gender} {ageMin}-{ageMax})
                    </span>
                  </div>
                  <Badge variant="warning">STATUS: PAUSED</Badge>
                </div>

                {/* Level 3: Ad Creative */}
                <div className="ml-10 p-2.5 bg-slate-800/40 rounded-lg border border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-300 font-bold rounded text-[10px]">
                      CREATIVE
                    </span>
                    <span className="text-slate-200 truncate max-w-[280px]">"{headline}"</span>
                    <span className="text-slate-400">[{cta}]</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">{mediaType}</span>
                </div>

                {/* Level 4: Ad */}
                <div className="ml-14 p-2.5 bg-slate-800/30 rounded-lg border border-slate-700/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded text-[10px]">
                      AD
                    </span>
                    <span className="text-slate-200">Ad 01 - {creativeName.slice(0, 25)}</span>
                  </div>
                  <Badge variant="warning">STATUS: PAUSED</Badge>
                </div>
              </div>
            </div>

            {/* Approval Guardrail Notice */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Next step after saving: Request explicit approval token</span>
              </div>
              <Badge variant="default">Mode: Demo / Connected API</Badge>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
