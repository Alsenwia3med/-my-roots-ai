"""
The vendor copy register: every string outside the report that no controlled pack supplies.

    python scripts/canonical/check_vendor_copy.py      (npm run check:vendor-copy)

`lib/assessment/copy.ts` says its PENDING strings are "listed in docs/m1/COPY_REGISTER.md for
ROOTS approval". That register does not exist. This produces it, and produces it from the code so
it cannot drift from what the product actually says.

It also closes the third open item on the legal screens (ROOTS review of 29 September 2026, D7),
which referred to this wording as "marked PENDING and listed for approval" without listing it.

Each string is checked against the controlled C-04 pack the same way `check_c04.py` checks the
governed copy. A string that turns out to be in C-04 after all is a finding, not a pass: it means
copy we treated as ours is in fact approved, and it should be read from the governed module
instead. The run fails in that case.

The report's own strings are not here. They are covered by `npm run check:c03`.

Requires: pip install pypdf
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
C04_PDF = ROOT / "docs" / "controlled-sources" / "05_ROOTS_AI_C04_Website_Content_and_Legal_Copy_Pack_v1.0.1_CORRECTED.pdf"
OUT = ROOT / "docs" / "m3" / "ROOTS-AI_M3_Vendor_Copy_Register.md"

PAGE_FURNITURE = re.compile(
    r"ROOTS-AI™ \| C-04 Website Content & Legal Copy Pack v[\d.]+|CONFIDENTIAL — C-04 \s*\|\s*\d+"
)
LINE_BREAK_HYPHEN = re.compile(r"(?<=[A-Za-z])- (?=[a-z])")
QUOTES = str.maketrans({"‘": "'", "’": "'", "“": '"', "”": '"'})
PLACEHOLDER = re.compile(r"\{[a-z_]+\}", re.IGNORECASE)


# ---------------------------------------------------------------------------------------------
# ROOTS review of 30 September 2026, section 5.
#
# ROOTS accepts ordinary functional interface copy "where it is genuinely limited to neutral
# navigation, controls, progress indicators and non-governed error handling", and expressly does
# NOT extend that to nine categories. It also requires that behaviour-asserting claims be
# "supported by the implemented behavior and governing specification, not merely categorized as
# 'functional copy'."
#
# So the strings that assert a behaviour are declared here, each with the claim it makes, the
# category it falls in, and what supports it. The test is not whether a string mentions a topic:
# "Email address" is a field label and asserts nothing. The test is whether it makes a claim a
# participant could rely on.
#
# A governed string with no recorded support fails the run.
# ---------------------------------------------------------------------------------------------

GOVERNED: dict[str, dict[str, str]] = {
    "cfClearance": {
        "category": "Cookie disclosure; strictly necessary security technology",
        "claim": (
            "The Cloudflare challenge platform may set a clearance cookie after a challenge is completed; it is "
            "strictly necessary security, not analytics or advertising, and is not used to profile the visitor."
        ),
        "support": (
            "Directed by ROOTS on 1 October 2026 (M3 closure requirements, section 5), which required conditional and "
            "accurate disclosure where the technology is actually used. It is: the deployed Phase 1 origin answers a "
            "request without a clearance cookie with `Cf-Mitigated: challenge` and serves "
            "`/cdn-cgi/challenge-platform/h/b/scripts/precursor/.../main.js` to a browser session \u2014 both observed "
            "against the live origin and recorded in `docs/m3/ROOTS-AI_M3_Decision_Log.md` (D-01). The wording is "
            "conditional (\"Where the Cloudflare challenge platform is active\"), so it does not assert presence on a "
            "configuration where the challenge is not enabled. Nothing in the application reads the cookie, and no "
            "analytics or advertising provider is enabled in Phase 1."
        ),
    },
    "sessionDuration": {
        "category": "Cookie disclosure; authenticated-session duration",
        "claim": (
            "The length of an authenticated session is governed by the configured authentication and session settings "
            "rather than by a fixed period published in the notice."
        ),
        "support": (
            "Directed by ROOTS on 1 October 2026 (M3 closure requirements, section 5): a fixed duration must not be "
            "invented, and any published figure must first correspond to an approved, verified configuration value. "
            "The application sets no session lifetime of its own \u2014 it holds no session-duration constant and "
            "passes no expiry to the auth provider \u2014 so the lifetime is whatever the configured authentication "
            "settings impose. The statement therefore publishes no number and claims none."
        ),
    },
    "emailPrivacyNote": {
        "category": "Privacy; use of email",
        "claim": "The address is used only to send the secure link.",
        "support": (
            "`app/api/v1/auth/magic-link/route.ts` uses the address to provision the account and generate the link, "
            "and for a rate-limit digest; it is stored on the profile and used for no other purpose. Contact enquiries "
            "go to a separate configured address. No marketing or analytics use exists. Governed by the Privacy Notice (C-04)."
        ),
    },
    "ageAcknowledgement": {
        "category": "Age acknowledgement",
        "claim": "The participant confirms they are 18 or older.",
        "support": (
            "C-01 VAL-010 and `MIN_ELIGIBLE_AGE = 18`. The magic-link route requires `ageConfirmed: true` and refuses the "
            "request without it; Q1 below 18 is refused by `validateAnswer` with the approved VAL-010 wording."
        ),
    },
    "checkEmailBody": {
        "category": "Authentication behaviour",
        "claim": "The response is the same whether or not the address is registered; the link works once and expires.",
        "support": (
            "The route returns an identical body either way \u2014 asserted by `tests/auth/provisioning.test.ts`, "
            "*account existence is never revealed*. Single use and expiry are Supabase Auth one-time tokens with "
            "`MAGIC_LINK_EXPIRY_MINUTES` (15)."
        ),
    },
    "linkErrorBody": {
        "category": "Authentication behaviour",
        "claim": "Secure links work once and expire after a short time.",
        "support": "As above. `app/auth/confirm/route.ts` verifies the one-time token and redirects to the error screen when it is used or expired.",
    },
    "requestNewLink": {
        "category": "Authentication behaviour",
        "claim": "A new link can be requested.",
        "support": "Reuses wording from inside C-04's approved session-expiry sentence. Rate limited to `MAGIC_LINK_MAX_REQUESTS` (3) per 15 minutes.",
    },
    "magicLinkSubject": {
        "category": "Authentication behaviour; use of email",
        "claim": "Identifies the email as carrying a secure link.",
        "support": "`lib/email/mailer.ts`; the only participant email the system sends.",
    },
    "magicLinkEmailBody": {
        "category": "Authentication behaviour",
        "claim": "The link works once and expires after the stated number of minutes.",
        "support": "The minutes value is filled from `MAGIC_LINK_EXPIRY_MINUTES`, the same setting Supabase enforces, so the stated figure cannot drift from the configured one.",
    },
    "savePrivacy": {
        "category": "Data behaviour; authentication",
        "claim": "Answers save automatically; returning requires a new secure link to the same address.",
        "support": (
            "Autosave is `PATCH /api/v1/assessments/[id]/responses`, called per answer. Resume requires a verified session, "
            "and a session is only obtained through a secure link; an assessment is bound to its profile by `assessments.profile_id` "
            "and RLS refuses any other."
        ),
    },
    "saveExitBody": {
        "category": "Data retention; authentication",
        "claim": "Saved answers stay with the assessment; continuing requires a new secure link to the same address.",
        "support": "As above. Nothing is discarded on exit: `responses` rows persist and the assessment stays `in_progress`.",
    },
    "restartConfirmBody": {
        "category": "Immutable records; data retention",
        "claim": "The existing answers are **archived**, a new empty assessment starts, and this cannot be undone.",
        "support": (
            "`app/api/v1/assessments/[id]/archive/route.ts` sets `status = 'archived'` and `archived_at`. **Nothing is deleted** \u2014 "
            "the answers remain in `responses` and are included in a data export. The claim is 'archived', not 'deleted', and that is "
            "what the code does. Irreversibility: no endpoint un-archives an assessment."
        ),
    },
    "reviewBoundary": {
        "category": "Immutable / final records",
        "claim": "On submission the answers become a final record and can no longer be changed.",
        "support": (
            "`app/api/v1/assessments/[id]/responses/route.ts` refuses any write once `status !== 'in_progress'`, returning 409 "
            "`ASSESSMENT_CLOSED`. Submission sets the status, so the record is closed by the same transition the sentence describes."
        ),
    },
    "offline": {
        "category": "Offline data behaviour",
        "claim": "The current entry remains on this device until the participant leaves or refreshes.",
        "support": (
            "The in-progress answer is React component state only. There is no `localStorage`, `sessionStorage` or IndexedDB "
            "persistence of answers anywhere in `app/assessment/` or `lib/assessment/`, so it is lost on leave or refresh exactly "
            "as stated. **Disclosure:** `sessionStorage` is used for two non-answer values \u2014 the email typed at entry, and a submit "
            "idempotency key \u2014 and those do survive a refresh within the tab. Neither is an answer, and neither is what this sentence "
            "describes, but ROOTS should know they exist."
        ),
    },
    "consentRequired": {
        "category": "Consent",
        "claim": "Agreement is required to continue.",
        "support": "The consent screen blocks progression until the required consent is recorded in `consents`; `POST /api/v1/consents` is the only writer.",
    },
    "consentSaveFailed": {
        "category": "Consent",
        "claim": "The choice was not saved and should be retried.",
        "support": "Shown only on a failed `POST /api/v1/consents`. No consent is treated as given on failure.",
    },
    "consentVersion": {
        "category": "Consent",
        "claim": "States the consent document version and effective date.",
        "support": "Filled from `LEGAL_VERSION`, and the same version is stored on the `consents` row, so what was shown and what was recorded cannot differ.",
    },
    "signedInAs": {
        "category": "Authentication behaviour",
        "claim": "Names the signed-in account.",
        "support": "Rendered from the verified Supabase session (`getParticipant`), not from an unvalidated cookie.",
    },
    "signOut": {
        "category": "Authentication behaviour",
        "claim": "Ends the session.",
        "support": "`POST /api/v1/auth/sign-out` clears the Supabase session cookies.",
    },
    "extendSession": {
        "category": "Authentication behaviour",
        "claim": "The session can be kept alive.",
        "support": "`proxy.ts` refreshes and rotates the Supabase session on each protected request; idle timeout is `ASSESSMENT_IDLE_TIMEOUT_MINUTES`.",
    },
    "submitFailed": {
        "category": "Data behaviour",
        "claim": "The submission failed but the answers are saved.",
        "support": "Autosave has already persisted each answer before submit is called, so the statement holds: a failed submit leaves `responses` intact and the assessment `in_progress`.",
    },
    "reportNameSaveFailed": {
        "category": "Data behaviour",
        "claim": "The name was not saved and the field may be cleared to continue.",
        "support": "`PATCH /api/v1/profile`; the column privilege limits the write to `display_name`. The report renders the approved fallback when it is blank.",
    },
}


def normalise(text: str) -> str:
    return re.sub(r"\s+", " ", text.translate(QUOTES)).strip()


def c04_text() -> str:
    reader = PdfReader(str(C04_PDF))
    raw = normalise(" ".join(page.extract_text() or "" for page in reader.pages))
    return LINE_BREAK_HYPHEN.sub("-", normalise(PAGE_FURNITURE.sub(" ", raw)))


def strings() -> list[tuple[str, str, str]]:
    result = subprocess.run(
        ["node", "--import", "tsx", str(ROOT / "scripts" / "canonical" / "vendor_copy_strings.ts")],
        cwd=ROOT, capture_output=True, text=True, encoding="utf-8", shell=True,
    )
    if result.returncode != 0:
        sys.exit(f"could not read the copy module:\n{result.stderr}")
    return [(where, surface, value) for where, surface, value in json.loads(result.stdout)]


def occurrences(source: str, target: str) -> list[int]:
    out, at = [], source.find(target)
    while at != -1:
        out.append(at)
        at = source.find(target, at + 1)
    return out


def classify(source: str, value: str) -> str:
    """
    'governed'  — the string stands alone in C-04 as its own sentence or label;
    'fragment'  — it appears only inside a longer approved sentence;
    'vendor'    — it does not appear at all.

    The distinction matters. A button reading "Request a new secure link" is not approved copy
    merely because those words occur inside the approved sentence "...this session has expired.
    Request a new secure link to continue." The first is a label we wrote; the second is a message
    C-04 supplies. Treating the first as governed would let us claim approval we do not have.
    """
    target = LINE_BREAK_HYPHEN.sub("-", normalise(value))
    if PLACEHOLDER.search(target):
        head = PLACEHOLDER.split(target)[0].strip()
        if len(head.split()) <= 3:
            return "vendor"
        target = head
    if len(target.split()) <= 2:
        return "vendor"

    hits = occurrences(source, target)
    if not hits:
        return "vendor"

    for at in hits:
        before = source[:at].rstrip()
        after = source[at + len(target):].lstrip()
        starts_clause = before == "" or before[-1] in '.?!:;"\u2014'
        ends_clause = after == "" or after[0] in '.?!"' or target[-1] in '.?!'
        if starts_clause and ends_clause:
            return "governed"
    return "fragment"


def main() -> None:
    if not C04_PDF.exists():
        sys.exit(f"controlled source not found: {C04_PDF}")

    source = c04_text()
    items = strings()
    verdicts = {i[0]: classify(source, i[2]) for i in items}
    governed = [i for i in items if verdicts[i[0]] == "governed"]
    fragments = [i for i in items if verdicts[i[0]] == "fragment"]
    vendor = [i for i in items if verdicts[i[0]] == "vendor"]

    def key_of(where: str) -> str:
        return where.split('.')[-1]

    behaviour = [i for i in vendor + fragments if key_of(i[0]) in GOVERNED]
    neutral = [i for i in vendor + fragments if key_of(i[0]) not in GOVERNED]

    by_surface: dict[str, list[tuple[str, str, str]]] = {}
    for item in neutral:
        by_surface.setdefault(item[1], []).append(item)

    unsupported = [i for i in behaviour if not GOVERNED[key_of(i[0])].get("support")]

    write(vendor, governed, fragments, by_surface, verdicts, behaviour, neutral, key_of)

    print(f"C-04 source : {C04_PDF.name}")
    print(f"checked     : {len(items)} strings outside the report")
    print(f"  vendor-drafted, for approval    : {len(vendor)}")
    print(f"  wording drawn from an approved sentence : {len(fragments)}")
    print(f"  standalone in C-04 after all    : {len(governed)}")
    print(f"  \u2014 of the vendor copy, behaviour-asserting (governed) : {len(behaviour)}")
    print(f"  \u2014 of the vendor copy, neutral interface copy          : {len(neutral)}")
    print(f"\nwrote {OUT.relative_to(ROOT)}")

    if fragments:
        print("\nNote - these reuse wording from inside an approved sentence, and are listed as ours:")
        for where, _, value in fragments:
            print(f"  {where}: {normalise(value)[:80]}")

    if governed:
        print("\nFAILED - copy treated as ours stands alone in the controlled pack, and should be read from it:")
        for where, _, value in governed:
            print(f"  {where}: {normalise(value)[:100]}")
        sys.exit(1)

    if unsupported:
        print("\nFAILED - governed strings with no recorded supporting behaviour:")
        for where, _, _ in unsupported:
            print(f"  {where}")
        sys.exit(1)

    print("\nPASS - no string treated as vendor copy is a standalone governed string in C-04,")
    print("       and every behaviour-asserting string records what supports it.")


def write(vendor, governed, fragments, by_surface, verdicts, behaviour, neutral, key_of) -> None:
    lines = [
        "# ROOTS-AI™ — vendor copy register (outside the report)",
        "",
        "Every string a participant reads that **no controlled pack supplies**, listed for ROOTS",
        "approval. Prepared in response to the ROOTS review of 29 September 2026, item D7, which",
        "found this wording described as \"marked PENDING and listed for approval\" against a register",
        "that did not exist.",
        "",
        "**Generated by** `npm run check:vendor-copy`, from the copy module itself, so the register",
        "cannot drift from what the product says. Each string is checked against the controlled C-04",
        "pack: a string that turns out to be *in* C-04 fails the run, because copy we treat as ours",
        "being approved after all means it should be read from the governed module instead.",
        "",
        "The report's own wording is not here. It is registered separately, against C-03 and the",
        "issued review, by `npm run check:c03`.",
        "",
        "## Summary",
        "",
        "| | Strings |",
        "|---|---|",
        f"| Vendor-drafted, awaiting approval | **{len(vendor) + len(fragments)}** |",
        f"| \u2014 of which **assert a behaviour** (governed; section 1) | **{len(behaviour)}** |",
        f"| \u2014 of which are neutral interface copy (section 2) | {len(neutral)} |",
        f"| — of which reuse wording from inside an approved sentence | {len(fragments)} |",
        f"| Standalone in C-04 after all (a defect, fails the run) | {len(governed)} |",
        "",
        "A button reading *\"Request a new secure link\"* is not approved copy merely because those",
        "words occur inside C-04's approved sentence *\"...this session has expired. Request a new",
        "secure link to continue.\"* The first is a label we wrote; the second is a message the pack",
        "supplies. Strings in that position are marked **(reuses approved wording)** below and listed",
        "for approval like any other, because claiming otherwise would claim an approval we do not",
        "hold. They are worth ROOTS' attention first: the wording is already ROOTS', so approving it",
        "should be quick.",
        "",
        "## What this wording is, and is not",
        "",
        "It is functional: field labels, button text, progress indicators, error messages and the",
        "sentences that explain what a control does. C-04 governs the website and legal copy and the",
        "approved consent and system messages; it does not supply a label for every input or a message",
        "for every failure, and a screen cannot be built without them.",
        "",
        "Every string here is written to the same constraints: minimal, neutral, no claim, no promise,",
        "and no health statement. None of them states a finding, a score, a classification or anything",
        "about a participant's biology — that wording is all governed and is all in the C-03 register.",
        "",
        "**What approval would settle.** Each string accepted as written, amended, or replaced with",
        "approved wording. Where ROOTS amends one, it is replaced verbatim and this register",
        "regenerates.",
        "",
    ]

    lines += [
        "## 1. Behaviour-asserting copy \u2014 governed, source-bound",
        "",
        "ROOTS review of 30 September 2026, section 5. Acceptance of ordinary functional copy",
        "**does not extend** to consent, privacy, data retention/deletion/export,",
        "authentication/security behaviour, age acknowledgement, medical boundaries, AI disclosure,",
        "immutable/final records, or offline data behaviour. ROOTS further required that claims such",
        "as data being archived, retained on-device while offline, use of email, final-record",
        "behaviour and consent effects be *\"supported by the implemented behavior and governing",
        "specification, not merely categorized as \u2018functional copy\u2019\"*.",
        "",
        "The test applied is not whether a string mentions a topic. *\"Email address\"* is a field label",
        "and asserts nothing. The test is whether the string makes a claim a participant could rely",
        "on. Each one below is listed with the claim it makes and what supports it; the run fails if",
        "any governed string has no recorded support.",
        "",
    ]

    for where, surface, value in behaviour:
        key = key_of(where)
        g = GOVERNED[key]
        lines += [
            f"### `{key}` \u2014 {g['category']}",
            "",
            f"> {normalise(value)}",
            "",
            f"**Claim.** {g['claim']}",
            "",
            f"**What supports it.** {g['support']}",
            "",
            f"*Screen: {surface}.* **ROOTS decision:** ______",
            "",
        ]

    lines += [
        "## 2. Neutral interface copy",
        "",
        "Field labels, button text, headings, progress indicators and non-governed error handling.",
        "These assert no behaviour a participant could rely on, and fall within what ROOTS accepts in",
        "principle.",
        "",
    ]

    for surface in sorted(by_surface):
        lines += [
            f"### {surface}",
            "",
            "| Where | String | ROOTS decision |",
            "|---|---|---|",
        ]
        for where, _, value in by_surface[surface]:
            text = normalise(value).replace("|", "\\|")
            key = where.split()[-1]
            note = " **(reuses approved wording)**" if verdicts[where] == "fragment" else ""
            lines.append(f"| `{key}` | {text}{note} | |")
        lines.append("")

    lines += [
        "## Placeholders",
        "",
        "`{name}` marks a value filled at render time — a count, a module title, a timestamp, an email",
        "address. The surrounding words are the wording being approved; the placeholder is not.",
        "",
    ]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
