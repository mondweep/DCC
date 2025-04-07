import json

def generate_markdown_report(json_file, md_file):
    with open(json_file, 'r') as f:
        data = json.load(f)

    with open(md_file, 'w') as md:
        md.write("# Test Coverage Report\n\n")

        md.write("This report provides an overview of the test coverage for your smart contracts.\n\n")

        md.write("## Summary Report\n\n")
        md.write("The summary report provides a high-level overview of the test coverage for your smart contracts. It includes the following information:\n\n")
        md.write("*   **File:** The name of the smart contract file.\n")
        md.write("*   **% Stmts:** The percentage of statements (lines of code) in the contract that are covered by your tests. A statement is a piece of code that performs an action.\n")
        md.write("*   **% Branch:** The percentage of branches (decision points, like `if` statements) in the contract that are covered by your tests. Branch coverage is important for ensuring that all possible execution paths in your code are tested.\n")
        md.write("*   **% Funcs:** The percentage of functions in the contract that are called by your tests.\n")
        md.write("*   **% Lines:** The percentage of executable lines in the contract that are covered by your tests. This is similar to statement coverage but excludes things like comments and blank lines.\n\n")

        md.write("| File | % Stmts | Stmts | % Branch | Branch | % Funcs | Funcs | % Lines | Lines |\n")
        md.write("|---|---|---|---|---|---|---|---|---|\n")

        total_statements = 0
        total_branches = 0
        total_functions = 0
        total_lines = 0
        file_count = 0

        for file, coverage in data.items():
            statements_total = coverage['s'] is not None and len(coverage['s']) or 0
            branches_total = coverage['b'] is not None and len(coverage['b']) or 0
            functions_total = coverage['f'] is not None and len(coverage['f']) or 0
            lines_total = coverage['l'] is not None and len(coverage['l']) or 0

            statements_covered = coverage['s'] is not None and sum(1 for x in coverage['s'].values() if x > 0) or 0
            branches_covered = coverage['b'] is not None and sum(1 for x in coverage['b'].values() if x[0] + x[1] > 0) or 0
            functions_covered = coverage['f'] is not None and sum(1 for x in coverage['f'].values() if x > 0) or 0
            lines_covered = coverage['l'] is not None and sum(1 for x in coverage['l'].values() if x > 0) or 0

            statement_coverage = statements_total and round(statements_covered / statements_total * 100, 2) or 0
            branch_coverage = branches_total and round(branches_covered / branches_total * 100, 2) or 0
            function_coverage = functions_total and round(functions_covered / functions_total * 100, 2) or 0
            line_coverage = lines_total and round(lines_covered / lines_total * 100, 2) or 0

            md.write(f"| {file} | {statement_coverage} | {statements_covered}/{statements_total} | {branch_coverage} | {branches_covered}/{branches_total} | {function_coverage} | {functions_covered}/{functions_total} | {line_coverage} | {lines_covered}/{lines_total} |\n")

        md.write("\n## Detailed HTML Report\n\n")
        md.write("The detailed HTML report provides a much more granular view of the test coverage. It includes the following features:\n\n")
        md.write("*   **Drill-Down by File:** You can click on each contract file to see a detailed breakdown of the coverage.\n")
        md.write("*   **Color-Coded Source Code:** The source code of your contract is displayed with color-coding to indicate which lines are covered, partially covered, or not covered by tests:\n")
        md.write("    *   **Green:** Covered lines.\n")
        md.write("    *   **Yellow:** Partially covered lines (e.g., a branch was taken but not the other).\n")
        md.write("    *   **Red:** Uncovered lines.\n")
        md.write("*   **Clickable Branch Markers:** For uncovered branches, you can often click on a marker to see more information about why the branch was not taken.\n\n")
        md.write("To view the detailed HTML report, please refer to the `contracts/coverage/index.html` file. You can view this report by serving the `contracts/coverage` directory using a web server (e.g., `python -m http.server` in the `contracts` directory and then opening `http://localhost:8000` in your browser).\n")

if __name__ == "__main__":
    generate_markdown_report("contracts/coverage/coverage-final.json", "coverage_report.md")