# Vidyapath — Authentication Architecture & Security Lifecycle

**Authoritative Backend:** Node.js Express Authentication Services  
**Session Standard:** Signed JWT with PBKDF2 (SHA-512, 10,000 rounds) credential hashing

---

## 1. Authentication Lifecycle

```
[ User Action: Register / Login / Reset ]
                     |
                     v
       +-----------------------------+
       |   Rate Limiter Middleware   |  (300 req/min, 5 failed attempts lockout)
       +-----------------------------+
                     |
                     v
       +-----------------------------+
       |    Backend Validation API   |  (Email sanitization, password strength)
       +-----------------------------+
                     |
         +-----------+-----------+
         |                       |
  [ Credentials ]          [ OTP Verification ]
         |                       |
         v                       v
  Verify Hash + Salt       Check Hash + Expiry (5m)
         |                       |
         +-----------+-----------+
                     |
                     v
       +-----------------------------+
       |      Issue Signed JWT       |  (Payload: userId, role, institutionId)
       +-----------------------------+
                     |
                     v
       +-----------------------------+
       |   Role-Based Redirection    |
       | L1 -> /dashboard/super-admin|
       | L2 -> /dashboard/inst-admin |
       | L3 -> /dashboard/teacher    |
       | L4 -> /dashboard/student    |
       | L5 -> /dashboard/parent     |
       +-----------------------------+
```

---

## 2. Multi-Pathway Registration Matrix

| Pathway | Mandatory Fields | Verification Method | Approval Required | Post-Activation Destination |
|---|---|---|---|---|
| **Student (Institutional)** | Name, Email, Password, Inst ID, Programme, Semester | EmailJS Template 1 OTP | Institution Administrator | Student Dashboard |
| **Independent Learner** | Name, Email, Password, Target Grade | EmailJS Template 1 OTP | Immediate | Learner Dashboard |
| **Parent / Guardian** | Name, Email, Password | EmailJS Template 1 OTP | Immediate | Family Onboarding |
| **Teacher / Faculty** | Name, Email, Password, Inst Code, Dept | EmailJS Template 1 OTP | Institution Administrator | Teacher Dashboard |
| **Institution Admin** | Inst Name, Code, Admin Email, Password | EmailJS Template 1 OTP | Super Administrator | Institution Dashboard |

---

## 3. Student Zero-Email Security Guarantee
For underage rural students using shared low-connectivity mobile devices, Vidyapath supports **Zero-PII Student Authentication**:
- **Credentials:** Username / Login Code (e.g. `RAVI-10`) + 4-digit PIN (`1234`).
- **Recovery:** Child-friendly Safety Question (e.g. *"What is your favorite school subject?"* $\to$ *"Maths"*).
- **Privacy:** No phone numbers, personal emails, or SMS OTPs are required or collected from students.
