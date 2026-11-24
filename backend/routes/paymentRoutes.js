
const router = require("express").Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const auth = require("../middleware/auth");

// Razorpay configuration
const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!KEY_ID || !KEY_SECRET) {
  throw new Error(
    "Razorpay keys are missing. Check your backend .env file."
  );
}

const razorpay = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET
});

const APPOINTMENT_FEE = 50000; // ₹500

// CREATE PAYMENT ORDER
router.post("/create-order", auth, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        msg: "User authentication failed"
      });
    }

    const options = {
      amount: APPOINTMENT_FEE,
      currency: "INR",
      receipt: `dentify_${Date.now()}`,
      notes: {
        userId: String(req.user.id)
      }
    };

    const order = await razorpay.orders.create(options);

    console.log("Razorpay order created:", order.id);

    return res.status(200).json({
      success: true,
      order,
      key: KEY_ID
    });

  } catch (err) {
    console.error("RAZORPAY ORDER CREATION FAILED:");
    console.error("Message:", err.message);
    console.error("Description:", err.error?.description);
    console.error("Full Error:", err);

    return res.status(500).json({
      success: false,
      msg:
        err.error?.description ||
        err.message ||
        "Unable to create payment order"
    });
  }
});

// VERIFY PAYMENT
router.post("/verify-payment", auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        msg: "Missing payment details"
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest();

    const receivedSignature = Buffer.from(
      razorpay_signature,
      "hex"
    );

    if (
      generatedSignature.length !== receivedSignature.length ||
      !crypto.timingSafeEqual(
        generatedSignature,
        receivedSignature
      )
    ) {
      return res.status(400).json({
        success: false,
        msg: "Invalid payment signature"
      });
    }

    const [order, payment] = await Promise.all([
      razorpay.orders.fetch(razorpay_order_id),
      razorpay.payments.fetch(razorpay_payment_id)
    ]);

    if (order.notes?.userId !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        msg: "Payment order does not belong to you"
      });
    }

    if (
      order.amount !== APPOINTMENT_FEE ||
      order.currency !== "INR" ||
      order.status !== "paid"
    ) {
      return res.status(400).json({
        success: false,
        msg: "Invalid or unpaid order"
      });
    }

    if (
      payment.order_id !== razorpay_order_id ||
      payment.status !== "captured" ||
      payment.amount !== APPOINTMENT_FEE ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        msg: "Payment is not successfully captured"
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Payment verified successfully",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });

  } catch (err) {
    console.error("PAYMENT VERIFICATION ERROR:", err);

    return res.status(500).json({
      success: false,
      msg:
        err.error?.description ||
        err.message ||
        "Payment verification failed"
    });
  }
});

module.exports = router;
