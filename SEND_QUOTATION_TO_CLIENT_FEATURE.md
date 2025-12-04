# 📤 Send Quotation to Client - Feature Guide

## Overview

Sales Executives and Sales Head can now send approved quotations directly to clients from their dashboards.

---

## Workflow

### Complete Quotation Flow:

1. **Sales Executive** creates quotation → Status: "Pending"
2. **Sales Head** reviews and approves → Status: "Approved"
3. **Sales Executive OR Sales Head** sends to client → Status: "Sent to Client"
4. Client receives quotation via Email/WhatsApp/Hand Delivery

---

## Who Can Send Quotations?

### Sales Executives (Field Sales, Tele Sales)
- ✅ Can send their OWN approved quotations
- ✅ See "Send to Client" button on their lead cards
- ❌ Cannot send other people's quotations

### Sales Head
- ✅ Can send ANY approved quotation
- ✅ Useful when Sales Executive is unavailable
- ✅ Full oversight of all quotations

---

## How to Use

### For Sales Executives:

**Step 1: Wait for Approval**
- Create quotation from lead tracker
- Wait for Sales Head to approve
- Status will change from "⏳ Pending" to "✅ Approved"

**Step 2: Send to Client**
1. On lead card, you'll see: **"📤 Send to Client"** button
2. Click the button
3. Dialog appears with client details

**Step 3: Fill Client Details**
- **Client Email:** Pre-filled from lead (or enter manually)
- **Send Via:** Choose method
  * Email (default)
  * WhatsApp
  * Hand Delivered

**Step 4: Confirm**
- Click **"📤 Send Quotation"** button
- Quotation marked as sent
- Status changes to **"📤 Sent"**

---

### For Sales Head:

**Scenario 1: Sales Executive Available**
- Sales Executive will send their own quotations
- You just approve and monitor

**Scenario 2: Sales Executive Unavailable**
- You can send any approved quotation
- Same process as above
- Useful for urgent situations

**How to Send:**
1. Go to Sales Head Dashboard
2. Find lead with approved quotation
3. Click **"📤 Send to Client"** button
4. Fill details and confirm

---

## Send Methods

### 1. Email (Recommended)
- **Best for:** Formal business communication
- **What happens:** Quotation sent via email to client
- **Client receives:** Professional email with quotation

### 2. WhatsApp
- **Best for:** Quick follow-up, existing WhatsApp conversations
- **What happens:** Quotation details shared on WhatsApp
- **Client receives:** Message with quotation info

### 3. Hand Delivered
- **Best for:** In-person meetings, local clients
- **What happens:** Mark quotation as hand-delivered
- **Client receives:** Physical printout

---

## Status Tracking

### Quotation Status Progression:

```
1. Created       → "⏳ Pending"         (Waiting for Sales Head)
2. Approved      → "✅ Approved"        (Ready to send)
3. Sent          → "📤 Sent"           (Delivered to client)
```

**Additional Statuses:**
- **"❌ Rejected"** - Sales Head rejected (create new quotation)

---

## Where to Find "Send to Client" Button

### Location:
- **Dashboard:** Sales Executive Dashboard OR Sales Head Dashboard
- **Section:** Lead Tracker (on individual lead cards)
- **Visibility:** Only shown for quotations with status "Approved"

### Button Appearance:
```
┌─────────────────────────────┐
│ 📤 Send to Client           │  ← Green button
└─────────────────────────────┘
```

---

## Benefits

### For Sales Executives:
✅ **Direct control** over client communication
✅ **Fast delivery** - no waiting for others
✅ **Track status** - know when quotation is sent
✅ **Professional process** - proper approval before sending

### For Sales Head:
✅ **Backup capability** - can send if exec unavailable
✅ **Full visibility** - see all quotations
✅ **Quality control** - approve before sending
✅ **Emergency handling** - cover for team when needed

### For Business:
✅ **No bottlenecks** - multiple people can send
✅ **Audit trail** - track who sent what and when
✅ **Client satisfaction** - faster response time
✅ **Accountability** - clear ownership of each step

---

## API Endpoint

### Send Quotation to Client
```
PUT /api/sales/quotations/{quotation_id}/send-to-client
```

**Request Body:**
```json
{
  "client_email": "client@example.com",
  "sent_via": "Email",
  "client_contact": "+971501234567",
  "remarks": "Sent via Email"
}
```

**Response:**
```json
{
  "message": "Quotation marked as sent to client successfully",
  "quotation_id": "xxx-xxx-xxx",
  "sent_via": "Email"
}
```

**Access Control:**
- Sales Executives: Can send their own quotations
- Sales Head: Can send any quotation
- Requirement: Quotation must have status="Approved"

---

## Important Notes

### ⚠️ Requirements:
1. Quotation must be **approved** first
2. Cannot send pending or rejected quotations
3. Sales Executives can only send their own quotations

### 📧 Email Functionality:
- Currently marks quotation as sent
- Future enhancement: Actual email sending integration
- For now: Send quotation manually and mark as sent

### 🔄 Status Updates:
- Lead status automatically updates
- Quotation tracking maintained
- Audit trail preserved

---

## Troubleshooting

**Q: I don't see "Send to Client" button**
- A: Button only shows for "Approved" quotations
- Check quotation status first

**Q: Button is disabled**
- A: May already be sent
- Check if status is "📤 Sent"

**Q: Error when sending**
- A: Verify quotation is approved
- Check you have permission to send this quotation

**Q: Can I resend a quotation?**
- A: Currently one-time send
- Contact admin to reset status if needed

---

## Future Enhancements

### Planned Features:
- ✉️ Actual email integration (automatic sending)
- 📱 WhatsApp API integration
- 📄 PDF generation of quotation
- 🔔 Client delivery notifications
- 📊 Read receipts and tracking
- 🔄 Ability to resend quotations

---

## Best Practices

### For Sales Executives:
1. ✅ Always verify client email before sending
2. ✅ Choose appropriate send method
3. ✅ Follow up with client after sending
4. ✅ Update lead notes with client response

### For Sales Head:
1. ✅ Only send when exec is unavailable
2. ✅ Inform exec when you send their quotation
3. ✅ Maintain communication transparency
4. ✅ Use for urgent/critical quotations

---

## Examples

### Example 1: Normal Flow (Sales Executive Sends)
```
1. Afshaan creates quotation for "ABC Company"
2. Mohammad (Sales Head) approves
3. Afshaan sees "📤 Send to Client" button
4. Afshaan sends via Email to client@abc.com
5. Status → "📤 Sent"
6. Afshaan follows up with client
```

### Example 2: Sales Head Covers (Executive Unavailable)
```
1. Sherook creates quotation for "XYZ Corp"
2. Mohammad (Sales Head) approves
3. Sherook is on leave/unavailable
4. Mohammad sends quotation via WhatsApp
5. Status → "📤 Sent"
6. Mohammad informs Sherook when back
```

---

## Support

For issues with sending quotations:
- Check quotation approval status
- Verify client email address
- Contact Sales Head for assistance
- Check system documentation

**Last Updated:** 2025-12-04  
**Version:** 1.0  
**Feature Status:** Production Ready
