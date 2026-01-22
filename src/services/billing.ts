/**
 * Premium Billing System using Stripe
 * 
 * Handles subscription management, payment processing, and premium features.
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Product IDs
export const PRODUCTS = {
  PREMIUM_MONTHLY: 'premium_monthly',
  PREMIUM_ANNUAL: 'premium_annual',
  PREMIUM_LIFETIME: 'premium_lifetime',
} as const;

// Price points
export const PRICES = {
  [PRODUCTS.PREMIUM_MONTHLY]: 999, // $9.99 in cents
  [PRODUCTS.PREMIUM_ANNUAL]: 8999, // $89.99
  [PRODUCTS.PREMIUM_LIFETIME]: 19999, // $199.99
} as const;

/**
 * Create Stripe customer for user
 */
export async function createStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });

  // Store Stripe customer ID in profiles
  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  return customer.id;
}

/**
 * Create checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  productId: keyof typeof PRODUCTS,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email, full_name')
    .eq('id', userId)
    .single();

  if (!profile) throw new Error('User not found');

  let customerId = profile.stripe_customer_id;
  if (!customerId) {
    customerId = await createStripeCustomer(userId, profile.email, profile.full_name);
  }

  // Create price if not exists
  const priceId = await getOrCreatePrice(productId);

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: productId === PRODUCTS.PREMIUM_LIFETIME ? 'payment' : 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, productId },
    subscription_data:
      productId !== PRODUCTS.PREMIUM_LIFETIME
        ? {
            trial_period_days: 7, // 7-day free trial
            metadata: { userId, productId },
          }
        : undefined,
  });

  return session.url!;
}

/**
 * Get or create Stripe price
 */
