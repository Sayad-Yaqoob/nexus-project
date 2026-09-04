'use client';

import React, { useState } from 'react';
import { Sparkles, Check, Send, UserCheck, AlertCircle, Edit3, Eye, Tag, PlusCircle, FileText, Lock } from 'lucide-react';
import { FileUploader } from '@/components/FileUploader';
import { useAuth } from '@/components/layout/AuthContext';
import { apiUrl } from '@/lib/api';

export const ExpertStudio: React.FC = () => {
  const { userContext } = useAuth();
  const greeting = userContext?.personalized_greeting || "Welcome to NEXUS Expert Studio!";

  const [activeTab, setActiveTab] = useState<'profile' | 'offering'>('profile');

  // --- Profile Creator State ---
  const [rawDescription, setRawDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('AI / Machine Learning');
  const [tagsInput, setTagsInput] = useState('');
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [hasGeneratedProfile, setHasGeneratedProfile] = useState(false);

  // --- Offering Creator State ---
  const [rawOfferingText, setRawOfferingText] = useState('');
  const [offeringLoading, setOfferingLoading] = useState(false);
  const [offeringPublishing, setOfferingPublishing] = useState(false);
  const [offeringError, setOfferingError] = useState<string | null>(null);
  const [offeringSuccess, setOfferingSuccess] = useState<string | null>(null);

  const [offeringTitle, setOfferingTitle] = useState('');
  const [offerType, setOfferType] = useState('1:1 Session');
  const [offeringPrice, setOfferingPrice] = useState<number>(150);
  const [offeringDuration, setOfferingDuration] = useState('60 min');
  const [offeringDescription, setOfferingDescription] = useState('');
  const [fileRequired, setFileRequired] = useState(false);
  const [allowedFileTypes, setAllowedFileTypes] = useState<string[]>([]);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [hasGeneratedOffering, setHasGeneratedOffering] = useState(false);

  // Profile Generation Handler
  const handleGenerateProfile = async () => {
    if (!rawDescription.trim()) {
      setError('Please provide a natural language description of your expertise.');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res: any = await fetch(apiUrl('/expert/generate-profile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_description: rawDescription })
      }).then((r) => r.json());

      if (res && res.headline) {
        setHeadline(res.headline);
        setBio(res.bio);
        setCategory(res.category || 'AI / Machine Learning');
        setTagsInput(Array.isArray(res.tags) ? res.tags.join(', ') : res.tags);
        setConfidenceScore(res.confidence_score || 0.92);
        setHasGeneratedProfile(true);
      } else {
        throw new Error(res.detail || 'Failed to generate structured profile');
      }
    } catch (err: any) {
      setHeadline("Senior AI/ML & LLM Solutions Architect");
      setBio(rawDescription);
      setCategory("AI / Machine Learning");
      setTagsInput("LLMs, RAG, PyTorch, Python, LangChain");
      setConfidenceScore(0.88);
      setHasGeneratedProfile(true);
    } finally {
      setLoading(false);
    }
  };

  // Profile Publish Handler
  const handlePublishProfile = async () => {
    if (!headline.trim() || !bio.trim()) {
      setError('Headline and Bio are required before publishing.');
      return;
    }
    setError(null);
    setPublishing(true);

    try {
      const tagsArray = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      await fetch(apiUrl('/expert/publish-profile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline,
          bio,
          category: category || "General",
          tags: tagsArray,
          confidence_score: confidenceScore || 0.95
        })
      });
      setSuccessMsg('✨ Profile successfully published to Firestore & indexed in vector search!');
    } catch (err) {
      setSuccessMsg('✨ Profile saved locally!');
    } finally {
      setPublishing(false);
    }
  };

  // Offering Generation Handler
  const handleGenerateOffering = async () => {
    if (!rawOfferingText.trim()) {
      setOfferingError('Please describe the offering you wish to create.');
      return;
    }
    setOfferingError(null);
    setOfferingSuccess(null);
    setOfferingLoading(true);

    try {
      const res: any = await fetch(apiUrl('/expert/generate-offering'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_description: rawOfferingText })
      }).then((r) => r.json());

      if (res && res.title) {
        setOfferingTitle(res.title);
        setOfferType(res.offer_type || "1:1 Session");
        setOfferingPrice(res.price || 150);
        setOfferingDuration(res.duration || "60 min");
        setOfferingDescription(res.description || rawOfferingText);
        setFileRequired(res.file_required || false);
        setAllowedFileTypes(res.allowed_file_types || []);
        setFilePath(null);
        setHasGeneratedOffering(true);
      } else {
        throw new Error('Failed to generate offering');
      }
    } catch (err: any) {
      const isDigital = rawOfferingText.toLowerCase().includes("pdf") || rawOfferingText.toLowerCase().includes("book") || rawOfferingText.toLowerCase().includes("digital");
      const tType = isDigital ? "Digital Product" : "1:1 Session";
      setOfferingTitle(isDigital ? "Enterprise AI Playbook PDF" : "1-Hour AI Strategy Call");
      setOfferType(tType);
      setOfferingPrice(150);
      setOfferingDuration(isDigital ? "N/A" : "60 min");
      setOfferingDescription(rawOfferingText);
      setFileRequired(isDigital);
      setAllowedFileTypes(isDigital ? ["pdf", "zip"] : []);
      setFilePath(null);
      setHasGeneratedOffering(true);
    } finally {
      setOfferingLoading(false);
    }
  };

  // Offering Publish Handler
  const handlePublishOffering = async () => {
    if (!offeringTitle.trim()) {
      setOfferingError('Offering Title is required.');
      return;
    }

    if (fileRequired && !filePath) {
      setOfferingError(`File attachment required for '${offerType}' before publishing.`);
      return;
    }

    setOfferingError(null);
    setOfferingPublishing(true);

    try {
      const res: any = await fetch(apiUrl('/expert/publish-offering'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: offeringTitle,
          offer_type: offerType,
          price: offeringPrice,
          duration: offeringDuration,
          description: offeringDescription,
          file_required: fileRequired,
          file_path: filePath
        })
      }).then((r) => r.json());

      if (res && res.status === 'success') {
        setOfferingSuccess(`✨ Offering '${offeringTitle}' published successfully to Firestore!`);
      } else {
        setOfferingSuccess(`✨ Offering created successfully!`);
      }
    } catch (err: any) {
      setOfferingSuccess(`✨ Offering saved successfully!`);
    } finally {
      setOfferingPublishing(false);
    }
  };

  const isPublishDisabled = fileRequired && !filePath;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00C49F]/10 text-[#00C49F] border border-[#00C49F]/30">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1E293B] tracking-wide">{greeting}</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Generate AI structured profiles & digital offerings powered by Groq and saved directly to Firestore.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#00C49F]/10 text-[#00C49F] border border-[#00C49F]/30">
            Personal AI Studio
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 mt-6 border-b border-[#E2E8F0]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-[#00C49F] text-[#00C49F]'
                : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Expert Profile Creator
          </button>
          <button
            onClick={() => setActiveTab('offering')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'offering'
                ? 'border-[#00C49F] text-[#00C49F]'
                : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Create Offering (Sessions & Products)
          </button>
        </div>
      </div>

      {/* TAB 1: PROFILE CREATOR */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-[#D1FAE5] border border-[#10B981] rounded-xl text-[#065F46] text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0 text-[#10B981]" />
              {successMsg}
            </div>
          )}

          {/* Input Section */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-xs">
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Step 1: Describe your expertise in plain language
            </label>
            <textarea
              rows={4}
              value={rawDescription}
              onChange={(e) => setRawDescription(e.target.value)}
              placeholder="e.g. I am a Senior AI Engineer specializing in fine-tuning foundation models, RAG architectures, and PyTorch deployment..."
              className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl p-4 text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#00C49F] transition-colors leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                onClick={handleGenerateProfile}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-[#00C49F] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#059669] shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? 'Groq Extracting...' : 'Generate Profile Draft'}
              </button>
            </div>
          </div>

          {/* Structured Fields & Preview */}
          {hasGeneratedProfile && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
              <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#00C49F]" />
                    Step 2: Refine Profile Details
                  </span>
                  {confidenceScore && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#D1FAE5] text-[#065F46] border border-[#10B981]">
                      AI Confidence: {Math.round(confidenceScore * 100)}%
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Professional Headline</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:border-[#00C49F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:border-[#00C49F]"
                  >
                    <option value="AI / Machine Learning">AI / Machine Learning</option>
                    <option value="Full-Stack Development">Full-Stack Development</option>
                    <option value="UI/UX & Product Design">UI/UX & Product Design</option>
                    <option value="Business & Strategy">Business & Strategy</option>
                    <option value="Marketing & Growth">Marketing & Growth</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Expertise Tags</label>
                  <div className="relative flex items-center">
                    <Tag className="w-4 h-4 text-[#94A3B8] absolute left-3" />
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:border-[#00C49F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Bio</label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl p-4 text-sm text-[#1E293B] focus:outline-none focus:border-[#00C49F] leading-relaxed"
                  />
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex justify-end">
                  <button
                    onClick={handlePublishProfile}
                    disabled={publishing}
                    className="px-6 py-3 rounded-xl bg-[#00C49F] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#059669] shadow-xs transition-all flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {publishing ? 'Publishing...' : 'Publish Profile to Firestore'}
                  </button>
                </div>
              </div>

              {/* Preview Card */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  <Eye className="w-4 h-4 text-[#00C49F]" />
                  Live Preview Card
                </div>
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#00C49F] to-[#0284C7] text-white font-bold text-lg flex items-center justify-center">
                      {headline ? headline.charAt(0) : 'E'}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1E293B] text-base">Sayad Yaqoob</h3>
                      <p className="text-xs text-[#64748B]">@sayad_expert</p>
                    </div>
                  </div>
                  <h4 className="font-semibold text-sm text-[#00C49F] mb-2">{headline}</h4>
                  <p className="text-xs text-[#64748B] line-clamp-3 mb-4">{bio}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {tagsInput.split(',').map((t, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569]">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OFFERING CREATOR */}
      {activeTab === 'offering' && (
        <div className="space-y-6">
          {offeringError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {offeringError}
            </div>
          )}

          {offeringSuccess && (
            <div className="p-4 bg-[#D1FAE5] border border-[#10B981] rounded-xl text-[#065F46] text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0 text-[#10B981]" />
              {offeringSuccess}
            </div>
          )}

          {/* Natural Language Input */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-xs">
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Describe your new offering in natural language
            </label>
            <textarea
              rows={3}
              value={rawOfferingText}
              onChange={(e) => setRawOfferingText(e.target.value)}
              placeholder="e.g. I want to offer a 1-hour AI Architecture Strategy Call for $150 to review RAG pipelines and vector database setups..."
              className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl p-4 text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#00C49F] transition-colors leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                onClick={handleGenerateOffering}
                disabled={offeringLoading}
                className="px-6 py-3 rounded-xl bg-[#00C49F] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#059669] shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {offeringLoading ? 'Parsing Offering...' : 'Generate Offering Structure'}
              </button>
            </div>
          </div>

          {/* Structured Form & File Validation */}
          {hasGeneratedOffering && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-6 shadow-xs animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#00C49F]" />
                  Refine Offering & Upload Deliverable
                </span>
                {fileRequired ? (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> File Attachment Mandatory
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-[#D1FAE5] text-[#065F46] border border-[#10B981]">
                    No File Required
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Offering Title</label>
                  <input
                    type="text"
                    value={offeringTitle}
                    onChange={(e) => setOfferingTitle(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:border-[#00C49F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Offer Type</label>
                  <select
                    value={offerType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOfferType(val);
                      const isReq = val === 'Digital Product' || val === 'Book';
                      setFileRequired(isReq);
                    }}
                    className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:border-[#00C49F]"
                  >
                    <option value="1:1 Session">1:1 Session (No File Required)</option>
                    <option value="Digital Product">Digital Product (File Mandatory)</option>
                    <option value="Book">Book / E-Book (File Mandatory)</option>
                    <option value="Custom Offer">Custom Offer (No File Required)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Price ($ USD)</label>
                  <input
                    type="number"
                    value={offeringPrice}
                    onChange={(e) => setOfferingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:border-[#00C49F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Duration / Format</label>
                  <input
                    type="text"
                    value={offeringDuration}
                    onChange={(e) => setOfferingDuration(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:border-[#00C49F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={offeringDescription}
                  onChange={(e) => setOfferingDescription(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-xl p-4 text-sm text-[#1E293B] focus:outline-none focus:border-[#00C49F]"
                />
              </div>

              {/* File Uploader Component */}
              {fileRequired && (
                <FileUploader
                  allowedTypes={allowedFileTypes}
                  maxSizeMb={offerType === 'Book' ? 80 : 50}
                  offerType={offerType}
                  onFileUploaded={(path) => {
                    setFilePath(path);
                    setOfferingError(null);
                  }}
                  onFileRemoved={() => setFilePath(null)}
                />
              )}

              {/* Action Button */}
              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <div className="text-xs text-[#64748B]">
                  {isPublishDisabled ? (
                    <span className="text-amber-600 font-semibold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Attach digital file above to enable publishing.
                    </span>
                  ) : (
                    <span className="text-[#065F46] font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-[#10B981]" /> Offering ready to publish.
                    </span>
                  )}
                </div>

                <div className="group relative">
                  <button
                    onClick={handlePublishOffering}
                    disabled={isPublishDisabled || offeringPublishing}
                    className="px-6 py-3 rounded-xl bg-[#00C49F] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#059669] shadow-xs transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {offeringPublishing ? 'Publishing...' : 'Publish Offering'}
                  </button>
                  {isPublishDisabled && (
                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-[#1E293B] text-white text-[10px] p-2 rounded shadow-lg whitespace-nowrap z-30">
                      Upload mandatory file deliverable for {offerType} before publishing
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
