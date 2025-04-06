# DCC User Stories and Acceptance Criteria

This document outlines the user stories and acceptance criteria for the Decentralised Consulting Collective (DCC) platform, based on the DCC whitepaper.

---

## 1. Founding Member

**User Story 1.1: Initial Capital Contribution**
*   **As a** Founding Member,
*   **I want to** contribute my initial capital (up to £500) to the DCC's designated setup fund,
*   **so that** the necessary infrastructure for the collective can be established and my founding membership is activated.

    **Acceptance Criteria:**
    *   Given I am a prospective Founding Member,
    *   When I send my capital contribution (e.g., via a specified wallet address or mechanism),
    *   Then the transaction is recorded (potentially off-chain initially, linked to the legal setup).
    *   And my status as a Founding Member is registered in the Membership Contract upon its deployment.
    *   And my contribution amount is tracked against my identity.
    *   And the contribution cannot exceed the £500 limit per founder.

**User Story 1.2: Initial Governance Setup**
*   **As a** Founding Member,
*   **I want to** participate in setting the initial rules and parameters within the smart contracts (e.g., initial entry fee for Voting Members, initial company income allocation percentage, initial voting mechanisms),
*   **so that** the DCC can operate according to the agreed-upon foundational principles.

    **Acceptance Criteria:**
    *   Given I am a Founding Member during the initial setup phase,
    *   When the core smart contracts (Governance, Income Management, Membership, Payment) are deployed,
    *   Then the initial parameters (entry fee, income split, etc.) reflect the decisions made by the Founding Members.
    *   And these initial parameters are stored immutably or require special founding member consensus to change during a defined initial period.

**User Story 1.3: Special Decision-Making Rights**
*   **As a** Founding Member,
*   **I want to** exercise special decision-making rights during the initial operational period,
*   **so that** I can guide the DCC's early development and ensure stability.

    **Acceptance Criteria:**
    *   Given I am a Founding Member within the defined initial period,
    *   When specific governance proposals are raised (e.g., major changes to core parameters),
    *   Then my vote carries the weight defined for Founding Members in the Governance Contract.
    *   And decisions requiring Founding Member consensus are processed according to the rules in the Governance Contract.
    *   And the duration or conditions for these special rights are clearly defined in the Governance Contract.

**User Story 1.4: Acting as Initial Director**
*   **As a** Founding Member appointed as an initial Director,
*   **I want to** fulfill the legal responsibilities of a company director for the registered DCC entity,
*   **so that** the DCC complies with England and Wales regulations.

    **Acceptance Criteria:**
    *   Given I am a Founding Member and appointed Director,
    *   When performing directorial duties (e.g., filings, legal oversight),
    *   Then these actions are conducted in accordance with UK company law.
    *   And I have the necessary authority (potentially managed off-chain initially) to oversee smart contract deployment and alignment with legal obligations.
    *   And I can authorize actions like setting initial consultant pay rates in the Payment Contract.

---

## 2. Voting Member

**User Story 2.1: Joining the DCC**
*   **As an** experienced professional,
*   **I want to** pay the current entry fee to the Membership Contract,
*   **so that** I can become a Voting Member of the DCC and gain voting rights.

    **Acceptance Criteria:**
    *   Given I am a prospective Voting Member,
    *   When I view the DCC platform/interface,
    *   Then the current entry fee required to join is clearly displayed (read from the Governance Contract).
    *   When I send the exact entry fee amount to the Membership Contract address,
    *   Then the Membership Contract verifies the payment.
    *   And upon successful verification, the Membership Contract registers my wallet address as a Voting Member.
    *   And the Membership Contract assigns me the standard voting power (e.g., 1 vote).
    *   And the received entry fee is automatically transferred to the Income Management Contract.
    *   And my membership status is publicly verifiable (e.g., via a contract read function).

**User Story 2.2: Participating in Governance Votes**
*   **As a** Voting Member,
*   **I want to** view active proposals and cast my vote on key decisions (e.g., changes to income sharing, entry fees, use of company funds),
*   **so that** I can participate in the democratic governance of the DCC.

    **Acceptance Criteria:**
    *   Given I am a registered Voting Member,
    *   When I access the governance section of the DCC platform/interface,
    *   Then I can see a list of active proposals managed by the Governance Contract.
    *   And each proposal clearly states its purpose, details, and voting deadline.
    *   When I choose to vote on a proposal,
    *   Then the interface allows me to cast my vote (e.g., 'Yes', 'No', 'Abstain').
    *   And my vote is recorded by the Governance Contract against my member identity.
    *   And I can only vote once per proposal.
    *   And the outcome of the vote is determined by the rules defined in the Governance Contract (e.g., simple majority, quorum) after the voting period ends.

**User Story 2.3: Receiving Profit Distributions**
*   **As a** Voting Member,
*   **I want to** receive my share of distributed company profits,
*   **so that** I benefit from the collective's success.

    **Acceptance Criteria:**
    *   Given I am a registered Voting Member,
    *   When the conditions for profit distribution are met (e.g., end of a fiscal period, successful governance vote to distribute),
    *   Then the Income Management Contract calculates the distributable profit amount based on retained company income.
    *   And the Income Management Contract calculates my individual share based on the rules (e.g., equal share per voting member).
    *   And the Income Management Contract automatically transfers my share of the profits to my registered wallet address.
    *   And the distribution transaction is recorded on the blockchain.