async function getOrCreatePrice(productId: keyof typeof PRODUCTS): Promise<string> {
  // Check if price exists in database
  const { data: existingPrice } = await supabase
    .from('stripe_prices')
    .select('stripe_price_id')
    .eq('product_id', productId)
    .single();

  if (existingPrice) {
    return existingPrice.stripe_price_id;
  }

  // Create Stripe product
  const product = await stripe.products.create({
    name: getProductName(productId),
    description: getProductDescription(productId),
    metadata: { productId },
  });

  // Create price
  const priceData: Stripe.PriceCreateParams = {
    product: product.id,
    unit_amount: PRICES[productId],
    currency: 'usd',
    metadata: { productId },
  };

  if (productId !== PRODUCTS.PREMIUM_LIFETIME) {
    priceData.recurring = {
      interval: productId === PRODUCTS.PREMIUM_MONTHLY ? 'month' : 'year',
    };
  }

  const price = await stripe.prices.create(priceData);

  // Store in database
  await supabase.from('stripe_prices').insert({
    product_id: productId,
    stripe_product_id: product.id,
    stripe_price_id: price.id,
  });

  return price.id;
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhook(
  event: Stripe.Event
): Promise<{ success: boolean; message: string }> {
  console.log(`📨 Webhook received: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed':
      return handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      return handleSubscriptionUpdated(event.data.object as Stripe.Subscription);

    case 'customer.subscription.deleted':
      return handleSubscriptionDeleted(event.data.object as Stripe.Subscription);

    case 'invoice.paid':
      return handleInvoicePaid(event.data.object as Stripe.Invoice);

    case 'invoice.payment_failed':
      return handlePaymentFailed(event.data.object as Stripe.Invoice);

    default:
      console.log(`⚠️ Unhandled event type: ${event.type}`);
      return { success: true, message: 'Event received but not handled' };
  }
}

/**
 * Handle successful checkout
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<{ success: boolean; message: string }> {
  const userId = session.metadata?.userId;
  const productId = session.metadata?.productId;

  if (!userId || !productId) {
    return { success: false, message: 'Missing metadata' };
  }

  // Update user to premium
  const { error } = await supabase
    .from('profiles')
    .update({
      is_premium: true,
      premium_tier: productId,
      premium_since: new Date().toISOString(),
      stripe_subscription_id:
        productId !== PRODUCTS.PREMIUM_LIFETIME ? session.subscription : null,
    })
    .eq('id', userId);

  if (error) {
    console.error('❌ Error updating user:', error);
    return { success: false, message: error.message };
  }

  // Log subscription event
  await supabase.from('subscription_events').insert({
    user_id: userId,
    event_type: 'subscription_created',
    product_id: productId,
    stripe_session_id: session.id,
    amount: session.amount_total,
    currency: session.currency,
  });

  console.log(`✅ User ${userId} upgraded to ${productId}`);
  return { success: true, message: 'User upgraded successfully' };
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<{ success: boolean; message: string }> {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    return { success: false, message: 'Missing userId in metadata' };
  }

  const isActive = ['active', 'trialing'].includes(subscription.status);

  await supabase
    .from('profiles')
    .update({
      is_premium: isActive,
      stripe_subscription_status: subscription.status,
      premium_expires_at:
        subscription.current_period_end &&
        new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', userId);

  console.log(`✅ Subscription updated for user ${userId}: ${subscription.status}`);
  return { success: true, message: 'Subscription updated' };
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<{ success: boolean; message: string }> {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    return { success: false, message: 'Missing userId' };
  }

  await supabase
    .from('profiles')
    .update({
      is_premium: false,
      stripe_subscription_status: 'canceled',
      premium_canceled_at: new Date().toISOString(),
    })
    .eq('id', userId);

  // Log cancellation
  await supabase.from('subscription_events').insert({
    user_id: userId,
    event_type: 'subscription_canceled',
    stripe_subscription_id: subscription.id,
  });

  console.log(`❌ Subscription canceled for user ${userId}`);
  return { success: true, message: 'Subscription canceled' };
}

/**
 * Handle successful payment
 */
async function handleInvoicePaid(
  invoice: Stripe.Invoice
): Promise<{ success: boolean; message: string }> {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return { success: true, message: 'Not a subscription invoice' };

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;

  if (userId) {
    await supabase.from('subscription_events').insert({
      user_id: userId,
      event_type: 'payment_succeeded',
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
    });
  }

  console.log(`✅ Invoice paid: ${invoice.id}`);
  return { success: true, message: 'Invoice recorded' };
}

/**
 * Handle payment failure
 */
async function handlePaymentFailed(
  invoice: Stripe.Invoice
): Promise<{ success: boolean; message: string }> {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return { success: true, message: 'Not a subscription invoice' };

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;

  if (userId) {
    await supabase.from('subscription_events').insert({
      user_id: userId,
      event_type: 'payment_failed',
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
    });

    // Notify user of payment failure
    // TODO: Send email notification
  }

  console.log(`❌ Payment failed: ${invoice.id}`);
  return { success: true, message: 'Payment failure recorded' };
}

/**
 * Create customer portal session
 */
export async function createPortalSession(
  userId: string,
  returnUrl: string
): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (!profile?.stripe_customer_id) {
    throw new Error('No Stripe customer found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Check if user has premium access
 */
export async function checkPremiumAccess(userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, premium_expires_at')
    .eq('id', userId)
    .single();

  if (!profile) return false;

  // Lifetime members always have access
  if (profile.is_premium && !profile.premium_expires_at) {
    return true;
  }

  // Check if subscription is still valid
  if (profile.is_premium && profile.premium_expires_at) {
    const expiresAt = new Date(profile.premium_expires_at);
    return expiresAt > new Date();
  }

  return false;
}

/**
 * Get subscription analytics
 */
export async function getSubscriptionAnalytics() {
  const { data: stats } = await supabase.rpc('get_subscription_stats');

  return {
    totalSubscribers: stats?.total_subscribers || 0,
    monthlyRevenue: stats?.monthly_revenue || 0,
    annualRevenue: stats?.annual_revenue || 0,
    lifetimeRevenue: stats?.lifetime_revenue || 0,
    churnRate: stats?.churn_rate || 0,
    trialConversionRate: stats?.trial_conversion_rate || 0,
  };
}

// Helper functions
function getProductName(productId: string): string {
  const names = {
    [PRODUCTS.PREMIUM_MONTHLY]: 'CladeAI Premium Monthly',
    [PRODUCTS.PREMIUM_ANNUAL]: 'CladeAI Premium Annual',
    [PRODUCTS.PREMIUM_LIFETIME]: 'CladeAI Premium Lifetime',
  };
  return names[productId as keyof typeof PRODUCTS] || 'Unknown Product';
}

function getProductDescription(productId: string): string {
  const descriptions = {
    [PRODUCTS.PREMIUM_MONTHLY]:
      'Monthly subscription with 7-day free trial. Cancel anytime.',
    [PRODUCTS.PREMIUM_ANNUAL]:
      'Annual subscription (save 25%). 7-day free trial included.',
    [PRODUCTS.PREMIUM_LIFETIME]: 'One-time payment. Lifetime access to all premium features.',
  };
  return descriptions[productId as keyof typeof PRODUCTS] || '';
}
