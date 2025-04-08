## Voting Member

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

## Non-Voting Member

## Client

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