**User Story 2.4: Working on Projects (as a Consultant)**
*   **As a** Voting Member acting as a consultant,
*   **I want to** have my agreed-upon pay rate recorded and receive payments automatically for completed project work,
*   **so that** I am compensated fairly and transparently for my contributions.

    **Acceptance Criteria:**
    *   (See User Story 3.1 - similar process for recording rates and receiving payment, but applies to a Voting Member).

---

## 3. Non-Voting Member / Employee

**User Story 3.1: Receiving Payment for Work**
*   **As a** Non-Voting Member/Employee,
*   **I want to** have my agreed-upon pay rate (e.g., daily rate, salary) recorded in the Payment Contract and receive payments automatically for my work,
*   **so that** I am compensated reliably and transparently according to my agreement.

    **Acceptance Criteria:**
    *   Given I am an onboarded Non-Voting Member/Employee,
    *   When my engagement terms are agreed upon,
    *   Then my pay rate is securely recorded in the Payment Contract by an authorized party (e.g., Director).
    *   When I complete work (e.g., timesheet submitted/approved via an off-chain system linked to the contract),
    *   Then the Payment Contract calculates my earnings based on my recorded rate and verified work contribution.
    *   And the Income Management Contract automatically transfers the calculated payment to my registered wallet address upon trigger (e.g., project completion, payroll cycle).
    *   And the payment transaction is recorded on the blockchain.
    *   And I do not have voting rights in the Governance Contract.

---

## 4. Client

**User Story 4.1: Engaging the DCC**
*   **As a** Client,
*   **I want to** engage the DCC for consulting services and agree on project scope and fees,
*   **so that** I can leverage the expertise of DCC members for my business needs.

    **Acceptance Criteria:**
    *   Given I am a potential Client,
    *   When I interact with the DCC (e.g., through a website, contact person),
    *   Then I can understand the services offered and the types of expertise available.
    *   When an agreement is reached (likely via traditional off-chain contracts initially),
    *   Then the project scope, deliverables, and payment terms are clearly defined.
    *   And the DCC provides a designated address (the Income Management Contract address) for project payments.

**User Story 4.2: Paying for Services**
*   **As a** Client,
*   **I want to** make payments to the DCC's designated smart contract address upon project milestones or completion,
*   **so that** I fulfill my contractual obligations and the DCC can process consultant payments and manage income transparently.

    **Acceptance Criteria:**
    *   Given I am a Client with an ongoing project,
    *   When a payment milestone is reached or the project is completed according to the agreement,
    *   Then I can send the agreed payment amount (in the agreed currency/token) to the DCC's Income Management Contract address.
    *   And the Income Management Contract successfully receives and records the payment on the blockchain.
    *   And I receive confirmation of the payment receipt (potentially via off-chain communication or a transaction hash).

---

## 5. Administrator / Director

**User Story 5.1: Managing Legal Compliance**
*   **As an** Administrator/Director,
*   **I want to** ensure the DCC operates in compliance with all relevant laws and regulations in England and Wales,
*   **so that** the collective maintains its legal standing and operational integrity.

    **Acceptance Criteria:**
    *   Given I am an Administrator/Director,
    *   When managing the DCC's registered company,
    *   Then all necessary legal filings, reporting, and compliance tasks are performed accurately and on time.
    *   And the Articles of Association accurately reflect the use of smart contracts for governance and operations.

**User Story 5.2: Overseeing Smart Contract Operations**
*   **As an** Administrator/Director,
*   **I want to** oversee the deployment, maintenance, and secure operation of the DCC's smart contracts,
*   **so that** the technical infrastructure functions reliably and aligns with the collective's goals and legal obligations.

    **Acceptance Criteria:**
    *   Given I am an Administrator/Director,
    *   When new contracts or updates are deployed,
    *   Then they have undergone thorough security audits.
    *   And their deployment is managed securely.
    *   And I have mechanisms (potentially off-chain) to monitor contract health and activity.
    *   And I can authorize necessary administrative actions on the contracts as defined by their roles (e.g., setting initial rates in the Payment Contract, potentially pausing contracts in emergencies if designed).

**User Story 5.3: Managing Consultant Rates**
*   **As an** Administrator/Director (initially),
*   **I want to** record the agreed-upon pay rates for consultants (Voting and Non-Voting) in the Payment Contract,
*   **so that** the automated payment system functions correctly.

    **Acceptance Criteria:**
    *   Given I am an Administrator/Director with the appropriate permissions,
    *   When a consultant's pay rate is agreed upon,
    *   Then I can securely interact with the Payment Contract to store or update the rate associated with the consultant's identifier (e.g., wallet address).
    *   And the stored rate is used accurately by the Income Management Contract for payment calculations.

**User Story 5.4: Managing Non-Voting Members (Potential)**
*   **As an** Administrator/Director,
*   **I want to** manage the onboarding and potentially offboarding of Non-Voting Members/Employees,
*   **so that** the DCC can scale its delivery capacity effectively.

    **Acceptance Criteria:**
    *   Given I am an Administrator/Director,
    *   When bringing a Non-Voting Member onboard,
    *   Then their details and pay rate are registered (rate in Payment Contract, status potentially in Membership Contract or off-chain).
    *   And processes exist (potentially involving Governance Contract votes if exceeding certain thresholds) for managing the number and status of Non-Voting Members.

---