import React, { useState } from 'react';
import {
  X,
  Check,
  ShieldCheck,
  CreditCard,
  Zap,
  Sparkles,
  Printer,
  Lock,
  ArrowRight,
  AlertCircle,
  Building,
  GraduationCap,
  Award,
  RefreshCw,
} from 'lucide-react';
import { UserProfile, saveUserToStorage } from '../utils/userStore';
import { syncUserProfileToFirestore } from '../utils/firebase';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
}

type BillingCycle = 'monthly' | 'yearly';
type TierKey = 'free' | 'pro' | 'institutional';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedTier, setSelectedTier] = useState<TierKey>('pro');
  const [step, setStep] = useState<'tiers' | 'checkout' | 'receipt'>('tiers');

  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardHolder, setCardHolder] = useState(currentUser.name || 'Medical Student');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('888');
  const [postalCode, setPostalCode] = useState('10001');

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<{
    txId: string;
    timestamp: string;
    tierName: string;
    amount: string;
    cardLast4: string;
  } | null>(null);

  if (!isOpen) return null;

  const isAlreadyPro = currentUser.isPro || currentUser.tier === 'pro' || currentUser.tier === 'institutional';

  const tiers = [
    {
      id: 'free' as TierKey,
      name: 'Free Scholar',
      icon: <GraduationCap className="w-5 h-5 text-slate-500" />,
      priceMonthly: '$0',
      priceYearly: '$0',
      badge: 'Preclinical Core',
      description: 'Standard 3D anatomy models, open-access NCBI PubMed papers, and basic practice quizzes.',
      features: [
        'Interactive 3D model viewport & zoom controls',
        'Standard anatomical system exploded layers',
        'NCBI PubMed academic literature search',
        'Standard STOIC Chat Box inquiries',
      ],
      cta: 'Current Plan',
    },
    {
      id: 'pro' as TierKey,
      name: 'STOIC PRO Clinician',
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      priceMonthly: '$14',
      priceYearly: '$120',
      priceSubtext: billingCycle === 'yearly' ? 'billed annually ($10/mo — save 28%)' : 'billed monthly, cancel anytime',
      badge: 'High-Yield USMLE',
      isPopular: true,
      description: 'Full 26-part Master Knolling Kit, unlimited USMLE MCQs, and flywheel biomechanics.',
      features: [
        'Complete 26-Part Master Knolling Kit with 90° organized deconstruction',
        'Unlimited AI-generated USMLE question sets with verified quote citations',
        'NotebookLM 2-speaker medical podcast synthesis & deep summaries',
        'Full Flywheel Kinematic Physics & dual bearing stress analysis',
        'Persistent Firestore Cloud Database synchronization across devices',
        'Priority Gemini 2.5 Flash clinical reasoning engine',
      ],
      cta: 'Upgrade to PRO',
    },
    {
      id: 'institutional' as TierKey,
      name: 'Institutional Pass',
      icon: <Building className="w-5 h-5 text-indigo-500" />,
      priceMonthly: '$29',
      priceYearly: '$299',
      priceSubtext: billingCycle === 'yearly' ? 'billed annually ($25/mo)' : 'billed monthly for lab/residency',
      badge: 'Academic Labs',
      description: 'For university anatomy laboratories, teaching hospitals, and residency programs.',
      features: [
        'Everything in STOIC PRO Clinician',
        'Multi-seat laboratory licenses & class roster sync',
        'High-resolution 3D GLTF exports & anatomical CAD slicing',
        'Automated curriculum question generator from lecture syllabi',
        'Dedicated SLA & custom anatomical models integration',
      ],
      cta: 'Upgrade Institutional',
    },
  ];

  const handleSelectTier = (tier: TierKey) => {
    if (tier === 'free') return;
    setSelectedTier(tier);
    setErrorMessage(null);
    setStep('checkout');
  };

  const handleApplyTestCard = (type: 'valid' | 'declined') => {
    if (type === 'valid') {
      setCardNumber('4242 4242 4242 4242');
      setExpiry('12/28');
      setCvc('888');
      setErrorMessage(null);
    } else {
      setCardNumber('4000 0000 0000 0002');
      setExpiry('10/26');
      setCvc('000');
      setErrorMessage(null);
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 15) {
      setErrorMessage('Please enter a valid 16-digit card number.');
      return;
    }

    setIsProcessing(true);

    setTimeout(async () => {
      if (cleanCard === '4000000000000002') {
        setIsProcessing(false);
        setErrorMessage('Card declined (Simulated decline code: 2005 - Insufficient sandbox funds). Try test card 4242 4242 4242 4242.');
        return;
      }

      const txId = `tx_stoic_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const now = new Date();
      const planName = selectedTier === 'institutional' ? 'Institutional Pass' : 'STOIC PRO Clinician';
      const amount = selectedTier === 'institutional'
        ? (billingCycle === 'yearly' ? '$299.00 USD' : '$29.00 USD')
        : (billingCycle === 'yearly' ? '$120.00 USD' : '$14.00 USD');

      const updatedUser: UserProfile = {
        ...currentUser,
        isPro: true,
        tier: selectedTier,
        subscriptionExpiry: billingCycle === 'yearly' ? '2027-11-06' : '2026-12-06',
        points: currentUser.points + 500,
      };

      saveUserToStorage(updatedUser);
      onUpdateUser(updatedUser);

      // Persist to Cloud Firestore
      try {
        await syncUserProfileToFirestore(updatedUser);
      } catch (err) {
        console.warn('Firestore sync optional:', err);
      }

      setReceiptData({
        txId,
        timestamp: now.toLocaleString(),
        tierName: planName,
        amount,
        cardLast4: cleanCard.slice(-4),
      });

      setIsProcessing(false);
      setStep('receipt');
    }, 1200);
  };

  const handleResetToFree = async () => {
    const updatedUser: UserProfile = {
      ...currentUser,
      isPro: false,
      tier: 'free',
      subscriptionExpiry: undefined,
    };
    saveUserToStorage(updatedUser);
    onUpdateUser(updatedUser);
    try {
      await syncUserProfileToFirestore(updatedUser);
    } catch {
      // ignore
    }
    setStep('tiers');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-rose-600/30">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-none">
                  STOIC.MED Paywall &amp; Tiers
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-500" />
                  Simulated Sandbox
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                3D Knolling, Unlimited High-Yield MCQs, PubMed Integrations, and Database Sync
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {step === 'tiers' && (
            <div className="space-y-8">
              {isAlreadyPro && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-emerald-900 dark:text-emerald-200 text-sm">
                        You are actively enrolled in {currentUser.tier === 'institutional' ? 'Institutional Pass' : 'STOIC PRO Clinician'}!
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        Valid through {currentUser.subscriptionExpiry || '2027-11-06'} • All 4 architecture pillars unlocked.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleResetToFree}
                    className="text-xs font-bold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 underline transition-colors"
                  >
                    Reset Sandbox to Free Tier
                  </button>
                </div>
              )}

              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Choose Your Learning Commitment
                </span>
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      billingCycle === 'yearly'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>Annual Pass</span>
                    <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                      SAVE 28%
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tiers.map((tier) => {
                  const isCurrent = (tier.id === 'free' && !isAlreadyPro) || (tier.id === currentUser.tier && isAlreadyPro);
                  const isProCard = tier.id === 'pro';

                  return (
                    <div
                      key={tier.id}
                      className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 border ${
                        isProCard
                          ? 'bg-gradient-to-b from-rose-50/50 via-white to-white dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-900 border-rose-500 shadow-xl shadow-rose-500/10 scale-[1.02]'
                          : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 shadow-sm'
                      }`}
                    >
                      {tier.badge && (
                        <div
                          className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isProCard
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {tier.badge}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                            {tier.icon}
                          </div>
                          <h4 className="font-black text-lg text-slate-900 dark:text-white">
                            {tier.name}
                          </h4>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 min-h-[36px]">
                          {tier.description}
                        </p>

                        <div className="mb-6">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">
                              {billingCycle === 'yearly' ? tier.priceYearly : tier.priceMonthly}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                              {tier.id === 'free' ? '/ forever' : (billingCycle === 'yearly' ? '/ year' : '/ month')}
                            </span>
                          </div>
                          {tier.priceSubtext && (
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-1">
                              {tier.priceSubtext}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 mb-6">
                          {tier.features.map((feature, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <Check className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                              <span className="text-slate-700 dark:text-slate-300 leading-snug">
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectTier(tier.id)}
                        disabled={isCurrent || tier.id === 'free'}
                        className={`w-full py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md ${
                          isCurrent
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                            : isProCard
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 hover:scale-[1.02]'
                            : 'bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 hover:scale-[1.02]'
                        }`}
                      >
                        <span>{isCurrent ? 'Current Tier' : tier.cta}</span>
                        {!isCurrent && tier.id !== 'free' && <ArrowRight className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'checkout' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep('tiers')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  ← Back to Plan Selection
                </button>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  Step 2: Instant Sandbox Checkout
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {selectedTier === 'institutional' ? 'Institutional Pass' : 'STOIC PRO Clinician'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {billingCycle === 'yearly' ? 'Annual Pass Subscription' : 'Monthly Subscription'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                    {selectedTier === 'institutional'
                      ? (billingCycle === 'yearly' ? '$299.00' : '$29.00')
                      : (billingCycle === 'yearly' ? '$120.00' : '$14.00')}
                  </span>
                  <p className="text-[10px] text-slate-400">Taxes included</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Simulated Sandbox Auto-Fill:
                  </span>
                  <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400">
                    Test Mode (No Real Charges)
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyTestCard('valid')}
                    className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-colors"
                  >
                    ✓ Test Card (Instant Approval)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTestCard('declined')}
                    className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 text-[11px] font-bold transition-colors"
                  >
                    ✗ Test Card (Simulate Decline)
                  </button>
                </div>
              </div>

              <form onSubmit={handleProcessPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Jane Doe, MD"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="4242 4242 4242 4242"
                    />
                    <CreditCard className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Expiry
                    </label>
                    <input
                      type="text"
                      required
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      CVC / CVV
                    </label>
                    <input
                      type="text"
                      required
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="888"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-center focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="10001"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Encrypting &amp; Authorizing Transaction...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        Authorize Sandbox Payment &amp; Unlock PRO (
                        {selectedTier === 'institutional'
                          ? (billingCycle === 'yearly' ? '$299.00' : '$29.00')
                          : (billingCycle === 'yearly' ? '$120.00' : '$14.00')}
                        )
                      </span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 pt-2">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>256-bit TLS Encrypted</span>
                  </span>
                  <span>•</span>
                  <span>PCI-DSS Simulated Compliant</span>
                  <span>•</span>
                  <span>Instant Database Activation</span>
                </div>
              </form>
            </div>
          )}

          {step === 'receipt' && receiptData && (
            <div className="max-w-lg mx-auto space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-inner">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Payment Authorized &amp; PRO Activated!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Welcome to STOIC Clinical Tier. Your account and persistent database are fully connected.
                </p>
              </div>

              <div
                id="stoic-receipt-card"
                className="p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-xs font-mono"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white font-sans">
                      STOIC.MED
                    </span>
                    <p className="text-[10px] text-slate-400 font-sans">Medical Systems &amp; Intelligence</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    PAID IN FULL
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transaction ID:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{receiptData.txId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date &amp; Time:</span>
                    <span>{receiptData.timestamp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer:</span>
                    <span>{cardHolder}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Method:</span>
                    <span>Card ending in •••• {receiptData.cardLast4}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plan:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{receiptData.tierName}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center text-sm font-sans font-black">
                  <span>Total Paid</span>
                  <span className="text-rose-600 dark:text-rose-400 text-lg">{receiptData.amount}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Continue to App (PRO Active)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
