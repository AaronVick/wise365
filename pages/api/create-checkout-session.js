// pages/api/create-checkout-session.js

import Stripe from 'stripe';

// Initialize Stripe with your secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Extract the price ID from the request body
      const { priceId } = req.body;

      if (!priceId) {
        return res.status(400).json({ error: 'Missing price ID' });
      }

      // Create a new Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId, // Price ID of the selected subscription
            quantity: 1,
          },
        ],
        mode: 'subscription', // Indicates this is for a recurring subscription
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
        metadata: {
          subscriptionType: priceId, // Optional metadata for internal tracking
        },
      });

      // Respond with the Checkout Session URL
      res.status(200).json({ url: session.url });
    } catch (error) {
      console.error('Stripe error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end('Method Not Allowed');
  }
}
