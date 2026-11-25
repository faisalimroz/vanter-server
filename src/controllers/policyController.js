import Policy from '../models/Policy.js';

export const DEFAULT_POLICIES = {
  'terms-of-service': {
    key: 'terms-of-service',
    title: 'Terms of Service',
    subtitle: 'Standard client agreement for luxury acquisitions and nationwide deliveries in Bangladesh.',
    summary: 'Governing the purchase of handcrafted footwear, tailored menswear, and bespoke fragrances through Vantero Bangladesh.',
    content: `### 1. Introduction & Acceptance
Welcome to Vantero (referred to as "Vantero", "we", "our", or "us"). By accessing or making an acquisition through our website (vantero.com) or associated digital channels, you agree to be bound by these Terms of Service. Vantero operates from Road 11, Banani, Dhaka 1213, Bangladesh.

### 2. Luxury Craftsmanship & Catalog Accuracy
Every Vantero creation—including Italian Nappa leather footwear, double-faced wool overcoats, tropical wool trousers, and artisanal extraits de parfum—is manufactured to exacting standards. Due to the handcrafted nature of artisanal leather and custom dying processes, slight natural grain textures and undertone variations are authentic hallmarks of genuine luxury materials.

### 3. Pricing & Currency
All prices displayed across our storefront are denominated in Bangladeshi Taka (৳ BDT). Prices include applicable local taxes and duties. Vantero reserves the right to adjust pricing or withdraw promotional discounts without prior notice, provided that confirmed orders will be honored at their booked rate.

### 4. Nationwide Cash on Delivery (COD) & Doorstep Inspection
Vantero provides an official 100% Cash on Delivery guarantee across all 64 districts of Bangladesh:
- **No Advance Payment Required:** Customers are never asked for bKash, card, or wallet prepayments before dispatch.
- **Doorstep Inspection:** You are entitled to inspect the parcel seal and external packaging upon delivery by our trusted courier rider before releasing payment.
- **Authenticity Assurance:** Cash is collected directly by the delivery personnel once the parcel is handed over.

### 5. Mandatory Account Security & Anti-Fraud
To prevent order collisions and protect logistical routes:
- Ordering requires an authenticated customer profile (verified via Google Authentication).
- Vantero concierges may place an automated verification call prior to dispatch for high-value outerwear or bespoke footwear pieces.
- Vantero reserves the right to cancel orders originating from invalid numbers or blacklisted addresses.

### 6. Intellectual Property
All brand assets, photography, typography, editorial lookbooks, and design layouts are the exclusive property of Vantero Ltd. Unauthorized reproduction or commercial use is strictly prohibited.

### 7. Governing Law & Jurisdiction
These Terms of Service are governed by and construed in accordance with the laws of the People's Republic of Bangladesh. Any dispute arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts of Dhaka, Bangladesh.`
  },

  'privacy-policy': {
    key: 'privacy-policy',
    title: 'Privacy Policy',
    subtitle: 'Our commitment to safeguarding client information and transactional privacy.',
    summary: 'How Vantero securely collects, processes, and protects your personal identification and delivery information in Bangladesh.',
    content: `### 1. Information We Collect
Vantero collects only the minimum personal data necessary to curate an exceptional shopping experience and fulfill doorstep deliveries:
- **Contact Phone:** Provided during checkout strictly for courier delivery rider contact and doorstep delivery coordination.
- **Delivery Address:** Customer name, street address, postal code, and district across Bangladesh to schedule courier logistics.
- **Authentication Data:** Google OAuth profile and email (when signing in with Google).
- **Client Preference & Browsing:** Local cart storage, wishlist selections, and order history.

### 2. How We Use Your Information
Your data is utilized solely for:
- Dispatching orders through Steadfast or designated private concierge couriers.
- Providing real-time delivery status updates and return tracking notifications.
- Verifying client identity during return and exchange requests.
- Securing administrative audit trails against fraudulent bot activity.

### 3. Cookies & Session Storage
We use secure, HttpOnly session cookies for authenticated login tokens. Local browser storage is strictly utilized for client-side conveniences such as your shopping bag contents and theme preferences. We do not employ intrusive tracking pixels or sell user data to advertising exchanges.

### 4. Data Sharing & Security
- **No Commercial Data Sales:** Vantero never rents, sells, or monetizes customer personal data to third parties.
- **Logistics Partners:** Essential delivery metadata (recipient name, address, contact phone) is transmitted securely to licensed courier services in Bangladesh solely for order delivery.
- **Encryption:** All client communications and database records are safeguarded with TLS 1.3 encryption at rest and in transit.

### 5. Client Rights & Data Retention
You may inspect, update, or request the deletion of your account and saved shipping addresses at any time through your Vantero Client Dashboard or by contacting our concierge at privacy@vantero.com.`
  },

  'refund-policy': {
    key: 'refund-policy',
    title: 'Returns & Refund Policy',
    subtitle: 'Transparent 7-day post-delivery returns and seamless doorstep exchanges.',
    summary: 'Clear, client-first guidelines for size exchanges, defect settlements, and Cash on Delivery refunds.',
    content: `### 1. The Official Vantero 7-Day Return Window
We take pride in our silhouettes and tailoring. If a piece does not fit as envisioned or does not exceed your expectations, you may submit a Return or Exchange request within **7 calendar days** from the exact timestamp your parcel is marked as **Delivered**.

### 2. Return Eligibility & Condition Standards
To qualify for a complimentary exchange or full refund:
- **Unworn & Undamaged:** Footwear outsoles must be pristine with zero signs of outdoor wear. Apparel must be unwashed, free of stains or odors, and retain all original Vantero brand tags.
- **Complete Packaging:** The original artisanal shoe box, dust bag, fragrance box, or garment cover must accompany the returned item.
- **Fragrance Exceptions:** Perfumes and extraits may only be returned if the outer factory cellophane wrap remains unbroken, unless a verified manufacturing atomization defect exists.

### 3. Permitted Return Reasons
When initiating a return through your Order Tracking page, select one of the following verified reasons:
1. **Size / Fit Issue:** We will promptly dispatch the replacement size free of charge.
2. **Defective or Damaged:** Documented manufacturing imperfections or transit damage (photo upload via our portal).
3. **Wrong Piece Dispatched:** In the rare event an incorrect silhouette or size was packaged by our fulfillment center.
4. **Not as Described:** Material discrepancy or variation from catalog specification.

### 4. Doorstep Reverse Pickup Process
- **Concierge Review:** Our fulfillment team reviews your request and attached photos within 24 hours.
- **Courier Collection:** Once approved, our logistics partner (Steadfast Reverse Logistics) contacts you to schedule doorstep collection from your address in Dhaka or nationwide.
- **Parcel Inspection:** The returned parcel is inspected at our Banani fulfillment center to confirm condition integrity.

### 5. Settlement & Refund Execution
- **Instant Size Exchange:** Once the return is in transit, the replacement size is dispatched immediately.
- **Cash Refund (COD Orders):** For returned and approved orders paid via Cash on Delivery, refunds are settled via secure Bank Transfer (BEFTN/NPSB) or instant mobile wallet reimbursement (bKash/Nagad) within 48 to 72 hours of item verification.
- **Delivery Charges:** Delivery fees outside Dhaka (৳150) are non-refundable unless the return is due to an official fulfillment error or defective merchandise.`
  }
};

