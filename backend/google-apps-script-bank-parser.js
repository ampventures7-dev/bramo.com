/**
 * ==============================================================================
 * BHRAMO.COM — 100% FREE AUTOMATED BANK ALERT PARSER (GOOGLE APPS SCRIPT)
 * ==============================================================================
 *
 * HOW IT WORKS (₹0 Monthly Cost · Zero Gateway Fees):
 * 1. When a guest pays ₹advance to your UPI ID (HDFC, SBI, ICICI, Axis, Paytm Bank),
 *    the bank sends an instant transaction confirmation email or SMS notification to your Gmail.
 * 2. This Google Apps Script runs every 1 minute on Google's free servers.
 * 3. It parses the 12-digit UPI UTR/RRN number and the credited amount.
 * 4. It sends an instant HTTP POST to your bhramo.com webhook:
 *    `https://bhramo.com/api/bookings/bank-webhook`
 * 5. Within 5 seconds, the guest's booking screen turns green with a chime!
 *
 * SETUP INSTRUCTIONS (5-Minute One-Time Setup):
 * ------------------------------------------------------------------------------
 * 1. Open your browser and go to https://script.google.com/
 * 2. Click "+ New project". Name it "Bhramo Bank Alert Webhook".
 * 3. Replace all default code with this entire script.
 * 4. Update WEBHOOK_URL and BANK_WEBHOOK_SECRET below if needed.
 * 5. Click the "Triggers" (Clock icon on left sidebar) -> "+ Add Trigger":
 *    - Function to run: `checkBankEmailsAndNotifyWebhook`
 *    - Deployment: `Head`
 *    - Event source: `Time-driven`
 *    - Type of based timer: `Minutes timer`
 *    - Select minute interval: `Every minute`
 * 6. Click Save and Grant Permissions to read Gmail! Done!
 * ==============================================================================
 */

// CONFIGURATION
const WEBHOOK_URL = "https://bhramo.com/api/bookings/bank-webhook";
const BANK_WEBHOOK_SECRET = "bhramo-bank-alert-webhook-free-2026";

// Gmail search query targeting bank credit alerts within the last 2 hours
const GMAIL_SEARCH_QUERY = 'is:unread (subject:"credited" OR subject:"received" OR from:alerts OR from:alerts@hdfcbank.net OR from:donotreply@sbi.co.in OR from:alerts@icicibank.com OR from:alerts@axisbank.com) ("UPI" OR "credited" OR "received")';

function checkBankEmailsAndNotifyWebhook() {
  try {
    const threads = GmailApp.search(GMAIL_SEARCH_QUERY, 0, 10);
    if (!threads || threads.length === 0) {
      Logger.log("No new unread bank credit emails found.");
      return;
    }

    for (let i = 0; i < threads.length; i++) {
      const messages = threads[i].getMessages();
      for (let j = 0; j < messages.length; j++) {
        const msg = messages[j];
        if (!msg.isUnread()) continue;

        const subject = msg.getSubject();
        const body = msg.getPlainBody();
        const sender = msg.getFrom();
        const fullText = subject + "\n" + body;

        Logger.log("Processing bank email: " + subject);

        // 1. Extract 12-Digit UPI UTR / RRN
        // Patterns: UTR: 123456789012, UPI Ref: 123456789012, RRN: 123456789012, or standalone 12 digits
        let utr = null;
        const utrMatch = fullText.match(/(?:UTR|UPI\s*Ref(?:\s*No)?|RRN|Ref\s*No|Transaction\s*ID)[\s:.-]*([0-9]{12})/i);
        if (utrMatch && utrMatch[1]) {
          utr = utrMatch[1];
        } else {
          // Fallback: search any standalone 12 numeric digits
          const looseMatch = fullText.match(/\b([0-9]{12})\b/);
          if (looseMatch && looseMatch[1]) {
            utr = looseMatch[1];
          }
        }

        // 2. Extract Credited Amount
        // Patterns: credited with Rs. 1,200.00, received INR 1200, credited by Rs 1200
        let amount = null;
        const amountMatch = fullText.match(/(?:credited|received|deposited)\s+(?:with|by|of)?\s*(?:INR|Rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]{2})?)/i);
        if (amountMatch && amountMatch[1]) {
          amount = parseFloat(amountMatch[1].replace(/,/g, ""));
        }

        if (utr || amount) {
          Logger.log("Found transaction — UTR: " + utr + ", Amount: " + amount);

          // 3. Post to Bhramo Webhook
          const payload = {
            secret: BANK_WEBHOOK_SECRET,
            utr: utr,
            amount: amount,
            sender: sender,
            rawSnippet: subject.substring(0, 100),
            timestamp: new Date().toISOString()
          };

          const options = {
            method: "post",
            contentType: "application/json",
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
          };

          try {
            const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
            Logger.log("Webhook Response Code: " + response.getResponseCode());
            Logger.log("Webhook Response Body: " + response.getContentText());

            // Mark email as read so it isn't processed again
            msg.markRead();
          } catch (fetchErr) {
            Logger.log("Error sending webhook: " + fetchErr.toString());
          }
        }
      }
    }
  } catch (e) {
    Logger.log("Error in checkBankEmailsAndNotifyWebhook: " + e.toString());
  }
}
