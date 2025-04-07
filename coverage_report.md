# Test Coverage Report

This report provides an overview of the test coverage for your smart contracts.

## Summary Report

The summary report provides a high-level overview of the test coverage for your smart contracts. It includes the following information:

*   **File:** The name of the smart contract file.
*   **% Stmts:** The percentage of statements (lines of code) in the contract that are covered by your tests. A statement is a piece of code that performs an action.
*   **% Branch:** The percentage of branches (decision points, like `if` statements) in the contract that are covered by your tests. Branch coverage is important for ensuring that all possible execution paths in your code are tested.
*   **% Funcs:** The percentage of functions in the contract that are called by your tests.
*   **% Lines:** The percentage of executable lines in the contract that are covered by your tests. This is similar to statement coverage but excludes things like comments and blank lines.

| File | % Stmts | Stmts | % Branch | Branch | % Funcs | Funcs | % Lines | Lines |
|---|---|---|---|---|---|---|---|---|
| contracts/GovernanceContract.sol | 80.85 | 38/47 | 82.61 | 19/23 | 66.67 | 8/12 | 85.29 | 58/68 |
| contracts/IncomeManagementContract.sol | 100.0 | 16/16 | 100.0 | 11/11 | 100.0 | 4/4 | 100.0 | 20/20 |
| contracts/Lock.sol | 100.0 | 5/5 | 100.0 | 3/3 | 100.0 | 2/2 | 100.0 | 7/7 |
| contracts/MembershipContract.sol | 100.0 | 16/16 | 100.0 | 10/10 | 100.0 | 7/7 | 100.0 | 25/25 |
| contracts/PaymentContract.sol | 100.0 | 5/5 | 100.0 | 2/2 | 100.0 | 4/4 | 100.0 | 6/6 |

## Detailed HTML Report

The detailed HTML report provides a much more granular view of the test coverage. It includes the following features:

*   **Drill-Down by File:** You can click on each contract file to see a detailed breakdown of the coverage.
*   **Color-Coded Source Code:** The source code of your contract is displayed with color-coding to indicate which lines are covered, partially covered, or not covered by tests:
    *   **Green:** Covered lines.
    *   **Yellow:** Partially covered lines (e.g., a branch was taken but not the other).
    *   **Red:** Uncovered lines.
*   **Clickable Branch Markers:** For uncovered branches, you can often click on a marker to see more information about why the branch was not taken.

To view the detailed HTML report, please refer to the `contracts/coverage/index.html` file. You can view this report by serving the `contracts/coverage` directory using a web server (e.g., `python -m http.server` in the `contracts` directory and then opening `http://localhost:8000` in your browser).