/**
 * Public: Get all published policies (or all for admin)
 */
export const getAllPolicies = async (req, res, next) => {
  try {
    let policies = await Policy.find({ isPublished: true }).select('key title subtitle summary lastUpdated isPublished');

    // If database has no policies yet, auto-seed defaults in memory
    if (!policies || policies.length === 0) {
      policies = Object.values(DEFAULT_POLICIES).map((p) => ({
        key: p.key,
        title: p.title,
        subtitle: p.subtitle,
        summary: p.summary,
        lastUpdated: new Date(),
        isPublished: true
      }));
    }

    return res.status(200).json({
      success: true,
      policies
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public: Get a single policy by key ('terms-of-service', 'privacy-policy', 'refund-policy')
 */
export const getPolicyByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    let policy = await Policy.findOne({ key });

    // Fallback to default if not yet stored in MongoDB
    if (!policy) {
      const defaultDoc = DEFAULT_POLICIES[key];
      if (defaultDoc) {
        policy = await Policy.create({
          ...defaultDoc,
          lastUpdated: new Date(),
          isPublished: true
        });
      } else {
        return res.status(404).json({
          success: false,
          message: `Policy '${key}' not found.`
        });
      }
    }

    return res.status(200).json({
      success: true,
      policy
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Create or update a legal policy
 */
export const updatePolicy = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { title, subtitle, summary, content, lastUpdated, isPublished } = req.body;

    if (!['terms-of-service', 'privacy-policy', 'refund-policy'].includes(key)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid policy key. Allowed: terms-of-service, privacy-policy, refund-policy.'
      });
    }

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Policy title and content are required.'
      });
    }

    const updated = await Policy.findOneAndUpdate(
      { key },
      {
        key,
        title: title.trim(),
        subtitle: subtitle !== undefined ? subtitle.trim() : '',
        summary: summary !== undefined ? summary.trim() : '',
        content,
        lastUpdated: lastUpdated ? new Date(lastUpdated) : new Date(),
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: `${updated.title} updated successfully.`,
      policy: updated
    });
  } catch (error) {
    next(error);
  }
};
